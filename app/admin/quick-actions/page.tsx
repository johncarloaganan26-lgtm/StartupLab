'use client';

import { AdminLayout } from '@/components/admin-layout';
import { AuthGuard } from '@/components/auth-guard';
import { Users, Plus, Ticket, BarChart3, Clock, ScrollText, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function AdminQuickActionsPage() {
    const actions = [
        {
            title: 'Member Management',
            description: 'View and manage all system users',
            icon: Users,
            href: '/admin/users',
            color: 'blue'
        },
        {
            title: 'Create New Event',
            description: 'Schedule a new workshop or session',
            icon: Plus,
            href: '/admin/events/create',
            color: 'green'
        },
        {
            title: 'Review Audit Logs',
            description: 'Check system activity and changes',
            icon: ScrollText,
            href: '/admin/audit-logs',
            color: 'purple'
        },
        {
            title: 'System Reports',
            description: 'Generate analytics and statistics',
            icon: BarChart3,
            href: '/admin/reports',
            color: 'orange'
        },
        {
            title: 'Manage Events',
            description: 'Coordinate existing event details',
            icon: Calendar,
            href: '/admin/events',
            color: 'indigo'
        },
        {
            title: 'View Archive',
            description: 'Access past event records',
            icon: Clock,
            href: '/admin/archive',
            color: 'amber'
        }
    ];

    return (
        <AuthGuard requiredRole="admin">
            <AdminLayout>
                <div className="p-2 space-y-8 max-w-[1200px] mx-auto">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Quick Actions</h1>
                        <p className="text-sm text-muted-foreground mt-2 font-medium italic">Common administrative tasks and shortcuts.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link key={action.href} href={action.href} className="group">
                                    <div className="bg-card border border-border/60 p-8 rounded-lg shadow-sm hover:border-primary/50 transition-all hover:shadow-md flex flex-col items-center text-center space-y-4">
                                        <div className={`p-4 rounded-full transition-transform group-hover:scale-110 ${action.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                                                action.color === 'green' ? 'bg-green-500/10 text-green-600' :
                                                    action.color === 'purple' ? 'bg-purple-500/10 text-purple-600' :
                                                        action.color === 'orange' ? 'bg-orange-500/10 text-orange-600' :
                                                            action.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-600' :
                                                                'bg-amber-500/10 text-amber-600'
                                            }`}>
                                            <Icon className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg uppercase tracking-tight">{action.title}</h3>
                                            <p className="text-xs text-muted-foreground mt-1 px-4">{action.description}</p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </AdminLayout>
        </AuthGuard>
    );
}
