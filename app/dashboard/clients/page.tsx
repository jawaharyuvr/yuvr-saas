'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Mail, MapPin, Phone, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { useTranslation } from '@/contexts/LanguageContext';

interface Client {
  id: string;
  name: string;
  email: string;
  address: string;
  phone: string;
  created_at: string;
}

export default function ClientsPage() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true });

    if (!error && data) {
      setClients(data);
    }
    setLoading(false);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('clients.deleteConfirm') || 'Are you sure you want to delete this client? All associated invoices will also be affected.')) return;
    
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
    } else {
      fetchClients();
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingClient) return;

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const updates = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
    };

    const { error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', editingClient.id);

    if (error) {
      alert(error.message);
    } else {
      setIsEditModalOpen(false);
      setEditingClient(null);
      fetchClients();
    }
    setIsSubmitting(false);
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t('clients.title')}</h1>
          <p className="text-slate-500 text-sm">{t('clients.subtitle')}</p>
        </div>
        <Link href="/dashboard/clients/new">
          <Button className="flex items-center gap-2">
            <Plus size={18} />
            {t('clients.addClient')}
          </Button>
        </Link>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder={t('common.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-40 bg-slate-50">
                <div />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:border-indigo-200 transition-colors group relative overflow-hidden">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg uppercase">
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(client)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(client.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {client.name}
                </h3>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Mail size={14} className="shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Phone size={14} className="shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center text-slate-500">
          <div className="mx-auto w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
            <Users size={24} className="text-slate-400" />
          </div>
          <h3 className="text-sm font-medium text-slate-900">{t('clients.empty')}</h3>
          <p className="text-sm mt-1">{t('clients.emptyDesc')}</p>
          <Link href="/dashboard/clients/new" className="mt-4 inline-block">
            <Button variant="outline" size="sm">{t('clients.addClient')}</Button>
          </Link>
        </Card>
      )}

      {editingClient && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={t('common.edit')}
          maxWidth="xl"
        >
          <form onSubmit={handleUpdate} className="space-y-4 p-1">
            <Input 
              name="name" 
              label={t('clients.name')} 
              defaultValue={editingClient.name} 
              required 
            />
            <Input 
              name="email" 
              label={t('clients.email')} 
              type="email" 
              defaultValue={editingClient.email} 
              required 
            />
            <Input 
              name="phone" 
              label={t('clients.phone')} 
              defaultValue={editingClient.phone || ''} 
            />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">{t('clients.address')}</label>
              <textarea 
                name="address"
                defaultValue={editingClient.address || ''}
                className="flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder={t('clients.addressPlaceholder') || "Client's billing address..."}
              />
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Users({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
