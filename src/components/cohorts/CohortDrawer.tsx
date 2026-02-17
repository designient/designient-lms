import React, { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DrawerSection, DrawerDivider } from '../ui/Drawer';
import {
    AssignMentorFromCohortModal,
    MentorForAssignment
} from '../ui/AssignmentModal';
import {
    Calendar,
    Users,
    UserCheck,
    BookOpen,
    Pencil,
    UserPlus,
    Archive,
    ArrowRight,
    Clock,
    X,
    AlertTriangle,
    CreditCard,
    CalendarDays,
    Copy,
    Trash2,
    CheckCircle,
    RotateCcw,
    Plus,
    Video
} from 'lucide-react';
import { Cohort } from '../../types';

export interface StudentSummary {
    id: string;
    name: string;
    status: 'Invited' | 'Active' | 'Flagged' | 'Dropped' | 'Completed';
}

export interface CourseSummary {
    id: string;
    title: string;
    level: string;
    modules: number;
    enrollments: number;
}

interface CohortDrawerProps {
    cohort: Cohort;
    onEdit: () => void;
    onViewStudents: (cohortId: string) => void;
    onUpdateCohort?: (cohort: Cohort) => void;
    onArchive?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onMarkComplete?: () => void;
    onRestore?: () => void;
    availableMentors?: MentorForAssignment[];
    students?: StudentSummary[];
    // API-backed course + mentor assignment
    cohortCourses?: CourseSummary[];
    allCourses?: CourseSummary[];
    onAssignMentor?: (mentorId: string) => Promise<void>;
    onRemoveMentor?: (mentorId: string) => Promise<void>;
    onAssignCourse?: (courseId: string) => Promise<void>;
    onRemoveCourse?: (courseId: string) => Promise<void>;
}

const getStatusVariant = (status: StudentSummary['status']) => {
    switch (status) {
        case 'Active':
            return 'success';
        case 'Flagged':
            return 'warning';
        case 'Invited':
            return 'neutral';
        case 'Dropped':
            return 'destructive';
        case 'Completed':
            return 'default';
        default:
            return 'neutral';
    }
};

const getCohortStatusVariant = (status: Cohort['status']) => {
    switch (status) {
        case 'Active':
            return 'success';
        case 'Upcoming':
            return 'neutral';
        case 'Completed':
            return 'secondary';
        case 'Archived':
            return 'outline';
        default:
            return 'neutral';
    }
};

export function CohortDrawer({
    cohort,
    onEdit,
    onViewStudents,
    onUpdateCohort,
    onArchive,
    onDelete,
    onDuplicate,
    onMarkComplete,
    onRestore,
    availableMentors = [],
    students = [],
    cohortCourses = [],
    allCourses = [],
    onAssignMentor,
    onRemoveMentor,
    onAssignCourse,
    onRemoveCourse,
}: CohortDrawerProps) {
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [showAddCourse, setShowAddCourse] = useState(false);
    const [isMentorAssigning, setIsMentorAssigning] = useState(false);
    const [isCourseAssigning, setIsCourseAssigning] = useState(false);

    // Sessions state
    interface SessionItem {
        id: string;
        title: string;
        courseTitle: string;
        courseId: string;
        scheduledAt: string;
        duration: number;
        attendanceCount: number;
        studentCount: number;
    }
    const [sessions, setSessions] = useState<SessionItem[]>([]);
    const [showCreateSession, setShowCreateSession] = useState(false);
    const [sessionForm, setSessionForm] = useState({ title: '', courseId: '', scheduledAt: '', duration: 60 });
    const [isSessionSubmitting, setIsSessionSubmitting] = useState(false);

    const fetchSessions = useCallback(async () => {
        try {
            const res = await apiClient.get<{ sessions: SessionItem[] }>(`/api/v1/cohorts/${cohort.id}/sessions`);
            setSessions(res.sessions);
        } catch { setSessions([]); }
    }, [cohort.id]);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const handleCreateSession = async () => {
        if (!sessionForm.title || !sessionForm.courseId || !sessionForm.scheduledAt) return;
        setIsSessionSubmitting(true);
        try {
            await apiClient.post(`/api/v1/cohorts/${cohort.id}/sessions`, sessionForm);
            await fetchSessions();
            setShowCreateSession(false);
            setSessionForm({ title: '', courseId: '', scheduledAt: '', duration: 60 });
        } catch (err) {
            console.error('Failed to create session:', err);
        } finally {
            setIsSessionSubmitting(false);
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            await apiClient.delete(`/api/v1/sessions/${sessionId}`);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    const handleAssignMentor = async (mentorId: string) => {
        if (onAssignMentor) {
            setIsMentorAssigning(true);
            try {
                await onAssignMentor(mentorId);
            } finally {
                setIsMentorAssigning(false);
            }
        } else {
            // Fallback to local state if no API handler
            const mentor = availableMentors.find((m) => m.id === mentorId);
            if (!mentor || !onUpdateCohort) return;
            onUpdateCohort({
                ...cohort,
                mentors: [...cohort.mentors, mentor.name]
            });
        }
    };

    const handleRemoveMentor = async (mentorId: string, mentorName: string) => {
        if (onRemoveMentor) {
            setIsMentorAssigning(true);
            try {
                await onRemoveMentor(mentorId);
            } finally {
                setIsMentorAssigning(false);
            }
        } else {
            if (!onUpdateCohort) return;
            onUpdateCohort({
                ...cohort,
                mentors: cohort.mentors.filter((m) => m !== mentorName)
            });
        }
    };

    const handleAssignCourse = async (courseId: string) => {
        if (!onAssignCourse) return;
        setIsCourseAssigning(true);
        try {
            await onAssignCourse(courseId);
            setShowAddCourse(false);
        } finally {
            setIsCourseAssigning(false);
        }
    };

    const handleRemoveCourse = async (courseId: string) => {
        if (!onRemoveCourse) return;
        setIsCourseAssigning(true);
        try {
            await onRemoveCourse(courseId);
        } finally {
            setIsCourseAssigning(false);
        }
    };

    const assignedCourseIds = new Set(cohortCourses.map(c => c.id));
    const availableCoursesForAdd = allCourses.filter(c => !assignedCourseIds.has(c.id));

    const handleArchiveConfirm = () => {
        if (onArchive) onArchive();
        setShowArchiveConfirm(false);
    };

    const handleDeleteConfirm = () => {
        if (onDelete) onDelete();
        setShowDeleteConfirm(false);
    };

    const handleCompleteConfirm = () => {
        if (onMarkComplete) onMarkComplete();
        setShowCompleteConfirm(false);
    };

    const handleRestoreConfirm = () => {
        if (onRestore) onRestore();
        setShowRestoreConfirm(false);
    };

    const cohortForModal = {
        id: cohort.id,
        name: cohort.name,
        status: cohort.status,
        currentMentors: cohort.mentors
    };

    const capacityPercentage = Math.min(
        100,
        (cohort.studentCount / cohort.capacity) * 100
    );
    const isNearCapacity = capacityPercentage >= 90;

    return (
        <div className="space-y-6">
            {/* Status & ID Header */}
            <div className="flex items-center justify-between">
                <Badge
                    variant={getCohortStatusVariant(cohort.status)}
                    className="px-2.5 py-1"
                >
                    {cohort.status}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                    {cohort.id}
                </span>
            </div>

            {/* Overview Section */}
            <DrawerSection title="Overview">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block">
                                Program
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {cohort.programName}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">
                                    Start Date
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    {cohort.startDate}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">
                                    End Date
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    {cohort.endDate}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block">
                                Tuition
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: cohort.currency
                                }).format(cohort.price)}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                    Assigned Mentors ({cohort.mentors.length})
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 pl-6">
                            {cohort.mentors.map((mentor, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 bg-muted/50 border border-border/60 px-2.5 py-1.5 rounded-lg text-sm group"
                                >
                                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center text-[10px] font-semibold text-emerald-700">
                                        {mentor.charAt(0)}
                                    </div>
                                    {mentor}
                                    {(onRemoveMentor || onUpdateCohort) && (
                                        <button
                                            onClick={() => handleRemoveMentor(cohort.mentorIds?.[idx] || '', mentor)}
                                            className="p-0.5 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                            disabled={isMentorAssigning}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {cohort.mentors.length === 0 && (
                                <span className="text-sm text-muted-foreground italic">
                                    No mentors assigned
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Enrollment & Capacity */}
            <DrawerSection title="Enrollment">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">Capacity</span>
                            </div>
                            <span
                                className={`font-medium ${isNearCapacity ? 'text-amber-600' : 'text-foreground'
                                    }`}
                            >
                                {cohort.studentCount} / {cohort.capacity} Students
                            </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div
                                className={`h-full rounded-full ${isNearCapacity ? 'bg-amber-500' : 'bg-primary'
                                    }`}
                                style={{
                                    width: `${capacityPercentage}%`
                                }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <div>
                            <span className="text-xs text-muted-foreground block">
                                Enrollment Deadline
                            </span>
                            <span className="text-sm font-medium">
                                {cohort.enrollmentDeadline}
                            </span>
                        </div>
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Students Summary Section */}
            <DrawerSection title="Students">
                <div className="space-y-3">
                    <div className="space-y-2">
                        {students.slice(0, 5).map((student) => (
                            <div
                                key={student.id}
                                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                                        {student.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-foreground">
                                        {student.name}
                                    </span>
                                </div>
                                <Badge
                                    variant={getStatusVariant(student.status)}
                                    className="text-[10px]"
                                >
                                    {student.status}
                                </Badge>
                            </div>
                        ))}
                    </div>

                    {cohort.studentCount > 5 && (
                        <p className="text-xs text-muted-foreground text-center py-1">
                            +{cohort.studentCount - 5} more students
                        </p>
                    )}

                    <button
                        onClick={() => onViewStudents(cohort.id)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-border/60 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                    >
                        Manage Students
                        <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Courses Section */}
            <DrawerSection title="Assigned Courses">
                <div className="space-y-3">
                    {cohortCourses.length > 0 ? (
                        <div className="space-y-2">
                            {cohortCourses.map((course) => (
                                <div
                                    key={course.id}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center text-xs font-semibold text-blue-700">
                                            <BookOpen className="h-3.5 w-3.5" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-foreground block">
                                                {course.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {course.modules} modules · {course.level}
                                            </span>
                                        </div>
                                    </div>
                                    {onRemoveCourse && (
                                        <button
                                            onClick={() => handleRemoveCourse(course.id)}
                                            className="p-0.5 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                            disabled={isCourseAssigning}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic px-3">
                            No courses assigned to this cohort
                        </p>
                    )}

                    {onAssignCourse && (
                        <>
                            {!showAddCourse ? (
                                <Button
                                    onClick={() => setShowAddCourse(true)}
                                    className="w-full justify-start gap-3"
                                    variant="outline"
                                    size="sm"
                                >
                                    <BookOpen className="h-4 w-4" />
                                    Add Course
                                </Button>
                            ) : (
                                <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                                    <p className="text-xs font-medium text-muted-foreground">Select a course to assign:</p>
                                    {availableCoursesForAdd.length > 0 ? (
                                        <div className="space-y-1 max-h-40 overflow-y-auto">
                                            {availableCoursesForAdd.map((course) => (
                                                <button
                                                    key={course.id}
                                                    onClick={() => handleAssignCourse(course.id)}
                                                    disabled={isCourseAssigning}
                                                    className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-primary/5 transition-colors disabled:opacity-50"
                                                >
                                                    {course.title}
                                                    <span className="text-xs text-muted-foreground ml-2">({course.level})</span>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground italic">All courses already assigned</p>
                                    )}
                                    <Button
                                        onClick={() => setShowAddCourse(false)}
                                        variant="outline"
                                        size="sm"
                                        className="w-full"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Class Sessions Section */}
            <DrawerSection title="Class Sessions">
                <div className="space-y-3">
                    {sessions.length > 0 ? (
                        <div className="space-y-2">
                            {sessions.slice(0, 5).map((session) => (
                                <div
                                    key={session.id}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-500/10 flex items-center justify-center">
                                            <Video className="h-3.5 w-3.5 text-violet-600" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-foreground block">
                                                {session.title}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {session.courseTitle} · {new Date(session.scheduledAt).toLocaleDateString()} · {session.duration}min
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {session.attendanceCount}/{session.studentCount}
                                        </span>
                                        <button
                                            onClick={() => handleDeleteSession(session.id)}
                                            className="p-0.5 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {sessions.length > 5 && (
                                <p className="text-xs text-muted-foreground text-center py-1">
                                    +{sessions.length - 5} more sessions
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic px-3">
                            No class sessions scheduled
                        </p>
                    )}

                    {!showCreateSession ? (
                        <Button
                            onClick={() => setShowCreateSession(true)}
                            className="w-full justify-start gap-3"
                            variant="outline"
                            size="sm"
                        >
                            <Plus className="h-4 w-4" />
                            Schedule Session
                        </Button>
                    ) : (
                        <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-2">
                            <input
                                type="text"
                                placeholder="Session title"
                                value={sessionForm.title}
                                onChange={(e) => setSessionForm(prev => ({ ...prev, title: e.target.value }))}
                                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <select
                                value={sessionForm.courseId}
                                onChange={(e) => setSessionForm(prev => ({ ...prev, courseId: e.target.value }))}
                                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <option value="">Select course</option>
                                {cohortCourses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                            <input
                                type="datetime-local"
                                value={sessionForm.scheduledAt}
                                onChange={(e) => setSessionForm(prev => ({ ...prev, scheduledAt: e.target.value }))}
                                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="15"
                                    max="480"
                                    value={sessionForm.duration}
                                    onChange={(e) => setSessionForm(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                                    className="w-24 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                                <span className="text-xs text-muted-foreground">minutes</span>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button
                                    onClick={handleCreateSession}
                                    size="sm"
                                    disabled={isSessionSubmitting || !sessionForm.title || !sessionForm.courseId || !sessionForm.scheduledAt}
                                    className="flex-1"
                                >
                                    {isSessionSubmitting ? 'Creating...' : 'Create Session'}
                                </Button>
                                <Button
                                    onClick={() => setShowCreateSession(false)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Actions Section */}
            <DrawerSection title="Actions">
                <div className="space-y-2">
                    {cohort.status !== 'Archived' && cohort.status !== 'Completed' && (
                        <Button
                            onClick={onEdit}
                            className="w-full justify-start gap-3"
                            variant="outline"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit Cohort Details
                        </Button>
                    )}

                    <Button
                        onClick={() => setShowAssignModal(true)}
                        className="w-full justify-start gap-3"
                        variant="outline"
                    >
                        <UserPlus className="h-4 w-4" />
                        Assign Mentor
                    </Button>

                    {onDuplicate && (
                        <Button
                            onClick={onDuplicate}
                            className="w-full justify-start gap-3"
                            variant="outline"
                        >
                            <Copy className="h-4 w-4" />
                            Duplicate Cohort
                        </Button>
                    )}

                    {/* Restore Cohort */}
                    {cohort.status === 'Archived' && onRestore && (
                        <>
                            {!showRestoreConfirm ? (
                                <Button
                                    onClick={() => setShowRestoreConfirm(true)}
                                    className="w-full justify-start gap-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                    variant="outline"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Restore Cohort
                                </Button>
                            ) : (
                                <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/60 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <RotateCcw className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-emerald-800">
                                                Restore Cohort?
                                            </h4>
                                            <p className="text-xs text-emerald-700 mt-1">
                                                This will restore <strong>{cohort.name}</strong> to its
                                                previous status.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowRestoreConfirm(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleRestoreConfirm}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            Confirm
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Mark as Complete */}
                    {cohort.status === 'Active' && onMarkComplete && (
                        <>
                            {!showCompleteConfirm ? (
                                <Button
                                    onClick={() => setShowCompleteConfirm(true)}
                                    className="w-full justify-start gap-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                                    variant="outline"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Mark as Completed
                                </Button>
                            ) : (
                                <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/60 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="h-4 w-4 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-emerald-800">
                                                Complete Cohort?
                                            </h4>
                                            <p className="text-xs text-emerald-700 mt-1">
                                                This will mark <strong>{cohort.name}</strong> as
                                                completed. Students will be eligible for certificates.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowCompleteConfirm(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleCompleteConfirm}
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            Confirm
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {cohort.status !== 'Archived' && cohort.status !== 'Completed' && (
                        <>
                            {!showArchiveConfirm ? (
                                <Button
                                    onClick={() => setShowArchiveConfirm(true)}
                                    className="w-full justify-start gap-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                    variant="outline"
                                >
                                    <Archive className="h-4 w-4" />
                                    Archive Cohort
                                </Button>
                            ) : (
                                <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200/60 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-amber-800">
                                                Confirm Archive
                                            </h4>
                                            <p className="text-xs text-amber-700 mt-1">
                                                This will archive <strong>{cohort.name}</strong>.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowArchiveConfirm(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleArchiveConfirm}
                                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                                        >
                                            Confirm Archive
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Delete Cohort - only if no students */}
                    {cohort.studentCount === 0 && onDelete && (
                        <>
                            {!showDeleteConfirm ? (
                                <Button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
                                    variant="outline"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Cohort
                                </Button>
                            ) : (
                                <div className="p-4 rounded-lg bg-red-50/50 border border-red-200/60 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-red-800">
                                                Delete Cohort?
                                            </h4>
                                            <p className="text-xs text-red-700 mt-1">
                                                This will permanently delete{' '}
                                                <strong>{cohort.name}</strong>. This action cannot be
                                                undone.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleDeleteConfirm}
                                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {cohort.studentCount > 0 && (
                        <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/30 rounded-lg">
                            💡 Cohorts with enrolled students cannot be deleted. Archive it
                            instead.
                        </p>
                    )}
                </div>
            </DrawerSection>

            {cohort.description && (
                <>
                    <DrawerDivider />
                    <DrawerSection title="Description">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {cohort.description}
                        </p>
                    </DrawerSection>
                </>
            )}

            <AssignMentorFromCohortModal
                open={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                cohort={cohortForModal}
                availableMentors={availableMentors}
                onConfirm={handleAssignMentor}
            />
        </div>
    );
}
