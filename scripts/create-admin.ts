import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import bcrypt from 'bcryptjs';
import readline from 'readline';

// Connection logic mirrored exactly from prisma/seed.ts
// Note: verify that DATABASE_URL is set in .env
if (!process.env.DATABASE_URL) {
    console.error('❌ Error: DATABASE_URL is not defined in environment.');
    process.exit(1);
}

// @ts-ignore - The seed.ts seems to use this signature
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
};

async function main() {
    console.log('👑 Create Super Admin User');
    console.log('-------------------------');

    try {
        const name = await question('Name: ');
        if (!name) throw new Error('Name is required');

        const email = await question('Email: ');
        if (!email) throw new Error('Email is required');

        const password = await question('Password: ');
        if (!password || password.length < 8) throw new Error('Password must be at least 8 characters');

        console.log('\nCreating admin account...');

        // Check connection by trying a simple count or find
        // This helps fail fast if connection is bad
        await prisma.user.count();

        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) {
            throw new Error(`User with email ${email} already exists.`);
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                role: 'ADMIN',
                isActive: true,
                emailVerified: true,
            },
        });

        console.log(`\n✅ Admin user created successfully!`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

main();
