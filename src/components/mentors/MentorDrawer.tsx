import React, { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { DrawerSection, DrawerDivider } from '../ui/Drawer';
import {
    AssignMentorToCohortModal,
    CohortForAssignment
} from '../ui/AssignmentModal';
import {
    Mail,
    Calendar,
    Clock,
    Layers,
    UserX,
    UserCheck,
    Plus,
    X,
    AlertTriangle,
    Users,
    Star,
    Activity,
    Pencil,
    Trash2,
    Send
} from 'lucide-react';
import { Mentor, AssignedCohort } from './MentorsTable';

interface MentorDrawerProps {
    mentor: Mentor;
    onUpdateMentor: (mentor: Mentor) => void;
    onDeactivate: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onSendMessage?: () => void;
    availableCohorts?: CohortForAssignment[];
}

export function MentorDrawer({
    mentor,
    onUpdateMentor,
    onDeactivate,
    onEdit,
    onDelete,
    onSendMessage,
    availableCohorts = []
}: MentorDrawerProps) {
    const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const maxCohorts = mentor.maxCohorts;
    const availabilityOptions = [
        { value: 'Available', label: 'Available' },
        { value: 'Limited', label: 'Limited' },
        { value: 'Unavailable', label: 'Unavailable' },
    ];

    const getCohortStatusVariant = (status: string) => {
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

    const getAvailabilityVariant = (status: Mentor['availabilityStatus']) => {
        switch (status) {
            case 'Available':
                return 'success';
            case 'Limited':
                return 'warning';
            case 'Unavailable':
                return 'neutral';
            default:
                return 'neutral';
        }
    };

    const handleAssignCohort = (cohortId: string) => {
        const cohort = availableCohorts.find((c) => c.id === cohortId);
        if (!cohort || mentor.assignedCohorts.length >= maxCohorts) return;
        const newCohort: AssignedCohort = {
            id: cohortId,
            name: cohort.name,
            status: cohort.status as AssignedCohort['status']
        };
        onUpdateMentor({
            ...mentor,
            assignedCohorts: [...mentor.assignedCohorts, newCohort]
        });
    };

    const handleRemoveCohort = (cohortId: string) => {
        onUpdateMentor({
            ...mentor,
            assignedCohorts: mentor.assignedCohorts.filter((c) => c.id !== cohortId)
        });
    };

    const handleMaxCohortsChange = (value: number) => {
        const newMax = Math.max(1, Math.min(10, value));
        onUpdateMentor({
            ...mentor,
            maxCohorts: newMax
        });
    };

    const handleAvailabilityChange = (value: string) => {
        onUpdateMentor({
            ...mentor,
            availabilityStatus: value as Mentor['availabilityStatus'],
        });
    };

    const handleDeactivate = () => {
        onDeactivate();
        setShowDeactivateConfirm(false);
    };

    const handleActivate = () => {
        onUpdateMentor({
            ...mentor,
            status: 'Active'
        });
    };

    const handleDeleteConfirm = () => {
        onDelete();
        setShowDeleteConfirm(false);
    };

    const unassignedCohorts = availableCohorts.filter(
        (c) => !mentor.assignedCohorts.some((ac) => ac.id === c.id)
    );

    const isAtCapacity = mentor.assignedCohorts.length >= maxCohorts;

    const mentorForModal = {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        currentLoad: mentor.assignedCohorts.length,
        maxCohorts: maxCohorts,
        status: mentor.status
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                {mentor.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={mentor.avatarUrl}
                        alt={mentor.name}
                        className="h-14 w-14 rounded-xl object-cover border border-border/50 flex-shrink-0"
                    />
                ) : (
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center text-xl font-semibold text-emerald-700 flex-shrink-0">
                        {mentor.name.charAt(0)}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-foreground truncate">
                            {mentor.name}
                        </h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onEdit}
                            className="h-7 w-7 p-0"
                            title="Edit Mentor"
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge
                            variant={mentor.status === 'Active' ? 'success' : 'neutral'}
                            className="gap-1"
                        >
                            {mentor.status === 'Active' ? (
                                <UserCheck className="h-3 w-3" />
                            ) : (
                                <UserX className="h-3 w-3" />
                            )}
                            {mentor.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                            ID: {mentor.id}
                        </span>
                    </div>
                </div>
            </div>

            <DrawerDivider />

            {/* Performance Stats */}
            <DrawerSection title="Performance">
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-xs text-muted-foreground">Rating</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-lg font-semibold">{mentor.rating}</span>
                            <span className="text-xs text-muted-foreground">
                                ({mentor.totalReviews} reviews)
                            </span>
                        </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                                Total Students
                            </span>
                        </div>
                        <span className="text-lg font-semibold">
                            {mentor.totalStudentsMentored}
                        </span>
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Overview */}
            <DrawerSection title="Overview">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 py-2">
                        <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground block">Email</span>
                            <a
                                href={`mailto:${mentor.email}`}
                                className="text-sm font-medium text-primary hover:underline"
                            >
                                {mentor.email}
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 py-2">
                            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">
                                    Joined
                                </span>
                                <span className="text-sm font-medium">{mentor.joinDate}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-2">
                            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">
                                    Last Active
                                </span>
                                <span className="text-sm font-medium">{mentor.lastActive}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Assigned Cohorts */}
            <DrawerSection title="Assigned Cohorts">
                <div className="space-y-3">
                    {mentor.assignedCohorts.length > 0 ? (
                        <div className="space-y-2">
                            {mentor.assignedCohorts.map((cohort) => (
                                <div
                                    key={cohort.id}
                                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Layers className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <div>
                                            <span className="text-sm font-medium text-foreground block">
                                                {cohort.name}
                                            </span>
                                            <Badge
                                                variant={getCohortStatusVariant(cohort.status)}
                                                className="mt-1 text-[10px] px-1.5 py-0"
                                            >
                                                {cohort.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveCohort(cohort.id)}
                                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Remove from cohort"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground italic py-2">
                            No cohorts currently assigned.
                        </p>
                    )}

                    {mentor.status === 'Active' && (
                        <div className="pt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAssignModal(true)}
                                disabled={unassignedCohorts.length === 0}
                                className="w-full gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Assign to Cohort
                            </Button>
                            {isAtCapacity && (
                                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Mentor is at maximum capacity
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Capacity & Availability */}
            <DrawerSection title="Capacity & Availability">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Activity className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <span className="text-sm font-medium text-foreground">
                                    Availability
                                </span>
                                <p className="text-xs text-muted-foreground">Current status</p>
                            </div>
                        </div>
                        <Badge variant={getAvailabilityVariant(mentor.availabilityStatus)}>
                            {mentor.availabilityStatus}
                        </Badge>
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="availabilityStatus">Update Availability</Label>
                        <Select
                            id="availabilityStatus"
                            options={availabilityOptions}
                            value={mentor.availabilityStatus}
                            onChange={(e) => handleAvailabilityChange(e.target.value)}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="maxCohorts">Maximum Cohorts Allowed</Label>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleMaxCohortsChange(maxCohorts - 1)}
                                disabled={maxCohorts <= 1}
                                className="h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                -
                            </button>
                            <Input
                                id="maxCohorts"
                                type="number"
                                min={1}
                                max={10}
                                value={maxCohorts}
                                onChange={(e) =>
                                    handleMaxCohortsChange(parseInt(e.target.value) || 1)
                                }
                                className="w-20 text-center"
                            />
                            <button
                                onClick={() => handleMaxCohortsChange(maxCohorts + 1)}
                                disabled={maxCohorts >= 10}
                                className="h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {mentor.assignedCohorts.length} of {maxCohorts} slots filled
                        </p>
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Actions */}
            <DrawerSection title="Actions">
                <div className="space-y-2">
                    <Button
                        variant="outline"
                        onClick={onEdit}
                        className="w-full justify-start gap-3"
                    >
                        <Pencil className="h-4 w-4" />
                        Edit Mentor Details
                    </Button>

                    {onSendMessage && (
                        <Button
                            variant="outline"
                            onClick={onSendMessage}
                            className="w-full justify-start gap-3"
                        >
                            <Send className="h-4 w-4" />
                            Send Message
                        </Button>
                    )}

                    {mentor.status === 'Active' ? (
                        <>
                            {!showDeactivateConfirm ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDeactivateConfirm(true)}
                                    className="w-full justify-start gap-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                                >
                                    <UserX className="h-4 w-4" />
                                    Deactivate Mentor
                                </Button>
                            ) : (
                                <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-200/60 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-amber-800">
                                                Confirm Deactivation
                                            </h4>
                                            <p className="text-xs text-amber-700 mt-1">
                                                This will remove <strong>{mentor.name}</strong> from all
                                                assigned cohorts.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDeactivateConfirm(false)}
                                            className="flex-1"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleDeactivate}
                                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                                        >
                                            Confirm Deactivate
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={handleActivate}
                            className="w-full justify-start gap-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                        >
                            <UserCheck className="h-4 w-4" />
                            Reactivate Mentor
                        </Button>
                    )}

                    {/* Delete Mentor - only if no assigned cohorts */}
                    {mentor.assignedCohorts.length === 0 && (
                        <>
                            {!showDeleteConfirm ? (
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete Mentor
                                </Button>
                            ) : (
                                <div className="p-4 rounded-lg bg-red-50/50 border border-red-200/60 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <AlertTriangle className="h-4 w-4 text-red-600" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-red-800">
                                                Delete Mentor?
                                            </h4>
                                            <p className="text-xs text-red-700 mt-1">
                                                This will permanently delete{' '}
                                                <strong>{mentor.name}</strong>. This action cannot be
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

                    {mentor.assignedCohorts.length > 0 && (
                        <p className="text-xs text-muted-foreground px-3 py-2 bg-muted/30 rounded-lg">
                            💡 Mentors with assigned cohorts cannot be deleted. Remove them
                            from all cohorts first.
                        </p>
                    )}
                </div>
            </DrawerSection>

            {mentor.bio && (
                <>
                    <DrawerDivider />
                    <DrawerSection title="Bio">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            {mentor.bio}
                        </p>
                    </DrawerSection>
                </>
            )}

            <AssignMentorToCohortModal
                open={showAssignModal}
                onClose={() => setShowAssignModal(false)}
                mentor={mentorForModal}
                availableCohorts={unassignedCohorts}
                onConfirm={handleAssignCohort}
            />
        </div>
    );
}
