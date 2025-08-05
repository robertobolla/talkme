import ProfileProtection from '@/components/ProfileProtection';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileProtection>
      {children}
    </ProfileProtection>
  );
} 