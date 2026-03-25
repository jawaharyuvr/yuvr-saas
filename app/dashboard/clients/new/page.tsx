'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function NewClientPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const address = formData.get('address') as string;

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      alert('You must be logged in to create a client');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('clients').insert([
      { 
        name, 
        email, 
        phone, 
        address,
        user_id: user.id
      }
    ]);

    if (error) {
      alert(error.message);
    } else {
      router.push('/dashboard/clients');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Client</h1>
          <p className="text-slate-500 text-sm">Fill in the details below to create a new client.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input name="name" label="Client Name" placeholder="e.g. Acme Corp" required />
              <Input name="email" label="Email Address" type="email" placeholder="client@example.com" required />
              <Input name="phone" label="Phone Number" placeholder="+1 (555) 000-0000" />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Address</label>
              <textarea 
                name="address"
                className="flex min-h-[100px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Client's billing address..."
              />
            </div>

            <div className="pt-4 flex gap-4">
              <Button type="submit" className="flex items-center gap-2" isLoading={loading}>
                <Save size={18} /> Save Client
              </Button>
              <Link href="/dashboard/clients">
                <Button variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
