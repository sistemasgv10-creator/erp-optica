'use client';

import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Role } from '@prisma/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName: string;
  userRole: Role;
}

export function DashboardLayout({ children, userName, userRole }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar userRole={userRole} />
      <div className="flex-1 flex flex-col">
        <Header userName={userName} userRole={userRole} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
