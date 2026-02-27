'use client';

import { useApp } from '@/contexts/app-context';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface PrintHeaderProps {
    variant?: 'admin' | 'user';
    reportTitle?: string;
}

export function PrintHeader({ variant = 'admin', reportTitle }: PrintHeaderProps) {
    const { user } = useApp();
    const pathname = usePathname();
    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        setCurrentTime(new Date().toLocaleString());
    }, []);

    const routeTitleMap: Record<string, string> = {
        '/admin': 'Admin Overview Report',
        '/admin/users': 'Users Report',
        '/admin/events': 'Events Report',
        '/admin/registrations': 'Registrations Report',
        '/admin/reports': 'Reports and Analytics',
        '/admin/archive': 'Archive Report',
        '/admin/audit-logs': 'Audit Trail Report',
        '/dashboard': 'Dashboard Report',
        '/dashboard/events': 'My Events Report',
        '/dashboard/registrations': 'My Registrations Report',
        '/dashboard/audit-logs': 'My Audit Logs Report',
    };

    const normalizedTitle = reportTitle
        || routeTitleMap[pathname]
        || (variant === 'admin' ? 'Administrative Report' : 'User Report');

    return (
        <div className="hidden print:block mb-6">
            <div className="flex flex-col items-center text-center gap-2">
                <div className="flex items-center gap-2">
                    <div className="relative h-10 w-28 overflow-hidden rounded-md border border-slate-300">
                        <Image src="/Dark-e1735336357773.png" alt="Logo" fill className="object-contain p-1" />
                    </div>
                    <h1 className="text-xl font-bold text-slate-900">Startup Lab Business Center</h1>
                </div>
                <p className="text-sm font-semibold text-slate-700">{normalizedTitle}</p>
            </div>

            <div className="mt-3 border-b border-slate-300" />
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                <p>Printed on: {currentTime}</p>
                <p>Printed by: {user?.name || 'Authorized Admin'}</p>
            </div>
        </div>
    );
}
