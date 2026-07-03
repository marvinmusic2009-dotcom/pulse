import React, { useState, useEffect } from 'react';
import { dbService } from '../services/db';
import type { User, InventoryItem, AuditLog } from '../services/db';
import { 
  Plus, AlertTriangle, ArrowUpDown, ShieldAlert, 
  ClipboardList, Package, Search
} from 'lucide-react';

interface InventoryProps {
  user: User;
}

export default function Inventory({ user }: InventoryProps) {
  const schoolId = user.school_id;

  // Data states
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  // New stock form fields
  const [drugName, setDrugName] = useState('');
  const [qty, setQty] = useState(100);
  const [unit, setUnit] = useState('tabs');
  const [reorderLvl, setReorderLvl] = useState(20);
  const [expiry, setExpiry] = useState('');
  const [modalError, setModalError] = useState('');

  // Adjust stock fields
  const [selectedItemId, setSelectedItemId] = useState('');
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustError, setAdjustError] = useState('');

  // Fetch inventory data
  const loadInventory = () => {
    setInventory(dbService.getInventory(schoolId));
    // Filter audit logs specifically related to stock movements
    const logs = dbService.getAuditLogs(schoolId).filter(l => 
      l.action.includes('Stock') || l.action.includes('Inventory')
    );
    setAuditLogs(logs);
  };

  useEffect(() => {
    loadInventory();
  }, [schoolId]);

  // Handle Add Item Submit
  const handleAddItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError('');

    if (!drugName || !qty || !unit || !expiry) {
      setModalError('Please fill in all required fields.');
      return;
    }

    try {
      dbService.addInventoryItem(schoolId, user.id, user.full_name, {
        drug_name: drugName,
        quantity: qty,
        unit,
        reorder_level: reorderLvl,
        expiry_date: expiry,
      });

      setShowAddModal(false);
      setDrugName('');
      setQty(100);
      setExpiry('');
      loadInventory();
    } catch(err: any) {
      setModalError(err.message || 'Error receiving stock.');
    }
  };

  // Handle Adjust Stock Submit
  const handleAdjustStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustError('');

    if (!selectedItemId || adjustQty === 0 || !adjustReason) {
      setAdjustError('Please fill in adjustment quantity and reason.');
      return;
    }

    const item = inventory.find(i => i.id === selectedItemId);
    if (!item) return;

    try {
      dbService.updateInventoryQuantity(
        schoolId, 
        user.id, 
        user.full_name, 
        item.drug_name, 
        adjustQty, 
        `Manual Adjustment: ${adjustReason}`
      );

      setShowAdjustModal(false);
      setSelectedItemId('');
      setAdjustQty(0);
      setAdjustReason('');
      loadInventory();
    } catch(err: any) {
      setAdjustError(err.message || 'Error adjusting stock.');
    }
  };

  // Status computation helpers
  const isLowStock = (item: InventoryItem) => item.quantity <= item.reorder_level;
  const isExpired = (item: InventoryItem) => new Date(item.expiry_date) < new Date();

  // Stats
  const lowStockCount = inventory.filter(isLowStock).length;
  const expiredCount = inventory.filter(isExpired).length;

  const filteredInventory = inventory.filter(item => 
    item.drug_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Pharmacy Overview Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pharmacy & Stock Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage school sickbay medicine inventory levels and dispensing audits</p>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button
            onClick={() => setShowAdjustModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs transition"
          >
            <ArrowUpDown className="w-4 h-4" />
            <span>Manual Adjustment</span>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl text-xs transition shadow-lg shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock Item</span>
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Med Classes</span>
            <span className="text-lg font-bold text-slate-800">{inventory.length}</span>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Low Stock Alert</span>
            <span className="text-lg font-bold text-amber-600">{lowStockCount} items</span>
          </div>
        </div>

        <div className="bg-white p-4 border border-slate-200 shadow-sm rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Expired Stock</span>
            <span className="text-lg font-bold text-rose-600">{expiredCount} items</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Inventory list Table */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-4 border-b">
            <span className="font-bold text-slate-800 text-sm">Active Stock Registry</span>
            <div className="relative w-48">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search drug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold border-collapse">
              <thead>
                <tr className="border-b text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5 px-2">Drug / Medication</th>
                  <th className="py-2.5 px-2">Stock Level</th>
                  <th className="py-2.5 px-2">Reorder Trigger</th>
                  <th className="py-2.5 px-2">Expiry Date</th>
                  <th className="py-2.5 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400 italic">No drugs matching query.</td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const low = isLowStock(item);
                    const expired = isExpired(item);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-3 px-2 font-bold text-slate-800">{item.drug_name}</td>
                        <td className="py-3 px-2">
                          <span className={`font-bold ${low ? 'text-amber-600' : 'text-slate-800'}`}>
                            {item.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-slate-400">{item.reorder_level} {item.unit}</td>
                        <td className={`py-3 px-2 ${expired ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          {item.expiry_date}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border capitalize ${
                            expired ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            low ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {expired ? 'Expired' : low ? 'Low Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dispensing Stock Logs Column */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <span>Stock Ledger Audit</span>
          </h4>
          <div className="flex-1 overflow-y-auto space-y-3 pt-3 pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-slate-400 text-xs italic py-6 text-center">No stock adjustment transactions logged.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 text-[11px] leading-relaxed">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-800">{log.action}</span>
                    <span className="text-[9px] font-normal text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-600 font-medium mt-1">{log.details}</p>
                  <span className="text-[9px] text-slate-400 block mt-1">By: {log.user_name}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ======================================= */}
      {/* MODALS: ADD STOCK / ADJUST STOCK        */}
      {/* ======================================= */}

      {/* 1. Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-base">Receive Pharmacy Stock</span>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddItemSubmit} className="p-6 space-y-4">
              
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Medication Name</label>
                <input
                  type="text"
                  placeholder="E.g., Paracetamol 500mg"
                  value={drugName}
                  onChange={(e) => setDrugName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Opening Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={qty}
                    onChange={(e) => setQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Packaging Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="tabs">Tablets (tabs)</option>
                    <option value="bottles">Bottles</option>
                    <option value="ml">Volume (ml)</option>
                    <option value="capsules">Capsules</option>
                    <option value="inhalers">Inhalers</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Reorder Limit Alert</label>
                  <input
                    type="number"
                    value={reorderLvl}
                    onChange={(e) => setReorderLvl(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Expiration Date</label>
                  <input
                    type="date"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold"
                >
                  Add Item
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* 2. Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-base">Manual Stock Adjustment</span>
              <button onClick={() => setShowAdjustModal(false)} className="text-slate-400 hover:text-white">
                &times;
              </button>
            </div>

            <form onSubmit={handleAdjustStockSubmit} className="p-6 space-y-4">
              
              {adjustError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {adjustError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Select Stock Medication</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  required
                >
                  <option value="">-- Choose Stock Medication --</option>
                  {inventory.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.drug_name} (Current: {item.quantity} {item.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Adjustment Quantity (use negative to subtract)</label>
                <input
                  type="number"
                  placeholder="E.g., 50 or -20"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Audit Reason</label>
                <input
                  type="text"
                  placeholder="Damaged, new shipments, expiry discard..."
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold"
                >
                  Confirm Adjustment
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
