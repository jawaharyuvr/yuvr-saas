'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Package, Plus, Search, AlertCircle, Edit2, Trash2, Tag, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Product {
  id: string;
  name: string;
  sku: string;
  unit_price: number;
  current_stock: number;
  min_stock: number;
  unit: string;
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    sku: '',
    unit_price: 0,
    current_stock: 0,
    min_stock: 5,
    unit: 'Pcs'
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
          throw new Error('Database table "products" not found. Please run the migration script in your Supabase SQL Editor.');
        }
        throw error;
      }
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingProduct) {
        const { error } = await supabase
          .from('products')
          .update(form)
          .eq('id', editingProduct.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert({ ...form, user_id: user.id });
        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchInventory();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert(error.message);
    else fetchInventory();
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
          <p className="text-slate-500 text-sm">Track your products, stock levels, and low stock alerts.</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setForm({ name: '', sku: '', unit_price: 0, current_stock: 0, min_stock: 5, unit: 'Pcs' }); setIsModalOpen(true); }} className="flex items-center gap-2">
          <Plus size={18} />
          Add Product
        </Button>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
           <div className="px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2">
              <AlertCircle size={16} className="text-amber-500" />
              <span className="text-xs font-bold text-amber-700 uppercase">
                 {products.filter(p => p.current_stock <= p.min_stock).length} Low Stock
              </span>
           </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold tracking-widest">
              <tr>
                <th className="px-6 py-4">Product / SKU</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Price</th>
                <th className="px-6 py-4 text-right">Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Fetching your inventory...</td></tr>
              ) : filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{p.sku || 'No SKU'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.current_stock <= p.min_stock ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold uppercase tracking-tighter">Low Stock</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-tighter">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                      ${p.unit_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-black ${p.current_stock <= p.min_stock ? 'text-rose-600' : 'text-slate-900'}`}>{p.current_stock}</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase">{p.unit}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                         <button onClick={() => { setEditingProduct(p); setForm(p); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                         <button onClick={() => handleDelete(p.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <Package size={32} className="text-slate-200" />
                      </div>
                      <p className="font-bold text-slate-900">Your inventory is empty</p>
                      <p className="text-sm text-slate-500">Start adding products to track stock levels.</p>
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg shadow-2xl overflow-hidden">
             <div className="bg-indigo-600 p-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   <Package size={20} />
                   {editingProduct ? 'Update Product' : 'Add New Product'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white transition-colors">✕</button>
             </div>
             <CardContent className="p-6">
                <form onSubmit={handleSave} className="space-y-6">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Input label="Product Name" placeholder="e.g. Wireless Mouse" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                      </div>
                      <Input label="SKU / Barcode" placeholder="e.g. WH-1000XM4" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} />
                      <Input label="Unit Price ($)" type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm({...form, unit_price: parseFloat(e.target.value)})} required />
                      <Input label="Initial Stock" type="number" value={form.current_stock} onChange={(e) => setForm({...form, current_stock: parseInt(e.target.value)})} required />
                      <Input label="Minimum Stock Alert" type="number" value={form.min_stock} onChange={(e) => setForm({...form, min_stock: parseInt(e.target.value)})} required />
                      <div className="space-y-1.5">
                         <label className="text-sm font-medium text-slate-700">Unit</label>
                         <select className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})}>
                            <option value="Pcs">Pieces (Pcs)</option>
                            <option value="Kg">Kilograms (Kg)</option>
                            <option value="Mtr">Meters (Mtr)</option>
                            <option value="Box">Boxes</option>
                         </select>
                      </div>
                   </div>
                   <div className="flex gap-3 pt-4 border-t">
                      <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                      <Button type="submit" className="flex-1 bg-indigo-600">{editingProduct ? 'Update Inventory' : 'Add to Inventory'}</Button>
                   </div>
                </form>
             </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
