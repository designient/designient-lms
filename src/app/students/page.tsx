'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageName, Student, StudentNote } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Drawer } from '@/components/ui/Drawer';
import { Plus, Download, X, Loader2 } from 'lucide-react';

import {
    StudentFilters,
    StudentStatus,
} from '@/components/students/StudentFilters';
import { StudentsTable } from '@/components/students/StudentsTable';
import { StudentDrawer } from '@/components/students/StudentDrawer';
import {
    StudentForm,
    StudentFormData,
    StudentFormFooter,
} from '@/components/students/StudentForm';
import { apiClient } from '@/lib/api-client';

interface ApiStudent {
    id: string;
    userId: string;
    name: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
    status: string;
    cohortId: string | null;
    cohortName?: string;
    enrollmentDate?: string;
    whatsappOptIn?: boolean;
}

function transformStudent(raw: ApiStudent): Student {
    const formatDate = (d: string | null | undefined) => {
        if (!d) return '';
        return new Date(d).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const statusMap: Record<string, Student['status']> = {
        'INVITED': 'Invited',
        'ACTIVE': 'Active',
        'FLAGGED': 'Flagged',
        'DROPPED': 'Dropped',
        'COMPLETED': 'Completed',
        'Invited': 'Invited',
        'Active': 'Active',
        'Flagged': 'Flagged',
        'Dropped': 'Dropped',
        'Completed': 'Completed',
    };

    return {
        id: raw.id,
        name: raw.name || '',
        email: raw.email || '',
        phone: raw.phone || undefined,
        whatsappOptIn: raw.whatsappOptIn,
        cohortId: raw.cohortId || '',
        cohortName: raw.cohortName || '',
        status: statusMap[raw.status] || 'Invited',
        mentor: null,
        mentorId: null,
        lastActivity: '',
        enrollmentDate: formatDate(raw.enrollmentDate),
        progress: 0,
        sessionsAttended: 0,
        totalSessions: 0,
        paymentStatus: 'Pending',
        notes: [],
    };
}

type DrawerMode = 'view' | 'create' | 'edit';

export default function StudentsPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [cohortOptions, setCohortOptions] = useState<{ value: string; label: string }[]>([]);
    const [mentorOptionsList, setMentorOptionsList] = useState<{ value: string; label: string }[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<StudentStatus>('All');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerMode, setDrawerMode] = useState<DrawerMode>('view');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cohortFilter, setCohortFilter] = useState<string | null>(null);

    // Pagination State
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const fetchStudents = useCallback(async () => {
        try {
            setIsLoading(true);
            const [studentsRes, cohortsRes, mentorsRes] = await Promise.all([
                apiClient.get<{ students: ApiStudent[] }>('/api/v1/students?limit=50'),
                apiClient.get<{ cohorts: Array<{ id: string; name: string }> }>('/api/v1/cohorts?limit=50').catch(() => ({ cohorts: [] })),
                apiClient.get<{ mentors: Array<{ id: string; name: string }> }>('/api/v1/mentors?limit=50').catch(() => ({ mentors: [] })),
            ]);
            setStudents(studentsRes.students.map(transformStudent));
            setCohortOptions(cohortsRes.cohorts.map(c => ({ value: c.id, label: c.name })));
            setMentorOptionsList(mentorsRes.mentors.map(m => ({ value: m.id, label: m.name })));
        } catch (error) {
            console.error('Failed to fetch students:', error);
            toast({
                title: 'Error',
                description: 'Failed to load students. Please try again.',
                variant: 'error'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleNavigate = (page: PageName) => {
        router.push(`/${page}`);
    };

    const filteredStudents = useMemo(() => {
        return students.filter((student) => {
            const matchesSearch =
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesFilter =
                activeFilter === 'All' || student.status === activeFilter;
            const matchesCohort = cohortFilter
                ? student.cohortId === cohortFilter
                : true;
            return matchesSearch && matchesFilter && matchesCohort;
        });
    }, [students, searchQuery, activeFilter, cohortFilter]);

    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
    );

    useEffect(() => {
        setPage(1);
    }, [searchQuery, activeFilter, cohortFilter]);

    const handleStudentClick = (student: Student) => {
        setSelectedStudent(student);
        setDrawerMode('view');
        setIsDrawerOpen(true);
    };

    const handleAddStudent = () => {
        setSelectedStudent(null);
        setDrawerMode('create');
        setIsDrawerOpen(true);
    };

    const handleEditStudent = () => {
        setDrawerMode('edit');
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setTimeout(() => {
            setSelectedStudent(null);
            setDrawerMode('view');
        }, 200);
    };

    const handleStatusChange = async (
        newStatus: Student['status'],
        reason?: string
    ) => {
        if (!selectedStudent) return;
        try {
            const statusApiMap: Record<string, string> = {
                'Invited': 'INVITED',
                'Active': 'ACTIVE',
                'Flagged': 'FLAGGED',
                'Dropped': 'DROPPED',
                'Completed': 'COMPLETED',
            };
            await apiClient.put(`/api/v1/students/${selectedStudent.id}`, {
                status: statusApiMap[newStatus] || newStatus,
            });
            const updatedStudent: Student = {
                ...selectedStudent,
                status: newStatus,
                flagReason: newStatus === 'Flagged' ? reason : undefined,
            };
            setSelectedStudent(updatedStudent);
            setStudents((prev) =>
                prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
            );
            toast({
                title: 'Status Updated',
                description: `${selectedStudent.name} is now ${newStatus}`,
                variant: 'success',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update student status.',
                variant: 'error',
            });
        }
    };

    const handleDeleteStudent = async () => {
        if (!selectedStudent) return;
        try {
            await apiClient.delete(`/api/v1/students/${selectedStudent.id}`);
            setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
            toast({
                title: 'Student Removed',
                description: `${selectedStudent.name} has been removed.`,
                variant: 'success',
            });
            handleCloseDrawer();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to remove student.',
                variant: 'error',
            });
        }
    };

    const handleResendInvite = () => {
        if (!selectedStudent) return;
        toast({
            title: 'Invitation Sent',
            description: `Invitation email resent to ${selectedStudent.email}`,
            variant: 'success',
        });
    };

    const handleAssignMentor = async (mentorId: string) => {
        if (!selectedStudent) return;
        try {
            await apiClient.put(`/api/v1/students/${selectedStudent.id}`, {
                mentorId: mentorId,
            });
            const updatedStudent: Student = {
                ...selectedStudent,
                mentorId: mentorId,
            };
            setSelectedStudent(updatedStudent);
            setStudents((prev) =>
                prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
            );
            toast({
                title: 'Mentor Assigned',
                description: `Mentor has been assigned to ${selectedStudent.name}`,
                variant: 'success',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to assign mentor.',
                variant: 'error',
            });
        }
    };

    const handleTransferCohort = async (cohortId: string) => {
        if (!selectedStudent) return;
        try {
            await apiClient.put(`/api/v1/students/${selectedStudent.id}`, {
                cohortId: cohortId,
            });
            const updatedStudent: Student = {
                ...selectedStudent,
                cohortId: cohortId,
            };
            setSelectedStudent(updatedStudent);
            setStudents((prev) =>
                prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
            );
            toast({
                title: 'Student Transferred',
                description: `${selectedStudent.name} has been transferred.`,
                variant: 'success',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to transfer student.',
                variant: 'error',
            });
        }
    };

    const handleAddNote = (content: string) => {
        if (!selectedStudent) return;
        const newNote: StudentNote = {
            id: `N-${Date.now()}`,
            authorId: 'A-001',
            authorName: 'Super Admin',
            authorRole: 'Admin',
            content: content,
            createdAt: new Date().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
            }),
        };
        const updatedStudent: Student = {
            ...selectedStudent,
            notes: [newNote, ...selectedStudent.notes],
        };
        setSelectedStudent(updatedStudent);
        setStudents((prev) =>
            prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
        );
        toast({
            title: 'Note Added',
            description: 'Your note has been added to the student record.',
            variant: 'success',
        });
    };

    const handleUpdatePayment = (status: Student['paymentStatus']) => {
        if (!selectedStudent) return;
        const updatedStudent: Student = {
            ...selectedStudent,
            paymentStatus: status,
        };
        setSelectedStudent(updatedStudent);
        setStudents((prev) =>
            prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
        );
        toast({
            title: 'Payment Updated',
            description: `Payment status changed to ${status}`,
            variant: 'success',
        });
    };

    const handleSendMessage = () => {
        if (!selectedStudent) return;
        handleNavigate('communications');
        toast({
            title: 'Opening Communications',
            description: `Compose a message for ${selectedStudent.name}`,
            variant: 'info',
        });
    };

    const handleFormSubmit = async (data: StudentFormData) => {
        setIsSubmitting(true);
        try {
            if (drawerMode === 'create') {
                const payload = {
                    email: data.email,
                    name: data.name,
                    cohortId: data.cohortId,
                    phone: data.phone || undefined,
                    whatsappOptIn: data.whatsappOptIn,
                    status: 'INVITED',
                };
                const created = await apiClient.post<ApiStudent>('/api/v1/students', payload);
                const newStudent = transformStudent(created);
                setStudents((prev) => [newStudent, ...prev]);
                toast({
                    title: 'Student Added',
                    description: `${data.name} has been successfully invited.`,
                    variant: 'success',
                });
            } else if (drawerMode === 'edit' && selectedStudent) {
                const payload = {
                    cohortId: data.cohortId,
                    phone: data.phone || undefined,
                    whatsappOptIn: data.whatsappOptIn,
                };
                await apiClient.put(`/api/v1/students/${selectedStudent.id}`, payload);
                const updatedStudent: Student = {
                    ...selectedStudent,
                    email: data.email,
                    phone: data.phone || undefined,
                    whatsappOptIn: data.whatsappOptIn,
                    cohortId: data.cohortId,
                };
                setStudents((prev) =>
                    prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
                );
                setSelectedStudent(updatedStudent);
                toast({
                    title: 'Student Updated',
                    description: `${data.name}'s details have been saved.`,
                    variant: 'success',
                });
            }
            handleCloseDrawer();
        } catch (error) {
            const message = error instanceof Error ? error.message : `Failed to ${drawerMode} student.`;
            toast({
                title: 'Error',
                description: message,
                variant: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const studentToFormData = (student: Student): Partial<StudentFormData> => ({
        name: student.name,
        email: student.email,
        phone: student.phone || '',
        alternatePhone: student.alternatePhone || '',
        whatsappOptIn: student.whatsappOptIn ?? true,
        cohortId: student.cohortId,
        mentorId: student.mentorId || '',
        paymentStatus:
            student.paymentStatus === 'Overdue' ||
                student.paymentStatus === 'Refunded'
                ? 'Pending'
                : student.paymentStatus,
        sendInvite: false,
    });

    const handleExport = () => {
        toast({
            title: 'Export Started',
            description: 'Your CSV download will begin shortly.',
            variant: 'info',
        });
        setTimeout(() => {
            toast({
                title: 'Export Complete',
                description: 'Students list has been downloaded.',
                variant: 'success',
            });
        }, 1500);
    };

    const getDrawerTitle = () => {
        switch (drawerMode) {
            case 'create':
                return 'Add New Student';
            case 'edit':
                return 'Edit Student';
            default:
                return 'Student Details';
        }
    };

    return (
        <DashboardLayout
            title="Students"
            subtitle="Manage student enrollment and progress"
            currentPage="students"
            onNavigate={handleNavigate}
        >
            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1 flex flex-col sm:flex-row gap-4">
                        <StudentFilters
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            activeFilter={activeFilter}
                            onFilterChange={(filter) => setActiveFilter(filter)}
                        />

                        {cohortFilter && (
                            <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-md text-sm font-medium self-start sm:self-center">
                                <span>Filtering by Cohort</span>
                                <button
                                    onClick={() => setCohortFilter(null)}
                                    className="hover:bg-primary/20 rounded-full p-0.5"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="gap-2 hidden sm:flex"
                            onClick={handleExport}
                        >
                            <Download className="h-3.5 w-3.5" />
                            Export
                        </Button>
                        <Button
                            className="gap-2 sm:flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={handleAddStudent}
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Add Student
                        </Button>
                    </div>
                </div>

                {/* Main Table */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <StudentsTable
                        students={paginatedStudents}
                        onStudentClick={handleStudentClick}
                    />
                )}

                {/* Pagination */}
                {!isLoading && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={filteredStudents.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setPage}
                    />
                )}

                {/* Detail Drawer */}
                <Drawer
                    open={isDrawerOpen}
                    onClose={handleCloseDrawer}
                    title={getDrawerTitle()}
                    size="md"
                    footer={
                        drawerMode === 'create' || drawerMode === 'edit' ? (
                            <StudentFormFooter
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
                    {drawerMode === 'view' && selectedStudent && (
                        <StudentDrawer
                            student={selectedStudent}
                            onStatusChange={handleStatusChange}
                            onEdit={handleEditStudent}
                            onDelete={handleDeleteStudent}
                            onResendInvite={handleResendInvite}
                            onAssignMentor={handleAssignMentor}
                            onTransferCohort={handleTransferCohort}
                            onAddNote={handleAddNote}
                            onUpdatePayment={handleUpdatePayment}
                            onSendMessage={handleSendMessage}
                            mentorOptions={mentorOptionsList}
                            cohortOptions={cohortOptions}
                        />
                    )}

                    {drawerMode === 'create' && (
                        <StudentForm
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDrawer}
                            mode="create"
                            cohortOptions={cohortOptions}
                            mentorOptions={mentorOptionsList}
                        />
                    )}

                    {drawerMode === 'edit' && selectedStudent && (
                        <StudentForm
                            initialData={studentToFormData(selectedStudent)}
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDrawer}
                            mode="edit"
                            cohortOptions={cohortOptions}
                            mentorOptions={mentorOptionsList}
                        />
                    )}
                </Drawer>
            </div>
        </DashboardLayout>
    );
}
