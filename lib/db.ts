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

    // Handle being blocked by another connection (e.g. another tab)
    this.on('blocked', () => {
      console.warn('Database access blocked by another connection');
    });

    // Handle version change (e.g. another tab upgrading the DB)
    this.on('versionchange', (event) => {
      console.warn('Database version change detected, closing current connection');
      this.close();
    });
  }
}

// Global singleton to prevent "Lock was stolen" errors during HMR/Next.js dev
const globalForDb = globalThis as unknown as { db: YuvrDatabase };

export const db = globalForDb.db || new YuvrDatabase();

if (process.env.NODE_ENV !== 'production') globalForDb.db = db;
