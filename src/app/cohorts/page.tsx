'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CohortsTable } from '@/components/cohorts/CohortsTable';
import { CohortDrawer } from '@/components/cohorts/CohortDrawer';
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
import { Plus } from 'lucide-react';
import { PageName } from '@/types';
import { Cohort } from '@/types';

// Mock Data
const initialCohorts: Cohort[] = [
    {
        id: 'C-2024-001',
        name: 'Spring 2024 Design Systems',
        programId: 'P-001',
        programName: 'Advanced UI',
        startDate: 'Mar 1, 2024',
        endDate: 'May 24, 2024',
        mentors: ['Sarah Chen', 'Mike Ross'],
        mentorIds: ['M-001', 'M-002'],
        studentCount: 24,
        capacity: 30,
        enrollmentDeadline: 'Feb 25, 2024',
        price: 2500,
        currency: 'USD',
        status: 'Active'
    },
    {
        id: 'C-2024-002',
        name: 'Winter 2024 Product Strategy',
        programId: 'P-002',
        programName: 'Product Design',
        startDate: 'Feb 15, 2024',
        endDate: 'May 10, 2024',
        mentors: ['Alex Kim', 'Jessica Lee', 'David Park'],
        mentorIds: ['M-003', 'M-004', 'M-005'],
        studentCount: 18,
        capacity: 25,
        enrollmentDeadline: 'Feb 10, 2024',
        price: 2800,
        currency: 'USD',
        status: 'Active'
    },
    {
        id: 'C-2024-003',
        name: 'Spring 2024 Foundations',
        programId: 'P-003',
        programName: 'UX Fundamentals',
        startDate: 'Apr 1, 2024',
        endDate: 'Jun 28, 2024',
        mentors: ['Emily White'],
        mentorIds: ['M-006'],
        studentCount: 32,
        capacity: 40,
        enrollmentDeadline: 'Mar 25, 2024',
        price: 1800,
        currency: 'USD',
        status: 'Upcoming'
    },
    {
        id: 'C-2023-012',
        name: 'Winter 2023 Advanced UI',
        programId: 'P-001',
        programName: 'Advanced UI',
        startDate: 'Nov 10, 2023',
        endDate: 'Feb 2, 2024',
        mentors: ['Sarah Chen', 'Tom Wilson'],
        mentorIds: ['M-001', 'M-007'],
        studentCount: 22,
        capacity: 25,
        enrollmentDeadline: 'Nov 5, 2023',
        price: 2400,
        currency: 'USD',
        status: 'Completed'
    },
    {
        id: 'C-2023-011',
        name: 'Fall 2023 Research',
        programId: 'P-004',
        programName: 'UX Research',
        startDate: 'Sep 5, 2023',
        endDate: 'Nov 28, 2023',
        mentors: ['Lisa Wang', 'James Miller'],
        mentorIds: ['M-008', 'M-009'],
        studentCount: 15,
        capacity: 20,
        enrollmentDeadline: 'Aug 30, 2023',
        price: 2200,
        currency: 'USD',
        status: 'Completed'
    },
    {
        id: 'C-2024-004',
        name: 'Summer 2024 Interaction',
        programId: 'P-005',
        programName: 'Interaction Design',
        startDate: 'Jun 15, 2024',
        endDate: 'Aug 30, 2024',
        mentors: ['Mike Ross', 'David Park'],
        mentorIds: ['M-002', 'M-005'],
        studentCount: 0,
        capacity: 30,
        enrollmentDeadline: 'Jun 10, 2024',
        price: 2600,
        currency: 'USD',
        status: 'Upcoming'
    },
    {
        id: 'C-2023-010',
        name: 'Fall 2023 Product Strategy',
        programId: 'P-002',
        programName: 'Product Design',
        startDate: 'Sep 1, 2023',
        endDate: 'Nov 24, 2023',
        mentors: ['Alex Kim'],
        mentorIds: ['M-003'],
        studentCount: 20,
        capacity: 25,
        enrollmentDeadline: 'Aug 25, 2023',
        price: 2800,
        currency: 'USD',
        status: 'Completed'
    },
    {
        id: 'C-2024-005',
        name: 'Spring 2024 Career Prep',
        programId: 'P-006',
        programName: 'Career Development',
        startDate: 'Mar 15, 2024',
        endDate: 'Apr 26, 2024',
        mentors: ['Jessica Lee', 'Tom Wilson'],
        mentorIds: ['M-004', 'M-007'],
        studentCount: 35,
        capacity: 50,
        enrollmentDeadline: 'Mar 10, 2024',
        price: 1200,
        currency: 'USD',
        status: 'Active'
    }
];

type DrawerMode = 'view' | 'create' | 'edit';

// Helper to convert cohort data to form data format
const cohortToFormData = (cohort: Cohort): Partial<CohortFormData> => {
    const programMap: Record<string, string> = {
        'Advanced UI': 'advanced-ui',
        'Product Design': 'product-design',
        'UX Fundamentals': 'ux-fundamentals',
        'UX Research': 'ux-research',
        'Interaction Design': 'interaction-design',
        'Career Development': 'career-development'
    };
    const mentorMap: Record<string, string> = {
        'Sarah Chen': 'sarah-chen',
        'Mike Ross': 'mike-ross',
        'Alex Kim': 'alex-kim',
        'Jessica Lee': 'jessica-lee',
        'David Park': 'david-park',
        'Emily White': 'emily-white'
    };

    return {
        name: cohort.name,
        program: programMap[cohort.programName] || '',
        startDate: '', // Should parse date properly in real app
        endDate: '',
        status: cohort.status === 'Active' ? 'Active' : 'Upcoming',
        mentors: cohort.mentors.map((m) => mentorMap[m] || '').filter(Boolean),
        description: cohort.description || '',
        capacity: cohort.capacity,
        price: cohort.price,
        currency: cohort.currency,
        enrollmentDeadline: ''
    };
};

export default function CohortsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [cohorts, setCohorts] = useState<Cohort[]>(initialCohorts);
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

    const handleCohortClick = (cohort: Cohort) => {
        setSelectedCohort(cohort);
        setDrawerMode('view');
        setIsDrawerOpen(true);
    };

    const handleCreateClick = () => {
        setSelectedCohort(null);
        setDrawerMode('create');
        setIsDrawerOpen(true);
    };

    const handleEditClick = () => {
        setDrawerMode('edit');
    };

    const handleArchive = () => {
        if (!selectedCohort) return;
        setCohorts((prev) =>
            prev.map((c) =>
                c.id === selectedCohort.id
                    ? { ...c, status: 'Archived' as const }
                    : c
            )
        );
        setSelectedCohort((prev) =>
            prev ? { ...prev, status: 'Archived' as const } : null
        );
        toast({
            title: 'Cohort Archived',
            description: `${selectedCohort.name} has been archived.`,
            variant: 'info'
        });
    };

    const handleRestore = () => {
        if (!selectedCohort) return;
        setCohorts((prev) =>
            prev.map((c) =>
                c.id === selectedCohort.id
                    ? { ...c, status: 'Upcoming' as const } // Default restore state
                    : c
            )
        );
        setSelectedCohort((prev) =>
            prev ? { ...prev, status: 'Upcoming' as const } : null
        );
        toast({
            title: 'Cohort Restored',
            description: `${selectedCohort.name} has been restored.`,
            variant: 'success'
        });
    };

    const handleDelete = () => {
        if (!selectedCohort) return;
        setCohorts((prev) => prev.filter((c) => c.id !== selectedCohort.id));
        toast({
            title: 'Cohort Deleted',
            description: `${selectedCohort.name} has been permanently deleted.`,
            variant: 'success'
        });
        handleCloseDrawer();
    };

    const handleDuplicate = () => {
        if (!selectedCohort) return;
        const newCohort: Cohort = {
            ...selectedCohort,
            id: `C-2024-${String(cohorts.length + 1).padStart(3, '0')}`,
            name: `${selectedCohort.name} (Copy)`,
            status: 'Upcoming',
            studentCount: 0
        };
        setCohorts((prev) => [newCohort, ...prev]);
        toast({
            title: 'Cohort Duplicated',
            description: `Created "${newCohort.name}" as upcoming.`,
            variant: 'success'
        });
        setSelectedCohort(newCohort);
    };

    const handleMarkComplete = () => {
        if (!selectedCohort) return;
        setCohorts((prev) =>
            prev.map((c) =>
                c.id === selectedCohort.id
                    ? { ...c, status: 'Completed' as const }
                    : c
            )
        );
        setSelectedCohort((prev) =>
            prev ? { ...prev, status: 'Completed' as const } : null
        );
        toast({
            title: 'Cohort Completed',
            description: `${selectedCohort.name} has been marked as completed. Students are now eligible for certificates.`,
            variant: 'success'
        });
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => {
            setSelectedCohort(null);
            setDrawerMode('view');
        }, 200);
    };

    const handleFormSubmit = (data: CohortFormData) => {
        setIsSubmitting(true);
        setTimeout(() => {
            if (drawerMode === 'create') {
                const newCohort: Cohort = {
                    id: `C-2024-${String(cohorts.length + 1).padStart(3, '0')}`,
                    name: data.name,
                    programId: 'P-NEW',
                    programName: data.program
                        .split('-')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' '),
                    startDate: new Date(data.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }),
                    endDate: new Date(data.endDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }),
                    mentors: data.mentors.map((m) =>
                        m
                            .split('-')
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ')
                    ),
                    mentorIds: [],
                    studentCount: 0,
                    capacity: data.capacity || 30,
                    enrollmentDeadline: data.enrollmentDeadline
                        ? new Date(data.enrollmentDeadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })
                        : new Date(data.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        }),
                    price: data.price,
                    currency: data.currency,
                    status: data.status,
                    description: data.description
                };
                setCohorts((prev) => [newCohort, ...prev]);
                toast({
                    title: 'Cohort Created',
                    description: `${data.name} has been successfully created.`,
                    variant: 'success'
                });
            } else if (drawerMode === 'edit' && selectedCohort) {
                const updatedCohort: Cohort = {
                    ...selectedCohort,
                    name: data.name,
                    programName: data.program
                        .split('-')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' '),
                    startDate: data.startDate
                        ? new Date(data.startDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })
                        : selectedCohort.startDate,
                    endDate: data.endDate
                        ? new Date(data.endDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })
                        : selectedCohort.endDate,
                    mentors: data.mentors.map((m) =>
                        m
                            .split('-')
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                            .join(' ')
                    ),
                    capacity: data.capacity,
                    price: data.price,
                    currency: data.currency,
                    status: data.status,
                    description: data.description
                };
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
            setIsSubmitting(false);
            handleCloseDrawer();
        }, 500);
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
                <CohortsTable cohorts={paginatedCohorts} onCohortClick={handleCohortClick} />

                {/* Pagination */}
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={filteredCohorts.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setPage}
                />

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
                        />
                    )}

                    {drawerMode === 'create' && (
                        <CreateCohortDrawer
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDrawer}
                            mode="create"
                        />
                    )}

                    {drawerMode === 'edit' && selectedCohort && (
                        <CreateCohortDrawer
                            initialData={cohortToFormData(selectedCohort)}
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
