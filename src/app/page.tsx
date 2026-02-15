import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: '700px', padding: '2rem' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.1, marginBottom: '1.5rem' }}>
          Learn Without{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Limits
          </span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: '2rem', lineHeight: 1.7 }}>
          Access expert-led courses, hands-on assignments, and personalized feedback — all in one platform.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/courses">
            <button className="btn btn-primary btn-lg">Browse Courses</button>
          </Link>
          <Link href="/signup">
            <button className="btn btn-secondary btn-lg">Get Started</button>
          </Link>
        </div>
      </div>
    </div>
  );
}
