'use client';

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ label, value, icon: Icon, trend }: StatCardProps) {
  return (
    <Card className="group bg-card/50 backdrop-blur-sm border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-8 -mt-8 transition-all group-hover:bg-primary/10" />
      <CardContent className="p-6">
        <div className="flex items-start justify-between relative z-10">
          <div className="space-y-1">
            <p className="text-[12px] text-muted-foreground font-bold uppercase tracking-wider">{label}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black text-foreground tracking-tight">{value}</p>
              {trend && (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${trend.isPositive ? 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' : 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                  {trend.isPositive ? '↑' : '↓'} {trend.value}%
                </div>
              )}
            </div>
            {trend && <p className="text-[10px] text-muted-foreground font-medium">vs last month</p>}
          </div>
          {Icon && (
            <div className="p-2.5 bg-primary/10 rounded-xl group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

