const inventoryService = require('./inventoryService');

let mode = 'static'; // 'static' | 'simulation' | 'scenario'
let intervalSeconds = 10;
let scenario = 'none'; // 'none' | 'flood' | 'cyclone' | 'earthquake'
let timer = null;

// Categories mapped to target scenario items for scenario triggers
const SCENARIO_ITEMS = {
  flood: {
    districts: ['Mumbai Suburban', 'Thane', 'Raigad', 'Ratnagiri'],
    items: ['IDRN-RE-001', 'IDRN-RE-003', 'IDRN-FOD-501', 'IDRN-WAT-302']
  },
  cyclone: {
    districts: ['Ratnagiri', 'Raigad', 'Thane'],
    items: ['IDRN-SHT-402', 'IDRN-GEN-601', 'IDRN-LGT-201', 'IDRN-COM-701']
  },
  earthquake: {
    districts: ['Pune', 'Thane', 'Mumbai Suburban', 'Raigad'],
    items: ['IDRN-MED-101', 'IDRN-SHT-401', 'IDRN-MED-103', 'IDRN-GEN-602']
  }
};

/**
 * Main simulation runner
 */
async function runStep() {
  try {
    const centers = await inventoryService.getAllCenters();
    if (!centers || centers.length === 0) return;

    const serverPort = process.env.PORT || 5050;
    const baseUrl = `http://localhost:${serverPort}/api/inventory`;

    if (mode === 'simulation') {
      await executeRandomEvent(centers, baseUrl);
    } else if (mode === 'scenario') {
      await executeScenarioEvent(centers, baseUrl);
    }
  } catch (err) {
    console.error('[SIMULATOR ERROR] Failed running simulator step:', err.message);
  }
}

/**
 * Automate random updates (Simulation Mode)
 */
async function executeRandomEvent(centers, baseUrl) {
  // Select random center
  const center = selectRandom(centers);
  const resource = selectRandom(center.resources);
  if (!resource) return;

  const roll = Math.random();
  let url = '';
  let payload = {};

  if (roll < 0.40) {
    // 40% chance of Truck Arrival / Replenishment (+ stock)
    const qty = Math.floor(Math.random() * 45) + 5; // 5 to 50
    url = `${baseUrl}/adjust`;
    payload = {
      centerId: center.center_id,
      itemCode: resource.item_code,
      quantityChange: qty,
      type: 'replenish'
    };
    console.log(`[SIMULATOR NET] Truck Arrival: Delivers +${qty} units of ${resource.name} to ${center.center_name}`);
  } else if (roll < 0.80) {
    // 40% chance of Emergency Dispatch (- stock)
    const qty = Math.floor(Math.random() * 20) + 2; // 2 to 22
    url = `${baseUrl}/adjust`;
    payload = {
      centerId: center.center_id,
      itemCode: resource.item_code,
      quantityChange: -qty,
      type: 'consume'
    };
    console.log(`[SIMULATOR NET] Dispatch: Dispatches -${qty} units of ${resource.name} from ${center.center_name}`);
  } else if (roll < 0.95) {
    // 15% chance of Inter-warehouse Transfer
    const otherCenters = centers.filter(c => c.center_id !== center.center_id);
    if (otherCenters.length === 0) return;
    const targetCenter = selectRandom(otherCenters);
    const qty = Math.floor(Math.random() * 10) + 1; // 1 to 10

    // Ensure source actually has enough stock to transfer
    const srcQty = resource.available_qty;
    const transferQty = Math.min(qty, srcQty);
    if (transferQty === 0) return;

    url = `${baseUrl}/transfer`;
    payload = {
      sourceCenterId: center.center_id,
      targetCenterId: targetCenter.center_id,
      itemCode: resource.item_code,
      quantity: transferQty
    };
    console.log(`[SIMULATOR NET] Transfer: Moving ${transferQty} units of ${resource.name} from ${center.center_name} to ${targetCenter.center_name}`);
  } else {
    // 5% chance of sudden drawdown spike
    const pct = parseFloat((0.2 + Math.random() * 0.4).toFixed(2)); // 20% to 60%
    url = `${baseUrl}/spike`;
    payload = {
      centerId: center.center_id,
      itemCode: resource.item_code,
      percentSpike: pct
    };
    console.log(`[SIMULATOR NET] Spike Alert: Triggering sudden ${Math.round(pct * 100)}% drawdown on ${resource.name} at ${center.center_name}`);
  }

  await postToEndpoint(url, payload);
}

/**
 * Execute disaster curves (Scenario Mode)
 */
async function executeScenarioEvent(centers, baseUrl) {
  const config = SCENARIO_ITEMS[scenario];
  if (!config) return;

  // Filter centers in vulnerable districts
  const targetCenters = centers.filter(c => config.districts.includes(c.district));
  if (targetCenters.length === 0) return;

  const center = selectRandom(targetCenters);
  
  // Find scenario items inside the center's resources
  const items = center.resources.filter(r => config.items.includes(r.item_code));
  if (items.length === 0) return;

  const resource = selectRandom(items);
  
  // Scenarios are consumption heavy to model emergency surges
  const roll = Math.random();
  let url = '';
  let payload = {};

  if (roll < 0.75) {
    // 75% chance of severe emergency surge dispatches
    const drawDownRate = parseFloat((0.35 + Math.random() * 0.35).toFixed(2)); // 35% to 70% drawdown
    url = `${baseUrl}/spike`;
    payload = {
      centerId: center.center_id,
      itemCode: resource.item_code,
      percentSpike: drawDownRate
    };
    console.log(`[SIMULATOR SURGE] ${scenario.toUpperCase()} DISASTER ONSET: Drawdown ${Math.round(drawDownRate * 100)}% on ${resource.name} at ${center.center_name}`);
  } else if (roll < 0.90) {
    // 15% chance of critical supply transfer into the disaster zone
    const sourceCenters = centers.filter(c => !config.districts.includes(c.district));
    if (sourceCenters.length === 0) return;

    const sourceCenter = selectRandom(sourceCenters);
    const sourceRes = sourceCenter.resources.find(r => r.item_code === resource.item_code);
    if (!sourceRes || sourceRes.available_qty < 5) return;

    const transferQty = Math.min(15, Math.floor(sourceRes.available_qty / 2));
    if (transferQty === 0) return;

    url = `${baseUrl}/transfer`;
    payload = {
      sourceCenterId: sourceCenter.center_id,
      targetCenterId: center.center_id,
      itemCode: resource.item_code,
      quantity: transferQty
    };
    console.log(`[SIMULATOR SURGE] Emergency Relief Dispatch: Relocating ${transferQty} units of ${resource.name} from fallback center ${sourceCenter.center_name} into emergency zone ${center.center_name}`);
  } else {
    // 10% chance of critical emergency replenishment airlift
    const qty = Math.floor(Math.random() * 60) + 20; // 20 to 80 units airlifted in
    url = `${baseUrl}/adjust`;
    payload = {
      centerId: center.center_id,
      itemCode: resource.item_code,
      quantityChange: qty,
      type: 'replenish'
    };
    console.log(`[SIMULATOR SURGE] Emergency Airlift: Dropping +${qty} units of ${resource.name} to ${center.center_name}`);
  }

  await postToEndpoint(url, payload);
}

/**
 * HTTP helper
 */
async function postToEndpoint(url, payload) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BeaconX-Warehouse-Simulator-Gateway'
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      const errTxt = await res.text();
      console.warn(`[SIMULATOR WARN] EOC endpoint rejected event: ${res.status} - ${errTxt}`);
    }
  } catch (err) {
    console.error('[SIMULATOR ERROR] Failed connecting to central server:', err.message);
  }
}

function selectRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Configure simulator properties
 */
function configure(newMode, newInterval, newScenario = 'none') {
  console.log(`[SIMULATOR] Reconfiguring: mode=${newMode}, interval=${newInterval}s, scenario=${newScenario}`);
  
  mode = newMode;
  intervalSeconds = parseInt(newInterval, 10) || 10;
  scenario = newScenario;

  if (timer) {
    clearInterval(timer);
    timer = null;
  }

  if (mode === 'simulation' || mode === 'scenario') {
    timer = setInterval(runStep, intervalSeconds * 1000);
    // Trigger immediate run on configure
    runStep();
  }
}

module.exports = {
  getStatus: () => ({ mode, intervalSeconds, scenario }),
  configure,
  triggerManualEvent: async (url, payload) => {
    console.log('[SIMULATOR] Manually triggering event:', url, payload);
    const serverPort = process.env.PORT || 5050;
    const fullUrl = `http://localhost:${serverPort}/api/inventory${url}`;
    await postToEndpoint(fullUrl, payload);
  }
};
