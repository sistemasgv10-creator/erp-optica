import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';

export default async function AlmacenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <DashboardLayout userName={session.user.name} userRole={session.user.role}>
      {children}
    </DashboardLayout>
  );
}
