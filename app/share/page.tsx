import PageFooter from '@/components/shared/page-footer';

export default function SharePage() {
  const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      zIndex: 1,
    }}>
      <h1 className="font-display" style={{
        fontStyle: 'italic',
        fontSize: '2.5rem',
        fontWeight: 400,
        color: 'var(--ink)',
        margin: '0 0 0.5rem',
      }}>
        Six Things
      </h1>
      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: '0.85rem',
        color: 'var(--soft-ink)',
        letterSpacing: '0.1em',
        marginBottom: '2.5rem',
      }}>
        a quiet daily attention practice
      </p>

      <div className="card-plain" style={{
        padding: '1.5rem',
        display: 'inline-block',
        marginBottom: '2rem',
        textAlign: 'center',
      }}>
        {/* QR Code image — generated at build time by scripts/generate-qr.js */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/qr.png"
          alt="QR code for Six Things app"
          width={220}
          height={220}
          style={{ display: 'block' }}
        />
        <p style={{
          fontFamily: 'Georgia, serif',
          fontSize: '0.75rem',
          color: 'var(--soft-ink)',
          margin: '0.75rem 0 0',
          letterSpacing: '0.04em',
        }}>
          scan to open
        </p>
      </div>

      <p style={{
        fontFamily: 'Georgia, serif',
        fontSize: '0.85rem',
        color: 'var(--soft-ink)',
        letterSpacing: '0.04em',
        marginBottom: '1rem',
      }}>
        {appUrl}
      </p>

      <p className="font-display" style={{
        fontStyle: 'italic',
        fontSize: '1rem',
        color: 'var(--soft-ink)',
        opacity: 0.7,
      }}>
        you don't have to find meaning. just notice.
      </p>

      <PageFooter />
    </div>
  );
}
