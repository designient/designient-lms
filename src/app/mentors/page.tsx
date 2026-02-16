'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
    MentorFilters,
    MentorStatus
} from '@/components/mentors/MentorFilters';
import {
    MentorsTable,
    Mentor,
    AssignedCohort
} from '@/components/mentors/MentorsTable';
import { MentorDrawer } from '@/components/mentors/MentorDrawer';
import {
    MentorForm,
    MentorFormData,
    MentorFormFooter
} from '@/components/mentors/MentorForm';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { Plus, Loader2 } from 'lucide-react';
import { PageName } from '@/types';
import { apiClient } from '@/lib/api-client';

interface ApiMentor {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    specialization?: string;
    status: string;
    cohortCount?: number;
    maxCohorts?: number;
    rating?: number;
    bio?: string;
    phone?: string;
    whatsappOptIn?: boolean;
    cohorts?: Array<{ id: string; name: string; status: string }>;
    joinDate?: string;
}

function transformMentor(raw: ApiMentor): Mentor {
    const statusMap: Record<string, Mentor['status']> = {
        'ACTIVE': 'Active',
        'INACTIVE': 'Inactive',
        'Active': 'Active',
        'Inactive': 'Inactive',
    };

    const assignedCohorts: AssignedCohort[] = (raw.cohorts || []).map(c => ({
        id: c.id,
        name: c.name,
        status: (c.status as AssignedCohort['status']) || 'Active',
    }));

    return {
        id: raw.id,
        name: raw.name || '',
        email: raw.email || '',
        phone: raw.phone,
        whatsappOptIn: raw.whatsappOptIn,
        status: statusMap[raw.status] || 'Active',
        assignedCohorts,
        lastActive: '',
        joinDate: raw.joinDate
            ? new Date(raw.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : '',
        specialty: raw.specialization || '',
        bio: raw.bio,
        maxCohorts: raw.maxCohorts ?? 3,
        rating: raw.rating ?? 0,
        totalReviews: 0,
        totalStudentsMentored: 0,
        availabilityStatus: (raw.cohortCount ?? 0) >= (raw.maxCohorts ?? 3) ? 'Unavailable' : 'Available',
    };
}

type DrawerMode = 'view' | 'create' | 'edit';

const specialtyToValue: Record<string, string> = {
    'Design Systems': 'design-systems',
    'Product Design': 'product-design',
    'UX Strategy': 'ux-strategy',
    'UI Design': 'ui-design',
    'UX Research': 'ux-research',
    'Interaction Design': 'interaction-design',
    'Career Development': 'career-development'
};

const valueToSpecialty: Record<string, string> = {
    'design-systems': 'Design Systems',
    'product-design': 'Product Design',
    'ux-strategy': 'UX Strategy',
    'ui-design': 'UI Design',
    'ux-research': 'UX Research',
    'interaction-design': 'Interaction Design',
    'career-development': 'Career Development'
};

export default function MentorsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [mentors, setMentors] = useState<Mentor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<MentorStatus>('All');
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<DrawerMode>('view');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const fetchMentors = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get<{ mentors: ApiMentor[] }>('/api/v1/mentors?limit=50');
            setMentors(response.mentors.map(transformMentor));
        } catch (error) {
            console.error('Failed to fetch mentors:', error);
            toast({
                title: 'Error',
                description: 'Failed to load mentors. Please try again.',
                variant: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchMentors();
    }, [fetchMentors]);

    const filteredMentors = useMemo(() => {
        return mentors.filter((mentor) => {
            const matchesSearch =
                mentor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                mentor.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter =
                activeFilter === 'All' || mentor.status === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [mentors, searchQuery, activeFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredMentors.length / itemsPerPage);
    const paginatedMentors = filteredMentors.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, activeFilter]);

    const handleNavigate = (page: PageName) => {
        router.push(`/${page}`);
    };

    const handleMentorClick = (mentor: Mentor) => {
        setSelectedMentor(mentor);
        setDrawerMode('view');
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => {
            setSelectedMentor(null);
            setDrawerMode('view');
        }, 200);
    };

    const handleAddMentor = () => {
        setSelectedMentor(null);
        setDrawerMode('create');
        setIsDrawerOpen(true);
    };

    const handleEditMentor = () => {
        setDrawerMode('edit');
    };

    const handleUpdateMentor = (updatedMentor: Mentor) => {
        setSelectedMentor(updatedMentor);
        setMentors((prev) =>
            prev.map((m) => (m.id === updatedMentor.id ? updatedMentor : m))
        );
        toast({
            title: 'Mentor Updated',
            description: `${updatedMentor.name}'s profile has been updated.`,
            variant: 'success'
        });
    };

    const handleDeactivateMentor = async () => {
        if (!selectedMentor) return;
        try {
            await apiClient.delete(`/api/v1/mentors/${selectedMentor.id}`);
            const updatedMentor: Mentor = {
                ...selectedMentor,
                status: 'Inactive',
                assignedCohorts: []
            };
            setSelectedMentor(updatedMentor);
            setMentors((prev) =>
                prev.map((m) => (m.id === selectedMentor.id ? updatedMentor : m))
            );
            toast({
                title: 'Mentor Deactivated',
                description: `${selectedMentor.name} is now inactive.`,
                variant: 'warning'
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to deactivate mentor.',
                variant: 'error'
            });
        }
    };

    const handleDeleteMentor = async () => {
        if (!selectedMentor) return;
        try {
            await apiClient.delete(`/api/v1/mentors/${selectedMentor.id}`);
            setMentors((prev) => prev.filter((m) => m.id !== selectedMentor.id));
            toast({
                title: 'Mentor Removed',
                description: `${selectedMentor.name} has been removed.`,
                variant: 'success'
            });
            handleCloseDrawer();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to remove mentor.',
                variant: 'error'
            });
        }
    };

    const handleSendMessage = () => {
        if (!selectedMentor) return;
        router.push('/communications');
        toast({
            title: 'Opening Communications',
            description: `Compose a message for ${selectedMentor.name}`,
            variant: 'info'
        });
    };

    const handleFormSubmit = async (data: MentorFormData) => {
        setIsSubmitting(true);
        try {
            if (drawerMode === 'create') {
                const payload = {
                    email: data.email,
                    name: data.name,
                    phone: data.phone || undefined,
                    whatsappOptIn: data.whatsappOptIn,
                    specialization: valueToSpecialty[data.specialty] || data.specialty,
                    maxCohorts: data.maxCohorts,
                    bio: data.bio || undefined,
                    status: data.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
                };
                const created = await apiClient.post<ApiMentor>('/api/v1/mentors', payload);
                const newMentor = transformMentor(created);
                setMentors((prev) => [newMentor, ...prev]);
                toast({
                    title: 'Mentor Added',
                    description: `${data.name} has been added to the platform.`,
                    variant: 'success'
                });
            } else if (drawerMode === 'edit' && selectedMentor) {
                const payload = {
                    specialization: valueToSpecialty[data.specialty] || data.specialty,
                    maxCohorts: data.maxCohorts,
                    bio: data.bio || undefined,
                    status: data.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
                };
                await apiClient.put(`/api/v1/mentors/${selectedMentor.id}`, payload);
                const updatedMentor: Mentor = {
                    ...selectedMentor,
                    name: data.name,
                    email: data.email,
                    phone: data.phone || undefined,
                    whatsappOptIn: data.whatsappOptIn,
                    status: data.status,
                    specialty: valueToSpecialty[data.specialty] || data.specialty,
                    maxCohorts: data.maxCohorts,
                    bio: data.bio || undefined
                };
                setMentors((prev) =>
                    prev.map((m) => (m.id === selectedMentor.id ? updatedMentor : m))
                );
                setSelectedMentor(updatedMentor);
                toast({
                    title: 'Changes Saved',
                    description: `Updated profile for ${data.name}.`,
                    variant: 'success'
                });
            }
            handleCloseDrawer();
        } catch (error) {
            const message = error instanceof Error ? error.message : `Failed to ${drawerMode} mentor.`;
            toast({
                title: 'Error',
                description: message,
                variant: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const mentorToFormData = (mentor: Mentor): Partial<MentorFormData> => ({
        name: mentor.name,
        email: mentor.email,
        phone: mentor.phone || '',
        whatsappOptIn: mentor.whatsappOptIn ?? true,
        specialty: specialtyToValue[mentor.specialty] || '',
        status: mentor.status,
        maxCohorts: mentor.maxCohorts,
        bio: mentor.bio || ''
    });

    const getDrawerTitle = () => {
        switch (drawerMode) {
            case 'create':
                return 'Add New Mentor';
            case 'edit':
                return 'Edit Mentor';
            default:
                return 'Mentor Profile';
        }
    };

    const getDrawerDescription = () => {
        switch (drawerMode) {
            case 'create':
                return 'Add a new mentor to the platform.';
            case 'edit':
                return 'Update mentor information.';
            default:
                return undefined;
        }
    };

    return (
        <DashboardLayout
            title="Mentors"
            subtitle="Manage mentor profiles and assignments"
            currentPage="mentors"
            onNavigate={handleNavigate}
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <MentorFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                    />

                    <Button
                        className="gap-2 sm:flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleAddMentor}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Add Mentor
                    </Button>
                </div>

                {/* Main Table */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <MentorsTable
                        mentors={paginatedMentors}
                        onMentorClick={handleMentorClick}
                    />
                )}

                {/* Pagination */}
                {!isLoading && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={filteredMentors.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPage}
                    />
                )}

                {/* Drawer */}
                <Drawer
                    open={isDrawerOpen}
                    onClose={handleCloseDrawer}
                    title={getDrawerTitle()}
                    description={getDrawerDescription()}
                    size="md"
                    footer={
                        drawerMode === 'create' || drawerMode === 'edit' ? (
                            <MentorFormFooter
                                onSubmit={() => {
                                    const form = document.querySelector('form');
                                    if (form) form.requestSubmit();
                                }}
                                onCancel={handleCloseDrawer}
                                isSubmitting={isSubmitting}
                                mode={drawerMode}
                            />
                        ) : undefined
                    }
                >
                    {drawerMode === 'view' && selectedMentor && (
                        <MentorDrawer
                            mentor={selectedMentor}
                            onUpdateMentor={handleUpdateMentor}
                            onDeactivate={handleDeactivateMentor}
                            onEdit={handleEditMentor}
                            onDelete={handleDeleteMentor}
                            onSendMessage={handleSendMessage}
                        />
                    )}

                    {drawerMode === 'create' && (
                        <MentorForm
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDrawer}
                            mode="create"
                        />
                    )}

                    {drawerMode === 'edit' && selectedMentor && (
                        <MentorForm
                            initialData={mentorToFormData(selectedMentor)}
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDrawer}
                            mode="edit"
                        />
                    )}
                </Drawer>
            </div>
        </DashboardLayout>
    );
}
