'use client';

import { DashboardLayout } from '@/components/dashboard-layout';
import { AuthGuard } from '@/components/auth-guard';
import { Calendar, Ticket, Users, ScrollText, User, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function UserQuickActionsPage() {
    const actions = [
        {
            title: 'Discover Events',
            description: 'Explore and join upcoming workshops',
            icon: Calendar,
            href: '/dashboard/events',
            color: 'blue'
        },
        {
            title: 'My Registrations',
            description: 'Manage your active registrations',
            icon: Ticket,
            href: '/dashboard/registrations',
            color: 'green'
        },
        {
            title: 'Update Profile',
            description: 'Change your personal information',
            icon: User,
            href: '/dashboard/profile',
            color: 'purple'
        },
        {
            title: 'Activity Logs',
            description: 'Review your system interactions',
            icon: ScrollText,
            href: '/dashboard/audit-logs',
            color: 'orange'
        }
    ];

    return (
        <AuthGuard requiredRole="attendee">
            <DashboardLayout>
                <div className="p-2 space-y-8 max-w-[1200px] mx-auto">
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">Member Actions</h1>
                        <p className="text-sm text-muted-foreground mt-2 font-medium italic">Quick access to member features and services.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-[800px]">
                        {actions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link key={action.href} href={action.href} className="group">
                                    <div className="bg-card border border-border/60 p-10 rounded-lg shadow-sm hover:border-primary/50 transition-all hover:shadow-md flex flex-col items-center text-center space-y-4">
                                        <div className={`p-5 rounded-full transition-transform group-hover:scale-110 ${action.color === 'blue' ? 'bg-blue-500/10 text-blue-600' :
                                                action.color === 'green' ? 'bg-green-500/10 text-green-600' :
                                                    action.color === 'purple' ? 'bg-purple-500/10 text-purple-600' :
                                                        'bg-orange-500/10 text-orange-600'
                                            }`}>
                                            <Icon className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl uppercase tracking-tight">{action.title}</h3>
                                            <p className="text-sm text-muted-foreground mt-1 px-4">{action.description}</p>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </DashboardLayout>
        </AuthGuard>
    );
}
