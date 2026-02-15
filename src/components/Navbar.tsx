'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);

    const role = session?.user?.role;
    const isAuth = !!session?.user;

    const isActive = (path: string) =>
        pathname === path || pathname.startsWith(path + '/') ? 'active' : '';

    return (
        <nav className="navbar">
            <Link href="/" className="navbar-brand">
                📚 <span>LearnHub</span>
            </Link>

            <button className="navbar-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? '✕' : '☰'}
            </button>

            <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
                {!isAuth && (
                    <>
                        <li><Link href="/courses" className={isActive('/courses')}>Courses</Link></li>
                        <li><Link href="/login" className={isActive('/login')}>Log In</Link></li>
                        <li><Link href="/signup"><button className="btn btn-primary btn-sm">Sign Up</button></Link></li>
                    </>
                )}

                {isAuth && role === 'STUDENT' && (
                    <>
                        <li><Link href="/courses" className={isActive('/courses')}>Catalog</Link></li>
                        <li><Link href="/my-courses" className={isActive('/my-courses')}>My Courses</Link></li>
                        <li><Link href="/grades" className={isActive('/grades')}>Grades</Link></li>
                    </>
                )}

                {isAuth && (role === 'INSTRUCTOR' || role === 'ADMIN') && (
                    <>
                        <li><Link href="/dashboard" className={isActive('/dashboard')}>Dashboard</Link></li>
                        <li><Link href="/dashboard/courses" className={isActive('/dashboard/courses')}>Courses</Link></li>
                        <li><Link href="/dashboard/submissions" className={isActive('/dashboard/submissions')}>Submissions</Link></li>
                        {role === 'ADMIN' && (
                            <li><Link href="/dashboard/users" className={isActive('/dashboard/users')}>Users</Link></li>
                        )}
                    </>
                )}
            </ul>

            {isAuth && (
                <div className="navbar-user">
                    <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                        {session.user.name}
                    </span>
                    <div className="navbar-avatar">
                        {session.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                        Logout
                    </button>
                </div>
            )}
        </nav>
    );
}
