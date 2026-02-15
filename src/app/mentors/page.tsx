'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { Plus } from 'lucide-react';
import { PageName } from '@/types';

// Mock Data
const initialMentors: Mentor[] = [
    {
        id: 'M-001',
        name: 'Sarah Chen',
        email: 'sarah.chen@designient.com',
        status: 'Active',
        assignedCohorts: [
            {
                id: 'C-2024-001',
                name: 'Spring 2024 Design Systems',
                status: 'Active'
            },
            {
                id: 'C-2023-012',
                name: 'Winter 2023 Advanced UI',
                status: 'Completed'
            }
        ],
        lastActive: '2 hours ago',
        joinDate: 'Jan 15, 2023',
        specialty: 'Design Systems',
        bio: 'Senior Design Lead with 10+ years of experience in building scalable design systems for enterprise products.',
        maxCohorts: 3,
        rating: 4.9,
        totalReviews: 24,
        totalStudentsMentored: 45,
        availabilityStatus: 'Available'
    },
    {
        id: 'M-002',
        name: 'Mike Ross',
        email: 'mike.ross@designient.com',
        status: 'Active',
        assignedCohorts: [
            {
                id: 'C-2024-001',
                name: 'Spring 2024 Design Systems',
                status: 'Active'
            },
            {
                id: 'C-2024-004',
                name: 'Summer 2024 Interaction',
                status: 'Upcoming'
            }
        ],
        lastActive: '1 day ago',
        joinDate: 'Mar 20, 2023',
        specialty: 'Product Design',
        bio: 'Product Designer focused on user-centered design and rapid prototyping methodologies.',
        maxCohorts: 3,
        rating: 4.8,
        totalReviews: 18,
        totalStudentsMentored: 32,
        availabilityStatus: 'Limited'
    },
    {
        id: 'M-003',
        name: 'Alex Kim',
        email: 'alex.kim@designient.com',
        status: 'Active',
        assignedCohorts: [
            {
                id: 'C-2024-002',
                name: 'Winter 2024 Product Strategy',
                status: 'Active'
            }
        ],
        lastActive: '4 hours ago',
        joinDate: 'Jun 10, 2023',
        specialty: 'UX Strategy',
        bio: 'UX Strategist specializing in research-driven design and product strategy.',
        maxCohorts: 2,
        rating: 4.7,
        totalReviews: 12,
        totalStudentsMentored: 20,
        availabilityStatus: 'Available'
    },
    {
        id: 'M-004',
        name: 'Jessica Lee',
        email: 'jessica.lee@designient.com',
        status: 'Active',
        assignedCohorts: [
            {
                id: 'C-2024-005',
                name: 'Spring 2024 Career Prep',
                status: 'Active'
            },
            {
                id: 'C-2024-003',
                name: 'Spring 2024 Foundations',
                status: 'Upcoming'
            }
        ],
        lastActive: '3 hours ago',
        joinDate: 'Aug 5, 2023',
        specialty: 'Career Development',
        bio: 'Design Manager helping designers navigate their career paths and build leadership skills.',
        maxCohorts: 3,
        rating: 5.0,
        totalReviews: 30,
        totalStudentsMentored: 55,
        availabilityStatus: 'Unavailable'
    },
    {
        id: 'M-005',
        name: 'David Park',
        email: 'david.park@designient.com',
        status: 'Active',
        assignedCohorts: [
            {
                id: 'C-2024-004',
                name: 'Summer 2024 Interaction',
                status: 'Upcoming'
            },
            {
                id: 'C-2024-002',
                name: 'Winter 2024 Product Strategy',
                status: 'Active'
            }
        ],
        lastActive: '6 hours ago',
        joinDate: 'Sep 12, 2023',
        specialty: 'UI Design',
        bio: 'UI Designer with expertise in visual design, motion, and micro-interactions.',
        maxCohorts: 3,
        rating: 4.6,
        totalReviews: 15,
        totalStudentsMentored: 28,
        availabilityStatus: 'Available'
    },
    {
        id: 'M-006',
        name: 'Emily White',
        email: 'emily.white@designient.com',
        status: 'Active',
        assignedCohorts: [
            {
                id: 'C-2024-003',
                name: 'Spring 2024 Foundations',
                status: 'Upcoming'
            }
        ],
        lastActive: '1 day ago',
        joinDate: 'Oct 1, 2023',
        specialty: 'UX Research',
        bio: 'UX Researcher passionate about understanding user behavior and translating insights into design decisions.',
        maxCohorts: 2,
        rating: 4.9,
        totalReviews: 22,
        totalStudentsMentored: 40,
        availabilityStatus: 'Limited'
    },
    {
        id: 'M-007',
        name: 'Tom Wilson',
        email: 'tom.wilson@designient.com',
        status: 'Inactive',
        assignedCohorts: [],
        lastActive: '2 weeks ago',
        joinDate: 'Feb 28, 2023',
        specialty: 'Design Systems',
        bio: 'Former Design Lead, currently on sabbatical.',
        maxCohorts: 3,
        rating: 4.5,
        totalReviews: 45,
        totalStudentsMentored: 80,
        availabilityStatus: 'Unavailable'
    },
    {
        id: 'M-008',
        name: 'Lisa Wang',
        email: 'lisa.wang@designient.com',
        status: 'Inactive',
        assignedCohorts: [],
        lastActive: '1 month ago',
        joinDate: 'Apr 15, 2023',
        specialty: 'UX Research',
        maxCohorts: 2,
        rating: 4.7,
        totalReviews: 35,
        totalStudentsMentored: 60,
        availabilityStatus: 'Unavailable'
    }
];

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
    const [mentors, setMentors] = useState<Mentor[]>(initialMentors);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<MentorStatus>('All');
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<DrawerMode>('view');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination State
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

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

    const handleDeactivateMentor = () => {
        if (!selectedMentor) return;
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
    };

    const handleDeleteMentor = () => {
        if (!selectedMentor) return;
        setMentors((prev) => prev.filter((m) => m.id !== selectedMentor.id));
        toast({
            title: 'Mentor Deleted',
            description: `${selectedMentor.name} has been permanently deleted.`,
            variant: 'success'
        });
        handleCloseDrawer();
    };

    const handleSendMessage = () => {
        if (!selectedMentor) return;
        // For now, just show toast as we don't have communication flow fully hooked up
        // In real app, this would use onComposeMessage prop if available
        router.push('/communications');
        toast({
            title: 'Opening Communications',
            description: `Compose a message for ${selectedMentor.name}`,
            variant: 'info'
        });
    };

    const handleFormSubmit = (data: MentorFormData) => {
        setIsSubmitting(true);
        setTimeout(() => {
            if (drawerMode === 'create') {
                const newMentor: Mentor = {
                    id: `M-${String(mentors.length + 1).padStart(3, '0')}`,
                    name: data.name,
                    email: data.email,
                    phone: data.phone || undefined,
                    whatsappOptIn: data.whatsappOptIn,
                    status: data.status,
                    specialty: valueToSpecialty[data.specialty] || data.specialty,
                    maxCohorts: data.maxCohorts,
                    bio: data.bio || undefined,
                    assignedCohorts: [],
                    lastActive: 'Just now',
                    joinDate: new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                    }),
                    rating: 0,
                    totalReviews: 0,
                    totalStudentsMentored: 0,
                    availabilityStatus: 'Available'
                };
                setMentors((prev) => [newMentor, ...prev]);
                toast({
                    title: 'Mentor Added',
                    description: `${data.name} has been added to the platform.`,
                    variant: 'success'
                });
            } else if (drawerMode === 'edit' && selectedMentor) {
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
            setIsSubmitting(false);
            handleCloseDrawer();
        }, 500);
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
                <MentorsTable
                    mentors={paginatedMentors}
                    onMentorClick={handleMentorClick}
                />

                {/* Pagination */}
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={filteredMentors.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setPage}
                />

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
