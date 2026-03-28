import Dexie, { Table } from 'dexie';

export interface LocalInvoice {
  id?: string;
  invoice_number: string;
  client_id: string;
  total_amount: number;
  currency: string;
  status: 'unpaid' | 'paid';
  due_date: string;
  items: any[];
  synced: boolean;
  created_at?: string;
}

export interface LocalClient {
  id?: string;
  name: string;
  email: string;
  address?: string;
  synced: boolean;
}

export class YuvrDatabase extends Dexie {
  invoices!: Table<LocalInvoice>;
  clients!: Table<LocalClient>;

  constructor() {
    super('YuvrDB');
    this.version(1).stores({
      invoices: '++id, invoice_number, client_id, synced',
      clients: '++id, name, email, synced'
    });
  }
}

export const db = new YuvrDatabase();
