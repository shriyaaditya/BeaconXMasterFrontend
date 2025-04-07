
import React, { useState, useEffect } from 'react';

type DisasterType = 'earthquake' | 'flood' | 'hurricane' | 'wildfire';


const DisasterSurvivalGuide = () => {
  const [activeTab, setActiveTab] = useState<DisasterType>('earthquake');
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setAnimate(true);
    const timer = setTimeout(() => setAnimate(false), 1000);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const disasters: Record<DisasterType, {
        title: string;
        icon: string;
        hotspots: string[];
        tips: string[];
      }> = {
      earthquake: {
      title: "Earthquake Survival",
      icon: "🏚",
      hotspots: ["Under furniture", "Near outer walls", "Near windows", "In elevators", "Under power lines"],
      tips: [
        "Drop, Cover, Hold On",
        "Stay away from windows",
        "Don't run outside during shaking",
        "If in bed, stay there and protect your head",
        "Prepare emergency kit in advance"
      ]
    },
    flood: {
      title: "Flood Survival",
      icon: "🌊",
      hotspots: ["Low-lying areas", "Near rivers/streams", "Underground passages", "Flooded roads", "Damaged bridges"],
      tips: [
        "Move to higher ground",
        "Avoid walking through flowing water",
        "Don't drive through flooded roads",
        "Turn off electricity if water is rising",
        "Prepare to evacuate quickly"
      ]
    },
    hurricane: {
      title: "Hurricane Survival",
      icon: "🌀",
      hotspots: ["Mobile homes", "Near windows", "Under trees", "Low-lying coastal areas", "Areas prone to flooding"],
      tips: [
        "Board up windows",
        "Fill bathtubs with water for later use",
        "Stay in interior room away from windows",
        "Follow evacuation orders",
        "Have emergency supplies ready"
      ]
    },
    wildfire: {
      title: "Wildfire Survival",
      icon: "🔥",
      hotspots: ["Dry brush areas", "Wooden structures", "Tall grass fields", "Areas with limited exits", "Canyons"],
      tips: [
        "Create defensible space around home",
        "Keep emergency go-bag ready",
        "Close all windows and doors if nearby",
        "Follow evacuation orders immediately",
        "Wear mask to protect from smoke"
      ]
    }
  };

  const activeDisaster = disasters[activeTab];

  return (
    <div className="bg-gray-900 p-6 max-w-screen mx-auto">
      <div className="flex items-center justify-between pb-4 mb-6">
        <h1 className="text-4xl font-bold text-teal-400 tracking-tight">THE DISASTER SURVIVAL GUIDE</h1>
        <span className="text-5xl">{activeDisaster.icon}</span>
      </div>
      
      {/* Tabs */}
      <div className="flex mb-6 bg-gray-800 rounded-lg p-1">
        {(Object.keys(disasters) as DisasterType[]).map((key) => (
          <button 
            key={key}
            className={`flex-1 py-2 px-4 rounded-md transition-all duration-300 font-semibold ${
              activeTab === key ? 'bg-teal-600 text-white shadow-md' : 'text-teal-500 hover:bg-teal-600 hover:text-white'
            }`}
            onClick={() => setActiveTab(key)}
          >
            {disasters[key].title.split(" ")[0]}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${animate ? 'animate-pulse' : ''}`}>
        {/* Left column */}
        <div>
          <div className="bg-white/90 p-4 rounded-lg shadow-md border-l-8 border-red-500 mb-6">
            <h2 className="text-xl font-bold text-teal-800 mb-2">Stay away from {activeDisaster.title} Hotspots!</h2>
            <ul className="list-disc pl-6 text-red-600 font-medium">
              {activeDisaster.hotspots.map((hotspot, idx) => (
                <li key={idx} className="mb-1">{hotspot}</li>
              ))}
            </ul>
            <div className="bg-red-100 p-2 mt-4 rounded text-center font-bold text-red-700">
              DO NOT IGNORE WARNING SYSTEMS OR ALERTS!
            </div>
          </div>

          <div className="bg-white/90 p-4 rounded-lg shadow-md border-l-8 border-teal-500">
            <h2 className="text-xl font-bold text-teal-800 mb-2">Limit Exposure</h2>
            <p className="mb-3">
              The aftermath of disasters can be just as dangerous. Stay informed but limit exposure to distressing news and images for mental wellbeing.
            </p>
            <div className="flex items-center justify-center bg-teal-100 p-3 rounded-lg">
              <div className="text-6xl mr-4">🧠</div>
              <div className="text-sm">
                Take care of your mental health during and after disasters. Seek support if needed.
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div>
          <div className="bg-white/90 p-4 rounded-lg shadow-md border-r-8 border-teal-500 mb-6">
            <h2 className="text-xl font-bold text-teal-800 mb-2">Survival Tips</h2>
            <div className="mb-4">
              {activeDisaster.tips.map((tip, idx) => (
                <div key={idx} className="flex items-center mb-2">
                  <div className="bg-teal-500 text-white rounded-full h-6 w-6 flex items-center justify-center mr-2">✓</div>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/90 p-4 rounded-lg shadow-md border-r-8 border-amber-500">
            <h2 className="text-2xl font-bold text-amber-600 mb-2">USE YOUR BRAINS</h2>
            <p className="mb-4">Before you make any decisions during a disaster, ask yourself:</p>
            <div className="bg-amber-100 p-3 rounded-lg text-center">
              <p><span className="font-bold text-red-500">T</span>houghtful</p>
              <p><span className="font-bold text-red-500">H</span>elpful</p>
              <p><span className="font-bold text-red-500">I</span>nformed</p>
              <p><span className="font-bold text-red-500">N</span>ecessary</p>
              <p><span className="font-bold text-red-500">K</span>ind to yourself & others</p>
            </div>
            <div className="text-center mt-4 font-bold text-amber-700">
              If not, reconsider your actions!
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 p-4 bg-gray-800 text-white rounded-lg text-center">
        <h2 className="text-xl font-bold mb-2">Ask for help!</h2>
        <p>If you are in danger or need assistance during a disaster, contact emergency services immediately.</p>
        <p className="font-bold mt-2">Emergency: 911 • FEMA: 1-800-621-3362</p>
      </div>
    </div>

  );
};

export default DisasterSurvivalGuide;