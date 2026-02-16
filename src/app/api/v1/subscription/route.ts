import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError, handleApiError } from '@/lib/errors';
import { withAuth } from '@/lib/middleware/rbac';
import { subscriptionUpdateSchema, formatZodErrors } from '@/lib/validations';
import { logAudit } from '@/lib/audit';
import { PLAN_CATALOG, type PlanKey, type CurrencyKey } from '@/lib/plan-catalog';

function getDefaultSubscriptionData() {
    const growth = PLAN_CATALOG.find(t => t.plan === 'GROWTH')!;
    return {
        plan: 'GROWTH' as const,
        status: 'ACTIVE' as const,
        billingCycle: 'MONTHLY' as const,
        price: growth.monthlyPrice.INR,
        currency: 'INR',
        overageRate: growth.overageRate.INR,
        studentLimit: growth.studentLimit,
        mentorLimit: growth.mentorLimit,
        cohortLimit: growth.cohortLimit,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
}

// GET /api/v1/subscription
export const GET = withAuth(
    async () => {
        try {
            let subscription = await prisma.subscription.findFirst();

            if (!subscription) {
                subscription = await prisma.subscription.create({
                    data: getDefaultSubscriptionData(),
                });
            }

            const [studentCount, mentorCount, cohortCount] = await Promise.all([
                prisma.studentProfile.count(),
                prisma.mentorProfile.count(),
                prisma.cohort.count({ where: { status: 'ACTIVE' } }),
            ]);

            const overageCount = Math.max(0, studentCount - subscription.studentLimit);
            const overageMonthlyCost = overageCount * subscription.overageRate;

            return apiSuccess({
                plan: subscription.plan,
                status: subscription.status,
                billingCycle: subscription.billingCycle,
                price: subscription.price,
                currency: subscription.currency,
                overageRate: subscription.overageRate,
                studentLimit: subscription.studentLimit,
                mentorLimit: subscription.mentorLimit,
                cohortLimit: subscription.cohortLimit,
                currentPeriodStart: subscription.currentPeriodStart.toISOString(),
                currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
                usage: {
                    students: studentCount,
                    mentors: mentorCount,
                    cohorts: cohortCount,
                },
                overage: {
                    count: overageCount,
                    monthlyCost: overageMonthlyCost,
                },
            });
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);

// PUT /api/v1/subscription
export const PUT = withAuth(
    async (req: NextRequest, _ctx, user) => {
        try {
            const body = await req.json();
            const parsed = subscriptionUpdateSchema.safeParse(body);

            if (!parsed.success) {
                return apiError('Validation failed', 422, 'VALIDATION_ERROR', formatZodErrors(parsed.error));
            }

            let subscription = await prisma.subscription.findFirst();
            if (!subscription) {
                subscription = await prisma.subscription.create({
                    data: getDefaultSubscriptionData(),
                });
            }

            const newPlan = (parsed.data.plan || subscription.plan) as PlanKey;
            const newCycle = (parsed.data.billingCycle || subscription.billingCycle) as 'MONTHLY' | 'YEARLY';
            const newCurrency = (parsed.data.currency || subscription.currency) as CurrencyKey;

            const tier = PLAN_CATALOG.find(t => t.plan === newPlan);
            if (!tier) {
                return apiError('Invalid plan', 400, 'INVALID_PLAN');
            }

            const price = newCycle === 'YEARLY'
                ? tier.yearlyPrice[newCurrency]
                : tier.monthlyPrice[newCurrency];

            const periodDays = newCycle === 'YEARLY' ? 365 : 30;

            const updated = await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    plan: newPlan,
                    billingCycle: newCycle,
                    currency: newCurrency,
                    price,
                    overageRate: tier.overageRate[newCurrency],
                    studentLimit: tier.studentLimit,
                    mentorLimit: tier.mentorLimit,
                    cohortLimit: tier.cohortLimit,
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000),
                },
            });

            await logAudit(user.id, 'SUBSCRIPTION_UPDATED', 'Subscription', subscription.id);

            return apiSuccess(updated);
        } catch (error) {
            return handleApiError(error);
        }
    },
    ['ADMIN']
);
