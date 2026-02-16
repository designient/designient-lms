export type PlanKey = 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type CurrencyKey = 'INR' | 'USD';

export interface PlanTier {
    plan: PlanKey;
    label: string;
    stage: string;
    monthlyPrice: Record<CurrencyKey, number>;
    yearlyPrice: Record<CurrencyKey, number>;
    overageRate: Record<CurrencyKey, number>;
    studentLimit: number;
    mentorLimit: number;
    cohortLimit: number;
    features: string[];
    recommended?: boolean;
}

export const PLAN_CATALOG: PlanTier[] = [
    {
        plan: 'FREE',
        label: 'Free',
        stage: 'Validate',
        monthlyPrice: { INR: 0, USD: 0 },
        yearlyPrice: { INR: 0, USD: 0 },
        overageRate: { INR: 0, USD: 0 },
        studentLimit: 10,
        mentorLimit: 1,
        cohortLimit: 1,
        features: [
            '10 active students',
            '1 mentor',
            '1 cohort',
            'Designient branding visible',
        ],
    },
    {
        plan: 'STARTER',
        label: 'Starter',
        stage: 'Run Premium Cohort',
        monthlyPrice: { INR: 1499900, USD: 19900 },
        yearlyPrice: { INR: 14999000, USD: 199000 },
        overageRate: { INR: 29900, USD: 350 },
        studentLimit: 75,
        mentorLimit: 5,
        cohortLimit: 10,
        features: [
            '75 active students',
            '5 mentors',
            '10 cohorts',
            'Assignment tracking',
            'Basic analytics',
            'Email support',
        ],
    },
    {
        plan: 'GROWTH',
        label: 'Growth',
        stage: 'Scale Multiple Cohorts',
        monthlyPrice: { INR: 3999900, USD: 49900 },
        yearlyPrice: { INR: 39999000, USD: 499000 },
        overageRate: { INR: 29900, USD: 350 },
        studentLimit: 250,
        mentorLimit: 20,
        cohortLimit: 25,
        recommended: true,
        features: [
            '250 active students',
            '20 mentors',
            '25 cohorts',
            'Advanced analytics',
            'Admin roles',
            'Priority support',
            'Custom domain',
        ],
    },
    {
        plan: 'ENTERPRISE',
        label: 'Enterprise',
        stage: 'Institutional-Grade',
        monthlyPrice: { INR: 9999900, USD: 149900 },
        yearlyPrice: { INR: 0, USD: 0 },
        overageRate: { INR: 0, USD: 0 },
        studentLimit: 600,
        mentorLimit: 50,
        cohortLimit: 100,
        features: [
            '600+ active students',
            'Multi-program structure',
            'API access',
            'SLA',
            'Dedicated onboarding',
            'Custom reporting',
        ],
    },
];

export const CURRENCY_SYMBOLS: Record<CurrencyKey, string> = {
    INR: '₹',
    USD: '$',
};

export function formatPrice(amountInSmallestUnit: number, currency: CurrencyKey): string {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    const amount = amountInSmallestUnit / 100;

    if (currency === 'INR') {
        return `${symbol}${amount.toLocaleString('en-IN')}`;
    }
    return `${symbol}${amount.toLocaleString('en-US')}`;
}

export function getPlanTier(plan: PlanKey): PlanTier | undefined {
    return PLAN_CATALOG.find(t => t.plan === plan);
}
