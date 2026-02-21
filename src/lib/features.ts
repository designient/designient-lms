function parseBooleanFlag(value: string | undefined, fallback: boolean): boolean {
    if (value === undefined) return fallback;
    const normalized = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
    if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
    return fallback;
}

export function isSyllabusApprovalFlowEnabled(): boolean {
    return parseBooleanFlag(process.env.SYLLABUS_APPROVAL_FLOW, true);
}
