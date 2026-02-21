import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import prisma from './prisma';
import {
    clearLoginAttempts,
    getLoginAttemptState,
    getSecurityPolicy,
    registerFailedLoginAttempt,
    sessionTimeoutToMs,
} from '@/lib/security-policy';

declare module 'next-auth' {
    interface User {
        role: string;
        isActive: boolean;
    }
    interface Session {
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            isActive: boolean;
            sessionExpiresAt?: string;
        };
    }
}

declare module 'next-auth' {
    interface JWT {
        id: string;
        role: string;
        isActive: boolean;
        sessionExpiresAt?: number;
    }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                const emailInput = String(credentials.email).trim();
                const attemptKey = emailInput.toLowerCase();
                const policy = await getSecurityPolicy();
                const attemptState = await getLoginAttemptState(attemptKey);

                if (attemptState.isLocked) return null;

                const user = await prisma.user.findFirst({
                    where: { email: { equals: emailInput, mode: 'insensitive' } },
                });

                if (!user || !user.isActive) {
                    await registerFailedLoginAttempt(attemptKey, policy.maxLoginAttempts, policy.lockoutMinutes);
                    return null;
                }

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.passwordHash
                );
                if (!isValid) {
                    await registerFailedLoginAttempt(attemptKey, policy.maxLoginAttempts, policy.lockoutMinutes);
                    return null;
                }

                await clearLoginAttempts(attemptKey);

                if (user.role === 'STUDENT') {
                    await prisma.studentProfile.updateMany({
                        where: { userId: user.id, status: 'INVITED' },
                        data: { status: 'ACTIVE' },
                    });
                }

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    isActive: user.isActive,
                };
            },
        }),
    ],
    session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
    trustHost: true,
    pages: {
        signIn: '/login',
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.role = (user as { role: string }).role;
                token.isActive = (user as { isActive: boolean }).isActive;
                const policy = await getSecurityPolicy();
                token.sessionExpiresAt = Date.now() + sessionTimeoutToMs(policy.sessionTimeout);
            }

            return token;
        },
        async session({ session, token }) {
            session.user.id = token.id as string;
            session.user.role = token.role as string;
            session.user.isActive = token.isActive as boolean;
            if (typeof token.sessionExpiresAt === 'number') {
                session.user.sessionExpiresAt = new Date(token.sessionExpiresAt).toISOString();
            }
            return session;
        },
    },
});
