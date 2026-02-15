'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageName, Student, StudentNote } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { Drawer } from '@/components/ui/Drawer';
import { Plus, Download, X } from 'lucide-react';

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

// Mock Data
const initialStudents: Student[] = [
    {
        id: 'S-1001',
        name: 'Emma Thompson',
        email: 'emma.t@example.com',
        phone: '9876543210',
        cohortId: 'C-2024-001',
        cohortName: 'Spring 2024 Design Systems',
        status: 'Active',
        mentor: 'Sarah Chen',
        mentorId: 'M-001',
        lastActivity: '2 hours ago',
        enrollmentDate: 'Feb 28, 2024',
        progress: 75,
        sessionsAttended: 9,
        totalSessions: 12,
        paymentStatus: 'Paid',
        notes: [
            {
                id: 'N-001',
                authorId: 'M-001',
                authorName: 'Sarah Chen',
                authorRole: 'Mentor',
                content: 'Emma is making excellent progress. Very engaged in sessions.',
                createdAt: 'Mar 10, 2024',
            },
        ],
    },
    {
        id: 'S-1002',
        name: 'James Wilson',
        email: 'j.wilson@design.co',
        cohortId: 'C-2024-002',
        cohortName: 'Winter 2024 Product Strategy',
        status: 'Flagged',
        mentor: 'Mike Ross',
        mentorId: 'M-002',
        lastActivity: '5 days ago',
        enrollmentDate: 'Jan 15, 2024',
        progress: 45,
        sessionsAttended: 5,
        totalSessions: 12,
        paymentStatus: 'Paid',
        notes: [
            {
                id: 'N-002',
                authorId: 'M-002',
                authorName: 'Mike Ross',
                authorRole: 'Mentor',
                content: 'Missed 3 consecutive mentor sessions. Needs follow-up.',
                createdAt: 'Mar 8, 2024',
            },
        ],
        flagReason: 'Missed 3 consecutive mentor sessions',
    },
    {
        id: 'S-1003',
        name: 'Sofia Rodriguez',
        email: 'sofia.r@studio.net',
        cohortId: 'C-2024-003',
        cohortName: 'Spring 2024 Foundations',
        status: 'Invited',
        mentor: null,
        mentorId: null,
        lastActivity: 'Never',
        enrollmentDate: 'Mar 10, 2024',
        progress: 0,
        sessionsAttended: 0,
        totalSessions: 12,
        paymentStatus: 'Pending',
        notes: [],
    },
    {
        id: 'S-1004',
        name: 'Michael Chang',
        email: 'm.chang@tech.io',
        cohortId: 'C-2024-002',
        cohortName: 'Winter 2024 Product Strategy',
        status: 'Completed',
        mentor: 'Alex Kim',
        mentorId: 'M-003',
        lastActivity: '1 week ago',
        enrollmentDate: 'Nov 10, 2023',
        progress: 100,
        sessionsAttended: 12,
        totalSessions: 12,
        paymentStatus: 'Paid',
        notes: [
            {
                id: 'N-003',
                authorId: 'A-001',
                authorName: 'Admin',
                authorRole: 'Admin',
                content: 'Successfully completed the program with distinction.',
                createdAt: 'Feb 15, 2024',
            },
        ],
    },
    {
        id: 'S-1005',
        name: 'Olivia Parker',
        email: 'olivia.p@creative.com',
        cohortId: 'C-2024-001',
        cohortName: 'Spring 2024 Design Systems',
        status: 'Active',
        mentor: 'Sarah Chen',
        mentorId: 'M-001',
        lastActivity: 'Just now',
        enrollmentDate: 'Mar 1, 2024',
        progress: 82,
        sessionsAttended: 10,
        totalSessions: 12,
        paymentStatus: 'Paid',
        notes: [],
    },
    {
        id: 'S-1006',
        name: 'Lucas Silva',
        email: 'lucas.s@freelance.br',
        cohortId: 'C-2024-003',
        cohortName: 'Spring 2024 Foundations',
        status: 'Dropped',
        mentor: 'Jessica Lee',
        mentorId: 'M-004',
        lastActivity: '3 weeks ago',
        enrollmentDate: 'Feb 10, 2024',
        progress: 25,
        sessionsAttended: 3,
        totalSessions: 12,
        paymentStatus: 'Refunded',
        notes: [
            {
                id: 'N-004',
                authorId: 'A-001',
                authorName: 'Admin',
                authorRole: 'Admin',
                content: 'Student requested to withdraw due to personal reasons.',
                createdAt: 'Mar 5, 2024',
            },
        ],
    },
];

// Mentor lookup for assignment
const mentorLookup: Record<string, string> = {
    'M-001': 'Sarah Chen',
    'M-002': 'Mike Ross',
    'M-003': 'Alex Kim',
    'M-004': 'Jessica Lee',
    'M-005': 'David Park',
};

// Cohort lookup
const cohortLookup: Record<string, string> = {
    'C-2024-001': 'Spring 2024 Design Systems',
    'C-2024-002': 'Winter 2024 Product Strategy',
    'C-2024-003': 'Spring 2024 Foundations',
    'C-2024-004': 'Summer 2024 Interaction',
};

type DrawerMode = 'view' | 'create' | 'edit';

export default function StudentsPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [students, setStudents] = useState<Student[]>(initialStudents);
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

    const handleStatusChange = (
        newStatus: Student['status'],
        reason?: string
    ) => {
        if (!selectedStudent) return;
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
    };

    const handleDeleteStudent = () => {
        if (!selectedStudent) return;
        setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
        toast({
            title: 'Student Deleted',
            description: `${selectedStudent.name} has been permanently deleted.`,
            variant: 'success',
        });
        handleCloseDrawer();
    };

    const handleResendInvite = () => {
        if (!selectedStudent) return;
        toast({
            title: 'Invitation Sent',
            description: `Invitation email resent to ${selectedStudent.email}`,
            variant: 'success',
        });
    };

    const handleAssignMentor = (mentorId: string) => {
        if (!selectedStudent) return;
        const mentorName = mentorLookup[mentorId] || 'Unknown Mentor';
        const updatedStudent: Student = {
            ...selectedStudent,
            mentor: mentorName,
            mentorId: mentorId,
        };
        setSelectedStudent(updatedStudent);
        setStudents((prev) =>
            prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
        );
        toast({
            title: 'Mentor Assigned',
            description: `${mentorName} is now assigned to ${selectedStudent.name}`,
            variant: 'success',
        });
    };

    const handleTransferCohort = (cohortId: string) => {
        if (!selectedStudent) return;
        const cohortName = cohortLookup[cohortId] || 'Unknown Cohort';
        const updatedStudent: Student = {
            ...selectedStudent,
            cohortId: cohortId,
            cohortName: cohortName,
        };
        setSelectedStudent(updatedStudent);
        setStudents((prev) =>
            prev.map((s) => (s.id === selectedStudent.id ? updatedStudent : s))
        );
        toast({
            title: 'Student Transferred',
            description: `${selectedStudent.name} transferred to ${cohortName}`,
            variant: 'success',
        });
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

    const handleFormSubmit = (data: StudentFormData) => {
        setIsSubmitting(true);
        setTimeout(() => {
            if (drawerMode === 'create') {
                const newStudent: Student = {
                    id: `S-${String(students.length + 1001).padStart(4, '0')}`,
                    name: data.name,
                    email: data.email,
                    phone: data.phone || undefined,
                    alternatePhone: data.alternatePhone || undefined,
                    whatsappOptIn: data.whatsappOptIn,
                    cohortId: data.cohortId,
                    cohortName: cohortLookup[data.cohortId] || 'Unknown Cohort',
                    status: 'Invited',
                    mentor: data.mentorId ? mentorLookup[data.mentorId] : null,
                    mentorId: data.mentorId || null,
                    lastActivity: 'Never',
                    enrollmentDate: new Date().toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                    }),
                    progress: 0,
                    sessionsAttended: 0,
                    totalSessions: 12,
                    paymentStatus: data.paymentStatus,
                    notes: [],
                };
                setStudents((prev) => [newStudent, ...prev]);
                toast({
                    title: 'Student Added',
                    description: `${data.name} has been successfully invited.`,
                    variant: 'success',
                });
            } else if (drawerMode === 'edit' && selectedStudent) {
                const updatedStudent: Student = {
                    ...selectedStudent,
                    name: data.name,
                    email: data.email,
                    phone: data.phone || undefined,
                    alternatePhone: data.alternatePhone || undefined,
                    whatsappOptIn: data.whatsappOptIn,
                    cohortId: data.cohortId,
                    cohortName: cohortLookup[data.cohortId] || selectedStudent.cohortName,
                    mentor: data.mentorId
                        ? mentorLookup[data.mentorId]
                        : selectedStudent.mentor,
                    mentorId: data.mentorId || selectedStudent.mentorId,
                    paymentStatus: data.paymentStatus,
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
            setIsSubmitting(false);
            handleCloseDrawer();
        }, 500);
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
                                <span>Filtering by Cohort: {cohortLookup[cohortFilter]}</span>
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
                <StudentsTable
                    students={paginatedStudents}
                    onStudentClick={handleStudentClick}
                />

                {/* Pagination */}
                <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={filteredStudents.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setPage}
                />

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
                        />
                    )}

                    {drawerMode === 'create' && (
                        <StudentForm
                            onSubmit={handleFormSubmit}
                            onCancel={handleCloseDrawer}
                            mode="create"
                        />
                    )}

                    {drawerMode === 'edit' && selectedStudent && (
                        <StudentForm
                            initialData={studentToFormData(selectedStudent)}
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
