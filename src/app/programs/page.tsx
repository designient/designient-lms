'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
    ProgramFilters,
    ProgramStatus
} from '@/components/programs/ProgramFilters';
import { ProgramsTable } from '@/components/programs/ProgramsTable';
import { ProgramDrawer } from '@/components/programs/ProgramDrawer';
import {
    ProgramForm,
    ProgramFormData,
    ProgramFormFooter
} from '@/components/programs/ProgramForm';
import { Button } from '@/components/ui/Button';
import { Drawer } from '@/components/ui/Drawer';
import { useToast } from '@/components/ui/Toast';
import { Plus, Loader2 } from 'lucide-react';
import { PageName } from '@/types';
import { Program } from '@/types';
import { apiClient } from '@/lib/api-client';

type DrawerMode = 'view' | 'create' | 'edit';

const statusToApi: Record<string, string> = { 'Active': 'ACTIVE', 'Draft': 'DRAFT', 'Archived': 'ARCHIVED' };
const statusFromApi: Record<string, Program['status']> = { 'ACTIVE': 'Active', 'DRAFT': 'Draft', 'ARCHIVED': 'Archived' };

function normalizeProgram(raw: Record<string, unknown>): Program {
    const s = String(raw.status || 'DRAFT');
    return {
        id: String(raw.id),
        name: String(raw.name || ''),
        description: String(raw.description || ''),
        duration: String(raw.duration || ''),
        status: statusFromApi[s] || s as Program['status'],
        cohortCount: (raw._count as { cohorts?: number })?.cohorts ?? (raw.cohortCount as number ?? 0),
        createdAt: String(raw.createdAt || ''),
    };
}

export default function ProgramsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [programs, setPrograms] = useState<Program[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<ProgramStatus>('All');
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<DrawerMode>('view');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchPrograms = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await apiClient.get<{ programs: Record<string, unknown>[] }>('/api/v1/programs');
            setPrograms(response.programs.map(normalizeProgram));
        } catch (error) {
            console.error('Failed to fetch programs:', error);
            toast({
                title: 'Error',
                description: 'Failed to load programs. Please try again.',
                variant: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchPrograms();
    }, [fetchPrograms]);

    const filteredPrograms = useMemo(() => {
        return programs.filter((program) => {
            const matchesSearch = program.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            const matchesFilter =
                activeFilter === 'All' || program.status === activeFilter;
            return matchesSearch && matchesFilter;
        });
    }, [programs, searchQuery, activeFilter]);

    const handleNavigate = (page: PageName) => {
        router.push(`/${page}`);
    };

    const handleProgramClick = (program: Program) => {
        setSelectedProgram(program);
        setDrawerMode('view');
        setIsDrawerOpen(true);
    };

    const handleCreateClick = () => {
        setSelectedProgram(null);
        setDrawerMode('create');
        setIsDrawerOpen(true);
    };

    const handleEditClick = () => {
        setDrawerMode('edit');
    };

    const handleArchive = async () => {
        if (!selectedProgram) return;
        try {
            await apiClient.put(`/api/v1/programs/${selectedProgram.id}`, {
                status: 'ARCHIVED'
            });

            const updatedProgram: Program = {
                ...selectedProgram,
                status: 'Archived'
            };

            setPrograms((prev) =>
                prev.map((p) => (p.id === selectedProgram.id ? updatedProgram : p))
            );
            setSelectedProgram(updatedProgram);
            toast({
                title: 'Program Archived',
                description: `${selectedProgram.name} has been archived.`,
                variant: 'info'
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to archive program.',
                variant: 'error'
            });
        }
    };

    const handleRestore = async () => {
        if (!selectedProgram) return;
        try {
            await apiClient.put(`/api/v1/programs/${selectedProgram.id}`, {
                status: 'DRAFT'
            });

            const updatedProgram: Program = {
                ...selectedProgram,
                status: 'Draft'
            };

            setPrograms((prev) =>
                prev.map((p) => (p.id === selectedProgram.id ? updatedProgram : p))
            );
            setSelectedProgram(updatedProgram);
            toast({
                title: 'Program Restored',
                description: `${selectedProgram.name} has been restored as a draft.`,
                variant: 'success'
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to restore program.',
                variant: 'error'
            });
        }
    };

    const handleDelete = async () => {
        if (!selectedProgram) return;
        try {
            await apiClient.delete(`/api/v1/programs/${selectedProgram.id}`);

            setPrograms((prev) => prev.filter((p) => p.id !== selectedProgram.id));
            toast({
                title: 'Program Deleted',
                description: `${selectedProgram.name} has been permanently deleted.`,
                variant: 'success'
            });
            handleCloseDrawer();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete program.',
                variant: 'error'
            });
        }
    };

    const handleDuplicate = async () => {
        if (!selectedProgram) return;
        try {
            // Fetch validation rules to create a valid copy
            // For now, simpler implementation: verify name uniqueness on backend is handled by unique slug, 
            // but for UI let's just create a new one.
            const newProgramData = {
                name: `${selectedProgram.name} (Copy)`,
                description: selectedProgram.description,
                duration: selectedProgram.duration,
                status: 'DRAFT',
            };

            const raw = await apiClient.post<Record<string, unknown>>('/api/v1/programs', newProgramData);
            const newProgram = normalizeProgram(raw);
            setPrograms((prev) => [newProgram, ...prev]);
            toast({
                title: 'Program Duplicated',
                description: `Created "${newProgram.name}" as a draft.`,
                variant: 'success'
            });
            // Open the new program
            setSelectedProgram(newProgram);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to duplicate program.',
                variant: 'error'
            });
        }
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => {
            setSelectedProgram(null);
            setDrawerMode('view');
        }, 200);
    };

    const handleFormSubmit = async (data: ProgramFormData) => {
        setIsSubmitting(true);
        try {
            const apiPayload = {
                name: data.name,
                description: data.description,
                duration: data.duration,
                status: statusToApi[data.status] || data.status,
            };
            if (drawerMode === 'create') {
                const raw = await apiClient.post<Record<string, unknown>>('/api/v1/programs', apiPayload);
                const newProgram = normalizeProgram(raw);
                setPrograms((prev) => [newProgram, ...prev]);
                toast({
                    title: 'Program Created',
                    description: `${data.name} has been created successfully.`,
                    variant: 'success'
                });
            } else if (drawerMode === 'edit' && selectedProgram) {
                const raw = await apiClient.put<Record<string, unknown>>(`/api/v1/programs/${selectedProgram.id}`, apiPayload);
                const updatedProgram = normalizeProgram(raw);
                setPrograms((prev) =>
                    prev.map((p) => (p.id === selectedProgram.id ? updatedProgram : p))
                );
                setSelectedProgram(updatedProgram);
                toast({
                    title: 'Program Updated',
                    description: `${data.name} has been updated.`,
                    variant: 'success'
                });
            }
            handleCloseDrawer();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                description: `Failed to ${drawerMode} program.`,
                variant: 'error'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const programToFormData = (program: Program): Partial<ProgramFormData> => ({
        name: program.name,
        description: program.description,
        duration: program.duration,
        status:
            program.status === 'Archived'
                ? 'Draft'
                : (program.status as 'Active' | 'Draft')
    });

    const getDrawerTitle = () => {
        switch (drawerMode) {
            case 'create':
                return 'Create New Program';
            case 'edit':
                return 'Edit Program';
            default:
                return selectedProgram?.name || 'Program Details';
        }
    };

    return (
        <DashboardLayout
            title="Programs"
            subtitle="Manage curriculum and course offerings"
            currentPage="programs"
            onNavigate={handleNavigate}
        >
            <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <ProgramFilters
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
                        Create Program
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <ProgramsTable
                        programs={filteredPrograms}
                        onProgramClick={handleProgramClick}
                    />
                )}

                <Drawer
                    open={isDrawerOpen}
                    onClose={handleCloseDrawer}
                    title={getDrawerTitle()}
                    size="md"
                    footer={
                        drawerMode === 'create' || drawerMode === 'edit' ? (
                            <ProgramFormFooter
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
                    {drawerMode === 'view' && selectedProgram && (
                        <ProgramDrawer
                            program={selectedProgram}
                            onEdit={handleEditClick}
                            onArchive={handleArchive}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                            onRestore={
                                selectedProgram.status === 'Archived' ? handleRestore : undefined
                            }
                        />
                    )}

                    {drawerMode === 'create' && (
                        <ProgramForm
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDrawer}
                            mode="create"
                        />
                    )}

                    {drawerMode === 'edit' && selectedProgram && (
                        <ProgramForm
                            initialData={programToFormData(selectedProgram)}
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
