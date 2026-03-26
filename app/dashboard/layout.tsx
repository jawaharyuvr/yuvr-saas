import { Sidebar } from '../../components/Sidebar';
import { SessionGuard } from '../../components/SessionGuard';
import { DynamicBackground } from '@/components/ui/DynamicBackground';
import { InactivityTimeout } from '../../components/InactivityTimeout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionGuard>
      <InactivityTimeout />
      <div className="flex h-screen bg-transparent relative overflow-hidden">
        <DynamicBackground />
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </SessionGuard>
  );
}
