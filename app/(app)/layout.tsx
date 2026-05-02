import SessionProvider from '@/components/shared/session-provider';
import GuestBanner from '@/components/shared/guest-banner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <GuestBanner />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </SessionProvider>
  );
}
