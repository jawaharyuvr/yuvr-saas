import React from 'react';
import { Card, CardContent } from './Card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
          <div className="h-4 w-32 bg-slate-100 rounded-md"></div>
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-24 bg-slate-200 rounded-lg"></div>
          <div className="h-10 w-32 bg-slate-200 rounded-lg"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 w-20 bg-slate-100 rounded"></div>
                  <div className="h-8 w-24 bg-slate-200 rounded"></div>
                </div>
                <div className="h-12 w-12 bg-slate-100 rounded-lg"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 h-[500px]">
          <div className="p-6 border-b border-slate-100 h-16 bg-slate-50/50"></div>
          <div className="p-6 space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full bg-slate-50 rounded-lg"></div>
            ))}
          </div>
        </Card>
        <Card className="lg:col-span-1 h-[500px]">
          <div className="p-6 border-b border-slate-100 h-16 bg-slate-50/50"></div>
          <div className="p-6 space-y-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 w-full bg-slate-50 rounded-lg"></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
