import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

const THEME_BOOTSTRAP_SCRIPT = `
(() => {
  try {
    const THEME_KEY = 'designient-theme';
    const stored = localStorage.getItem(THEME_KEY);
    const theme = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    const hour = new Date().getHours();
    const timeBasedTheme = hour >= 7 && hour < 19 ? 'light' : 'dark';
    const resolved = theme === 'system' ? timeBasedTheme : theme;
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.dataset.theme = theme;
  } catch {}
})();
`;

export const metadata: Metadata = {
  title: 'Designient Workspace — CohortOS Platform',
  description: 'A premium CohortOS platform by Designient for admins, mentors, and students.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
