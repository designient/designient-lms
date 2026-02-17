import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Login — Designient LMS',
    description: 'Access the Designient learning platform. Log in as an admin, mentor, or student to manage cohorts, track progress, and access course materials.',
};

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
