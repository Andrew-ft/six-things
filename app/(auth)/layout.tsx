import SessionProvider from '@/components/shared/session-provider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </SessionProvider>
  );
}
