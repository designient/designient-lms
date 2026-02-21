import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
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
        ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                GoogleProvider({
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                }),
            ]
            : []),
    ],
    session: { strategy: 'jwt', maxAge: 24 * 60 * 60 },
    trustHost: true,
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider !== 'google') {
                return true;
            }

            const emailInput = user.email?.trim();
            if (!emailInput) {
                return false;
            }

            // Invite-only Google SSO: only existing users are allowed.
            const existingUser = await prisma.user.findFirst({
                where: { email: { equals: emailInput, mode: 'insensitive' } },
            });

            if (!existingUser || !existingUser.isActive) {
                return false;
            }

            await prisma.user.update({
                where: { id: existingUser.id },
                data: {
                    emailVerified: true,
                    name: existingUser.name || user.name || 'Workspace User',
                    avatarUrl: existingUser.avatarUrl || user.image || null,
                },
            });

            if (existingUser.role === 'STUDENT') {
                await prisma.studentProfile.updateMany({
                    where: { userId: existingUser.id, status: 'INVITED' },
                    data: { status: 'ACTIVE' },
                });
            }

            (user as { id: string; role: string; isActive: boolean }).id = existingUser.id;
            (user as { id: string; role: string; isActive: boolean }).role = existingUser.role;
            (user as { id: string; role: string; isActive: boolean }).isActive = existingUser.isActive;
            user.name = existingUser.name || user.name || 'Workspace User';
            user.email = existingUser.email;

            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                if (account?.provider === 'google') {
                    const emailInput = user.email?.trim();
                    const existingUser = emailInput
                        ? await prisma.user.findFirst({
                            where: { email: { equals: emailInput, mode: 'insensitive' } },
                        })
                        : null;

                    if (!existingUser || !existingUser.isActive) {
                        return token;
                    }

                    token.id = existingUser.id;
                    token.role = existingUser.role;
                    token.isActive = existingUser.isActive;
                } else {
                    token.id = user.id as string;
                    token.role = (user as { role: string }).role;
                    token.isActive = (user as { isActive: boolean }).isActive;
                }

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
