'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CohortsTable } from '@/components/cohorts/CohortsTable';
import { CohortDrawer, StudentSummary, CourseSummary } from '@/components/cohorts/CohortDrawer';
import {
    CreateCohortDrawer,
    CohortFormData,
    CreateCohortFooter
} from '@/components/cohorts/CreateCohortDrawer';
import {
    CohortFilters,
    CohortStatus
} from '@/components/cohorts/CohortFilters';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/Toast';
import { Plus, Loader2 } from 'lucide-react';
import { PageName } from '@/types';
import { Cohort } from '@/types';
import { apiClient } from '@/lib/api-client';
import { MentorForAssignment } from '@/components/ui/AssignmentModal';

type DrawerMode = 'view' | 'create' | 'edit';

const statusToApi: Record<string, string> = { 'Upcoming': 'UPCOMING', 'Active': 'ACTIVE', 'Completed': 'COMPLETED', 'Archived': 'ARCHIVED' };
const statusFromApi: Record<string, Cohort['status']> = { 'UPCOMING': 'Upcoming', 'ACTIVE': 'Active', 'COMPLETED': 'Completed', 'ARCHIVED': 'Archived' };

function toIsoDatetime(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('T')) return dateStr;
    return new Date(dateStr + 'T00:00:00.000Z').toISOString();
}

interface ApiCohort {
    id: string;
    name: string;
    programId: string;
    startDate: string;
    endDate: string | null;
    status: string;
    capacity: number;
    price: number | null;
    currency: string | null;
    description: string | null;
    enrollmentDeadline: string | null;
    program?: { id: string; name: string; slug: string };
    _count?: { students: number; mentors: number };
    mentors?: Array<{ id: string; user: { id: string; name: string } }>;
}

function transformCohort(raw: ApiCohort): Cohort {
    const formatDate = (d: string | null) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return {
        id: raw.id,
        name: raw.name,
        programId: raw.programId,
        programName: raw.program?.name || '',
        startDate: formatDate(raw.startDate),
        endDate: formatDate(raw.endDate),
        mentors: raw.mentors?.map(m => m.user.name) || [],
        mentorIds: raw.mentors?.map(m => m.id) || [],
        studentCount: raw._count?.students ?? 0,
        capacity: raw.capacity,
        enrollmentDeadline: formatDate(raw.enrollmentDeadline),
        price: raw.price ?? 0,
        currency: raw.currency || 'USD',
        status: statusFromApi[raw.status] || raw.status as Cohort['status'],
        description: raw.description || undefined,
    };
}

export default function CohortsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [programOptions, setProgramOptions] = useState<{ value: string; label: string }[]>([]);
    const [mentorOptionsList, setMentorOptionsList] = useState<{ value: string; label: string; role?: string }[]>([]);
    const [availableMentorsForDrawer, setAvailableMentorsForDrawer] = useState<MentorForAssignment[]>([]);
    const [cohortStudents, setCohortStudents] = useState<StudentSummary[]>([]);
    const [cohortCourses, setCohortCourses] = useState<CourseSummary[]>([]);
    const [allCourses, setAllCourses] = useState<CourseSummary[]>([]);
    const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<DrawerMode>('view');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<CohortStatus>('All');

    // Pagination State
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const fetchCohorts = useCallback(async () => {
        try {
            setIsLoading(true);
            const [cohortsRes, programsRes, mentorsRes, coursesRes] = await Promise.all([
                apiClient.get<{ cohorts: ApiCohort[] }>('/api/v1/cohorts?limit=50'),
                apiClient.get<{ programs: Array<{ id: string; name: string }> }>('/api/v1/programs?limit=50').catch(() => ({ programs: [] })),
                apiClient.get<{ mentors: Array<{ id: string; name: string; specialization?: string }> }>('/api/v1/mentors?limit=50').catch(() => ({ mentors: [] })),
                apiClient.get<{ courses: Array<{ id: string; title: string; level: string; _count?: { modules: number; enrollments: number } }> }>('/api/v1/courses?limit=50').catch(() => ({ courses: [] })),
            ]);
            setCohorts(cohortsRes.cohorts.map(transformCohort));
            setProgramOptions(programsRes.programs.map(p => ({ value: p.id, label: p.name })));
            setMentorOptionsList(mentorsRes.mentors.map(m => ({ value: m.id, label: m.name, role: m.specialization })));
            setAvailableMentorsForDrawer(
                (mentorsRes.mentors as Array<{ id: string; name: string; email?: string; status?: string; cohortCount?: number; maxCohorts?: number }>).map(m => ({
                    id: m.id,
                    name: m.name,
                    email: m.email || '',
                    currentLoad: m.cohortCount ?? 0,
                    maxCohorts: m.maxCohorts ?? 5,
                    status: (m.status === 'ACTIVE' ? 'Active' : 'Inactive') as 'Active' | 'Inactive',
                }))
            );
            setAllCourses(
                (coursesRes.courses as Array<{ id: string; title: string; level: string; _count?: { modules: number; enrollments: number } }>).map(c => ({
                    id: c.id,
                    title: c.title,
                    level: c.level,
                    modules: c._count?.modules ?? 0,
                    enrollments: c._count?.enrollments ?? 0,
                }))
            );
        } catch (error) {
            console.error('Failed to fetch cohorts:', error);
            toast({
                title: 'Error',
                description: 'Failed to load cohorts. Please try again.',
                variant: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCohorts();
    }, [fetchCohorts]);

    // Filter Logic
    const filteredCohorts = useMemo(() => {
        return cohorts.filter((cohort) => {
            const matchesSearch =
                cohort.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                cohort.programName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter =
                activeFilter === 'All' || cohort.status === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [cohorts, searchQuery, activeFilter]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredCohorts.length / itemsPerPage);
    const paginatedCohorts = filteredCohorts.slice(
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

    const handleCohortClick = async (cohort: Cohort) => {
        setSelectedCohort(cohort);
        setDrawerMode('view');
        setIsDrawerOpen(true);
        setCohortStudents([]);
        setCohortCourses([]);
        try {
            const [studentsRes, coursesRes] = await Promise.all([
                apiClient.get<{ students: Array<{ id: string; name: string; status: string }> }>(`/api/v1/students?cohortId=${cohort.id}&limit=10`),
                apiClient.get<{ courses: Array<{ id: string; title: string; slug: string; level: string; _count?: { modules: number; enrollments: number } }> }>(`/api/v1/cohorts/${cohort.id}/courses`).catch(() => ({ courses: [] })),
            ]);
            const statusMap: Record<string, StudentSummary['status']> = { ACTIVE: 'Active', INVITED: 'Invited', FLAGGED: 'Flagged', DROPPED: 'Dropped', COMPLETED: 'Completed' };
            setCohortStudents(studentsRes.students.map(s => ({
                id: s.id,
                name: s.name || 'Unknown',
                status: statusMap[s.status] || 'Active',
            })));
            setCohortCourses(coursesRes.courses.map((c: Record<string, unknown>) => ({
                id: c.id as string,
                title: c.title as string,
                level: c.level as string,
                modules: ((c._count as Record<string, number>)?.modules) ?? 0,
                enrollments: ((c._count as Record<string, number>)?.enrollments) ?? 0,
            })));
        } catch {
            setCohortStudents([]);
            setCohortCourses([]);
        }
    };

    const handleCreateClick = () => {
        setSelectedCohort(null);
        setDrawerMode('create');
        setIsDrawerOpen(true);
    };

    const handleEditClick = () => {
        setDrawerMode('edit');
    };

    const handleArchive = async () => {
        if (!selectedCohort) return;
        try {
            await apiClient.put(`/api/v1/cohorts/${selectedCohort.id}`, {
                status: 'ARCHIVED'
            });
            const updatedCohort: Cohort = { ...selectedCohort, status: 'Archived' };
            setCohorts((prev) =>
                prev.map((c) => (c.id === selectedCohort.id ? updatedCohort : c))
            );
            setSelectedCohort(updatedCohort);
            toast({
                title: 'Cohort Archived',
                description: `${selectedCohort.name} has been archived.`,
                variant: 'info'
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to archive cohort.',
                variant: 'error'
            });
        }
    };

    const handleRestore = async () => {
        if (!selectedCohort) return;
        try {
            await apiClient.put(`/api/v1/cohorts/${selectedCohort.id}`, {
                status: 'UPCOMING'
            });
            const updatedCohort: Cohort = { ...selectedCohort, status: 'Upcoming' };
            setCohorts((prev) =>
                prev.map((c) => (c.id === selectedCohort.id ? updatedCohort : c))
            );
            setSelectedCohort(updatedCohort);
            toast({
                title: 'Cohort Restored',
                description: `${selectedCohort.name} has been restored.`,
                variant: 'success'
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to restore cohort.',
                variant: 'error'
            });
        }
    };

    const handleDelete = async () => {
        if (!selectedCohort) return;
        try {
            await apiClient.delete(`/api/v1/cohorts/${selectedCohort.id}`);
            setCohorts((prev) => prev.filter((c) => c.id !== selectedCohort.id));
            toast({
                title: 'Cohort Deleted',
                description: `${selectedCohort.name} has been permanently deleted.`,
                variant: 'success'
            });
            handleCloseDrawer();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to delete cohort.';
            toast({
                title: 'Error',
                description: message,
                variant: 'error'
            });
        }
    };

    const handleDuplicate = async () => {
        if (!selectedCohort) return;
        try {
            const newCohortData = {
                name: `${selectedCohort.name} (Copy)`,
                programId: selectedCohort.programId,
                startDate: new Date().toISOString(),
                status: 'UPCOMING',
                capacity: selectedCohort.capacity,
                price: selectedCohort.price,
                currency: selectedCohort.currency,
                description: selectedCohort.description,
            };
            const created = await apiClient.post<ApiCohort>('/api/v1/cohorts', newCohortData);
            const newCohort = transformCohort(created);
            setCohorts((prev) => [newCohort, ...prev]);
            toast({
                title: 'Cohort Duplicated',
                description: `Created "${newCohort.name}" as upcoming.`,
                variant: 'success'
            });
            setSelectedCohort(newCohort);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to duplicate cohort.',
                variant: 'error'
            });
        }
    };

    const handleMarkComplete = async () => {
        if (!selectedCohort) return;
        try {
            await apiClient.put(`/api/v1/cohorts/${selectedCohort.id}`, {
                status: 'COMPLETED'
            });
            const updatedCohort: Cohort = { ...selectedCohort, status: 'Completed' };
            setCohorts((prev) =>
                prev.map((c) => (c.id === selectedCohort.id ? updatedCohort : c))
            );
            setSelectedCohort(updatedCohort);
            toast({
                title: 'Cohort Completed',
                description: `${selectedCohort.name} has been marked as completed. Students are now eligible for certificates.`,
                variant: 'success'
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to mark cohort as completed.',
                variant: 'error'
            });
        }
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => {
            setSelectedCohort(null);
            setDrawerMode('view');
        }, 200);
    };

    const handleFormSubmit = async (data: CohortFormData) => {
        setIsSubmitting(true);
        try {
            if (drawerMode === 'create') {
                const payload = {
                    name: data.name,
                    programId: data.program,
                    startDate: toIsoDatetime(data.startDate),
                    endDate: data.endDate ? toIsoDatetime(data.endDate) : undefined,
                    status: statusToApi[data.status] || data.status,
                    capacity: data.capacity || 30,
                    price: data.price,
                    currency: data.currency,
                };
                const created = await apiClient.post<ApiCohort>('/api/v1/cohorts', payload);
                const newCohort = transformCohort(created);
                setCohorts((prev) => [newCohort, ...prev]);
                toast({
                    title: 'Cohort Created',
                    description: `${data.name} has been successfully created.`,
                    variant: 'success'
                });
            } else if (drawerMode === 'edit' && selectedCohort) {
                const payload = {
                    name: data.name,
                    programId: data.program,
                    startDate: data.startDate ? toIsoDatetime(data.startDate) : undefined,
                    endDate: data.endDate ? toIsoDatetime(data.endDate) : undefined,
                    status: statusToApi[data.status] || data.status,
                    capacity: data.capacity,
                    price: data.price,
                    currency: data.currency,
                };
                const updated = await apiClient.put<ApiCohort>(`/api/v1/cohorts/${selectedCohort.id}`, payload);
                const updatedCohort = transformCohort(updated);
                setCohorts((prev) =>
                    prev.map((c) => (c.id === selectedCohort.id ? updatedCohort : c))
                );
                setSelectedCohort(updatedCohort);
                toast({
                    title: 'Changes Saved',
                    description: `Updated details for ${data.name}.`,
                    variant: 'success'
                });
            }
            handleCloseDrawer();
        } catch (error) {
            const message = error instanceof Error ? error.message : `Failed to ${drawerMode} cohort.`;
            toast({
                title: 'Error',
                description: message,
                variant: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const cohortToFormData = (cohort: Cohort): Partial<CohortFormData> => {
        return {
            name: cohort.name,
            program: cohort.programId,
            startDate: '',
            endDate: '',
            status: cohort.status === 'Completed' || cohort.status === 'Archived' ? 'Active' : cohort.status,
            mentors: cohort.mentorIds || [],
            description: cohort.description || '',
            capacity: cohort.capacity,
            price: cohort.price,
            currency: cohort.currency,
            enrollmentDeadline: ''
        };
    };

    const getDrawerTitle = () => {
        switch (drawerMode) {
            case 'create':
                return 'Create New Cohort';
            case 'edit':
                return 'Edit Cohort';
            default:
                return selectedCohort?.name || 'Cohort Details';
        }
    };

    const getDrawerDescription = () => {
        switch (drawerMode) {
            case 'create':
                return 'Set up a new cohort with program details and mentors.';
            case 'edit':
                return 'Update cohort information and settings.';
            default:
                return undefined;
        }
    };

    return (
        <DashboardLayout
            title="Cohorts"
            subtitle="Manage all active and past cohorts"
            currentPage="cohorts"
            onNavigate={handleNavigate}
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CohortFilters
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        activeFilter={activeFilter}
                        onFilterChange={setActiveFilter}
                    />

                    <Button
                        className="gap-2 sm:flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={handleCreateClick}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        Create Cohort
                    </Button>
                </div>

                {/* Main Table */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <CohortsTable cohorts={paginatedCohorts} onCohortClick={handleCohortClick} />
                )}

                {/* Pagination */}
                {!isLoading && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={filteredCohorts.length}
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
                    size="lg"
                    footer={
                        drawerMode === 'create' || drawerMode === 'edit' ? (
                            <CreateCohortFooter
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
                    {drawerMode === 'view' && selectedCohort && (
                        <CohortDrawer
                            cohort={selectedCohort}
                            onEdit={handleEditClick}
                            onViewStudents={(id) => router.push('/students')}
                            onUpdateCohort={(updated) => {
                                setCohorts((prev) =>
                                    prev.map((c) => (c.id === updated.id ? updated : c))
                                );
                                setSelectedCohort(updated);
                                toast({
                                    title: 'Cohort Updated',
                                    description: 'Changes saved successfully.',
                                    variant: 'success'
                                });
                            }}
                            onArchive={handleArchive}
                            onRestore={handleRestore}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onMarkComplete={handleMarkComplete}
                            availableMentors={availableMentorsForDrawer}
                            students={cohortStudents}
                            cohortCourses={cohortCourses}
                            allCourses={allCourses}
                            onAssignMentor={async (mentorId: string) => {
                                await apiClient.post(`/api/v1/cohorts/${selectedCohort.id}/mentors`, { mentorId });
                                await fetchCohorts();
                                // Refresh drawer
                                const updatedCohort = cohorts.find(c => c.id === selectedCohort.id);
                                if (updatedCohort) setSelectedCohort(updatedCohort);
                                toast({ title: 'Mentor Assigned', description: 'Mentor has been assigned to this cohort.', variant: 'success' });
                            }}
                            onRemoveMentor={async (mentorId: string) => {
                                await apiClient.delete(`/api/v1/cohorts/${selectedCohort.id}/mentors`, { mentorId });
                                await fetchCohorts();
                                const updatedCohort = cohorts.find(c => c.id === selectedCohort.id);
                                if (updatedCohort) setSelectedCohort(updatedCohort);
                                toast({ title: 'Mentor Removed', description: 'Mentor has been removed from this cohort.', variant: 'success' });
                            }}
                            onAssignCourse={async (courseId: string) => {
                                await apiClient.post(`/api/v1/cohorts/${selectedCohort.id}/courses`, { courseId });
                                // Refresh courses list
                                const coursesRes = await apiClient.get<{ courses: Array<{ id: string; title: string; level: string; _count?: { modules: number; enrollments: number } }> }>(`/api/v1/cohorts/${selectedCohort.id}/courses`);
                                setCohortCourses(coursesRes.courses.map((c: Record<string, unknown>) => ({
                                    id: c.id as string,
                                    title: c.title as string,
                                    level: c.level as string,
                                    modules: ((c._count as Record<string, number>)?.modules) ?? 0,
                                    enrollments: ((c._count as Record<string, number>)?.enrollments) ?? 0,
                                })));
                                toast({ title: 'Course Assigned', description: 'Course assigned and students auto-enrolled.', variant: 'success' });
                            }}
                            onRemoveCourse={async (courseId: string) => {
                                await apiClient.delete(`/api/v1/cohorts/${selectedCohort.id}/courses`, { courseId });
                                setCohortCourses(prev => prev.filter(c => c.id !== courseId));
                                toast({ title: 'Course Removed', description: 'Course has been removed from this cohort.', variant: 'success' });
                            }}
                        />
                    )}

                    {drawerMode === 'create' && (
                        <CreateCohortDrawer
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDrawer}
                            mode="create"
                            programOptions={programOptions}
                            mentorOptionsList={mentorOptionsList}
                        />
                    )}

                    {drawerMode === 'edit' && selectedCohort && (
                        <CreateCohortDrawer
                            initialData={cohortToFormData(selectedCohort)}
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDrawer}
                            mode="edit"
                            programOptions={programOptions}
                            mentorOptionsList={mentorOptionsList}
                        />
                    )}
                </Drawer>
            </div>
        </DashboardLayout>
    );
}
