
import { Suspense } from 'react';
import InventoryClient from '@/components/Inventory';

export default function InventoryPage() {
  return (
    <Suspense fallback={<div>Loading inventory...</div>}>
      <InventoryClient />
    </Suspense>
  );
}
