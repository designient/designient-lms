export type SyllabusDraftStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED';

export type SyllabusContentType = 'TEXT' | 'VIDEO' | 'FILE';

export interface SyllabusLesson {
    id?: string;
    title: string;
    contentType: SyllabusContentType;
    contentBody: string | null;
    position: number;
}

export interface SyllabusModule {
    id?: string;
    title: string;
    position: number;
    lessons: SyllabusLesson[];
}

export interface SyllabusSnapshot {
    modules: SyllabusModule[];
}

export interface SyllabusBuilderPermissions {
    canAccess: boolean;
    canEditLive: boolean;
    canEditDraft: boolean;
    canApprove: boolean;
    role: 'ADMIN' | 'MENTOR' | 'NONE';
    reason?: string;
}

export interface SyllabusDraftMeta {
    id: string;
    status: SyllabusDraftStatus;
    snapshot: SyllabusSnapshot;
    submittedAt: string | null;
    submittedBy: { id: string; name: string } | null;
    reviewedAt: string | null;
    reviewedBy: { id: string; name: string } | null;
    reviewComment: string | null;
    updatedAt: string;
}
