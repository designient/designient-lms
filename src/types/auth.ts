export interface AuthCapabilityItem {
    label: string;
}

export interface AuthTrustItem {
    label: string;
}

export interface AuthBrandCopy {
    eyebrow: string;
    headline: string;
    description: string;
    capabilities: AuthCapabilityItem[];
    trust: AuthTrustItem[];
}

export interface AuthScreenCopy {
    title: string;
    subtitle: string;
}

export interface AuthLinkItem {
    label: string;
    href: string;
}
