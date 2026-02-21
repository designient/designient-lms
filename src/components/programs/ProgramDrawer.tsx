import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { DrawerSection, DrawerDivider } from '../ui/Drawer';
import {
    BookOpen,
    Clock,
    Calendar,
    Layers,
    Pencil,
    Archive,
    AlertTriangle,
    Copy,
    Trash2,
    RotateCcw,
    Hammer,
    FileText,
    Users
} from 'lucide-react';
import { Program } from '../../types';

interface ProgramDrawerProps {
    program: Program;
    onEdit: () => void;
    onArchive: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onRestore?: () => void;
    onCreateSyllabusCourse?: () => Promise<void>;
    isSyllabusUpdating?: boolean;
}

export function ProgramDrawer({
    program,
    onEdit,
    onArchive,
    onDelete,
    onDuplicate,
    onRestore,
    onCreateSyllabusCourse,
    isSyllabusUpdating = false,
}: ProgramDrawerProps) {
    const router = useRouter();
    const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const getStatusVariant = (status: Program['status']) => {
        switch (status) {
            case 'Active':
                return 'success';
            case 'Draft':
                return 'neutral';
            case 'Archived':
                return 'outline';
            default:
                return 'neutral';
        }
    };

    const handleArchiveConfirm = () => {
        onArchive();
        setShowArchiveConfirm(false);
    };

    const handleDeleteConfirm = () => {
        onDelete();
        setShowDeleteConfirm(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <Badge
                    variant={getStatusVariant(program.status)}
                    className="px-2.5 py-1"
                >
                    {program.status}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                    {program.id}
                </span>
            </div>

            {/* Overview */}
            <DrawerSection title="Overview">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block">
                                Program Name
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {program.name}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">
                                    Duration
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    {program.duration}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">
                                    Created
                                </span>
                                <span className="text-sm font-medium text-foreground">
                                    {program.createdAt}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0">
                            <Layers className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <span className="text-xs text-muted-foreground block">
                                Total Cohorts
                            </span>
                            <span className="text-sm font-medium text-foreground">
                                {program.cohortCount} cohorts run this program
                            </span>
                        </div>
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Description */}
            {program.description && (
                <>
                    <DrawerSection title="Description">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {program.description}
                        </p>
                    </DrawerSection>
                    <DrawerDivider />
                </>
            )}

            {/* Course Content */}
            {program.course && (
                <>
                    <DrawerSection title="Course Content">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                                        <FileText className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-foreground block">{program.course.title}</span>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Badge variant={program.course.isPublished ? 'success' : 'neutral'} className="text-[10px] px-1.5 py-0">
                                                {program.course.isPublished ? 'Published' : 'Draft'}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {program.course._count.modules} modules
                                            </span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Users className="h-3 w-3" /> {program.course._count.enrollments} enrolled
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button
                                onClick={() => router.push(`/dashboard/courses/${program.course!.id}/builder`)}
                                className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Hammer className="h-4 w-4" />
                                Manage Syllabus
                            </Button>
                        </div>
                    </DrawerSection>
                    <DrawerDivider />
                </>
            )}

            {!program.course && (
                <>
                    <DrawerSection title="Course Content">
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                No syllabus is linked to this program yet.
                            </p>
                            {onCreateSyllabusCourse && (
                                <Button
                                    onClick={() => onCreateSyllabusCourse()}
                                    disabled={isSyllabusUpdating}
                                    className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Hammer className="h-4 w-4" />
                                    {isSyllabusUpdating ? 'Creating...' : 'Create Syllabus Course'}
                                </Button>
                            )}
                        </div>
                    </DrawerSection>
                    <DrawerDivider />
                </>
            )}

            {/* Actions */}
            <DrawerSection title="Actions">
                <div className="space-y-2">
                    {program.status !== 'Archived' && (
                        <Button
                            onClick={onEdit}
                            className="w-full justify-start gap-3"
                            variant="outline"
                        >
                            <Pencil className="h-4 w-4" />
                            Edit Program Details
                        </Button>
                    )}

                    <Button
                        onClick={onDuplicate}
                        className="w-full justify-start gap-3"
                        variant="outline"
                    >
                        <Copy className="h-4 w-4" />
                        Duplicate Program
                    </Button>

                    {program.status === 'Archived' && onRestore && (
                        <Button
                            onClick={onRestore}
                            className="w-full justify-start gap-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            variant="outline"
                        >
                            <RotateCcw className="h-4 w-4" />
                            Restore Program
                        </Button>
                    )}

                    {program.status !== 'Archived' && (
                        <>
                            {!showArchiveConfirm ? (
                                <Button
                                    onClick={() => setShowArchiveConfirm(true)}
                                    className="w-full justify-start gap-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                    variant="outline"
                                >
                                    <Archive className="h-4 w-4" />
                                    Archive Program
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
                                                This will archive <strong>{program.name}</strong>. It
                                                will no longer be available for new cohorts.
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

                    {/* Delete Program */}
                    {program.cohortCount === 0 && (
                        <>
                            {!showDeleteConfirm ? (
                                <Button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
                                    variant="outline"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Program
                                </Button>
                            ) : (
                                <div className="p-4 rounded-lg bg-red-50/50 border border-red-200/60 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-red-800">
                                                Delete Program?
                                            </h4>
                                            <p className="text-xs text-red-700 mt-1">
                                                This will permanently delete{' '}
                                                <strong>{program.name}</strong>. This action cannot be
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

                    {program.cohortCount > 0 && (
                        <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/30 rounded-lg">
                            💡 Programs with active cohorts cannot be deleted. Archive it
                            instead.
                        </p>
                    )}
                </div>
            </DrawerSection>
        </div>
    );
}
