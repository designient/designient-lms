import React, { useEffect, useState, createElement } from 'react';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { DrawerSection, DrawerDivider } from '../ui/Drawer';
import {
  Mail,
  Calendar,
  Clock,
  User,
  Flag,
  CheckCircle,
  XCircle,
  Send,
  AlertTriangle,
  ChevronDown,
  Layers,
  CreditCard,
  BarChart,
  Plus,
  Pencil,
  RefreshCw,
  ArrowRightLeft,
  Trash2,
  UserPlus } from
'lucide-react';
import { Student, StudentNote } from '../../types';
interface StudentDrawerProps {
  student: Student;
  onStatusChange: (status: Student['status'], reason?: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onResendInvite: () => void;
  onAssignMentor: (mentorId: string) => void;
  onTransferCohort: (cohortId: string) => void;
  onAddNote: (content: string) => void;
  onUpdatePayment: (status: Student['paymentStatus']) => void;
  onSendMessage: () => void;
}
const statusConfig: Record<
  Student['status'],
  {
    icon: any;
    variant: 'success' | 'warning' | 'neutral' | 'destructive' | 'default';
    description: string;
  }> =
{
  Invited: {
    icon: Mail,
    variant: 'neutral',
    description: "Student has been invited but hasn't joined yet."
  },
  Active: {
    icon: CheckCircle,
    variant: 'success',
    description: 'Student is actively participating in the cohort.'
  },
  Flagged: {
    icon: Flag,
    variant: 'warning',
    description: 'Student requires attention or follow-up.'
  },
  Dropped: {
    icon: XCircle,
    variant: 'destructive',
    description: 'Student has been removed from the cohort.'
  },
  Completed: {
    icon: CheckCircle,
    variant: 'default',
    description: 'Student has successfully completed the program.'
  }
};
const statusOptions: Student['status'][] = [
'Invited',
'Active',
'Flagged',
'Dropped',
'Completed'];

// Mock data for dropdowns
const mentorOptions = [
{
  value: 'M-001',
  label: 'Sarah Chen'
},
{
  value: 'M-002',
  label: 'Mike Ross'
},
{
  value: 'M-003',
  label: 'Alex Kim'
},
{
  value: 'M-004',
  label: 'Jessica Lee'
},
{
  value: 'M-005',
  label: 'David Park'
}];

const cohortOptions = [
{
  value: 'C-2024-001',
  label: 'Spring 2024 Design Systems'
},
{
  value: 'C-2024-002',
  label: 'Winter 2024 Product Strategy'
},
{
  value: 'C-2024-003',
  label: 'Spring 2024 Foundations'
},
{
  value: 'C-2024-004',
  label: 'Summer 2024 Interaction'
}];

const paymentOptions = [
{
  value: 'Paid',
  label: 'Paid'
},
{
  value: 'Pending',
  label: 'Pending'
},
{
  value: 'Overdue',
  label: 'Overdue'
},
{
  value: 'Refunded',
  label: 'Refunded'
}];

export function StudentDrawer({
  student,
  onStatusChange,
  onEdit,
  onDelete,
  onResendInvite,
  onAssignMentor,
  onTransferCohort,
  onAddNote,
  onUpdatePayment,
  onSendMessage
}: StudentDrawerProps) {
  const [selectedStatus, setSelectedStatus] = useState<Student['status']>(
    student.status
  );
  const [flagReason, setFlagReason] = useState('');
  const [showDropConfirm, setShowDropConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  // New state for additional actions
  const [showMentorAssign, setShowMentorAssign] = useState(false);
  const [selectedMentorId, setSelectedMentorId] = useState(
    student.mentorId || ''
  );
  const [showTransferCohort, setShowTransferCohort] = useState(false);
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [showPaymentUpdate, setShowPaymentUpdate] = useState(false);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(
    student.paymentStatus
  );
  useEffect(() => {
    setSelectedStatus(student.status);
    setFlagReason('');
    setShowDropConfirm(false);
    setShowDeleteConfirm(false);
    setIsStatusDropdownOpen(false);
    setShowMentorAssign(false);
    setSelectedMentorId(student.mentorId || '');
    setShowTransferCohort(false);
    setSelectedCohortId('');
    setShowAddNote(false);
    setNewNoteContent('');
    setShowPaymentUpdate(false);
    setSelectedPaymentStatus(student.paymentStatus);
  }, [student.id]);
  const currentConfig = statusConfig[student.status];
  const StatusIcon = currentConfig.icon;
  const handleStatusSelect = (status: Student['status']) => {
    setSelectedStatus(status);
    setIsStatusDropdownOpen(false);
    setFlagReason('');
    setShowDropConfirm(false);
    if (status === 'Dropped') {
      setShowDropConfirm(true);
    }
  };
  const handleConfirmChange = () => {
    if (selectedStatus === 'Flagged') {
      onStatusChange(selectedStatus, flagReason || undefined);
    } else {
      onStatusChange(selectedStatus);
    }
    setShowDropConfirm(false);
  };
  const handleCancelChange = () => {
    setSelectedStatus(student.status);
    setShowDropConfirm(false);
    setFlagReason('');
  };
  const handleDeleteConfirm = () => {
    onDelete();
    setShowDeleteConfirm(false);
  };
  const handleMentorAssign = () => {
    if (selectedMentorId) {
      onAssignMentor(selectedMentorId);
      setShowMentorAssign(false);
    }
  };
  const handleTransferCohort = () => {
    if (selectedCohortId && selectedCohortId !== student.cohortId) {
      onTransferCohort(selectedCohortId);
      setShowTransferCohort(false);
      setSelectedCohortId('');
    }
  };
  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      onAddNote(newNoteContent.trim());
      setNewNoteContent('');
      setShowAddNote(false);
    }
  };
  const handlePaymentUpdate = () => {
    if (selectedPaymentStatus !== student.paymentStatus) {
      onUpdatePayment(selectedPaymentStatus);
      setShowPaymentUpdate(false);
    }
  };
  const hasUnsavedChanges = selectedStatus !== student.status;
  const getPaymentVariant = (status: Student['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return 'success';
      case 'Pending':
        return 'neutral';
      case 'Overdue':
        return 'warning';
      case 'Refunded':
        return 'secondary';
      default:
        return 'neutral';
    }
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xl font-semibold text-primary flex-shrink-0">
          {student.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground truncate">
              {student.name}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-7 w-7 p-0"
              title="Edit Student">

              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>
          <a
            href={`mailto:${student.email}`}
            className="text-sm text-muted-foreground hover:text-primary hover:underline transition-colors">

            {student.email}
          </a>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant={currentConfig.variant} className="gap-1">
              <StatusIcon className="h-3 w-3" />
              {student.status}
            </Badge>
            <span className="text-xs text-muted-foreground">
              ID: {student.id}
            </span>
          </div>
        </div>
      </div>

      <DrawerDivider />

      {/* Progress & Stats */}
      <DrawerSection title="Progress & Activity">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Course Progress</span>
              <span className="font-medium">{student.progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{
                  width: `${student.progress}%`
                }} />

            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <BarChart className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Attendance
                </span>
              </div>
              <p className="text-sm font-medium">
                {student.sessionsAttended} / {student.totalSessions} Sessions
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={getPaymentVariant(student.paymentStatus)}
                  className="text-[10px] px-1.5 py-0">

                  {student.paymentStatus}
                </Badge>
                <button
                  onClick={() => setShowPaymentUpdate(!showPaymentUpdate)}
                  className="text-xs text-primary hover:underline">

                  Update
                </button>
              </div>
            </div>
          </div>

          {/* Payment Update */}
          {showPaymentUpdate &&
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3">
              <Label>Update Payment Status</Label>
              <Select
              options={paymentOptions}
              value={selectedPaymentStatus}
              onChange={(e) =>
              setSelectedPaymentStatus(
                e.target.value as Student['paymentStatus']
              )
              } />

              <div className="flex gap-2">
                <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentUpdate(false)}
                className="flex-1">

                  Cancel
                </Button>
                <Button
                size="sm"
                onClick={handlePaymentUpdate}
                disabled={selectedPaymentStatus === student.paymentStatus}
                className="flex-1">

                  Update
                </Button>
              </div>
            </div>
          }
        </div>
      </DrawerSection>

      <DrawerDivider />

      {/* Lifecycle State */}
      <DrawerSection title="Lifecycle State">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Change State</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex h-10 w-full items-center justify-between rounded-lg border border-border/60 bg-transparent px-3 py-2 text-sm transition-all hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/20">

                <div className="flex items-center gap-2">
                  {createElement(statusConfig[selectedStatus].icon, {
                    className: 'h-4 w-4 text-muted-foreground'
                  })}
                  <span
                    className={
                    selectedStatus !== student.status ? 'font-medium' : ''
                    }>

                    {selectedStatus}
                  </span>
                  {selectedStatus !== student.status &&
                  <span className="text-xs text-muted-foreground">
                      (unsaved)
                    </span>
                  }
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />

              </button>

              {isStatusDropdownOpen &&
              <div className="absolute z-10 mt-1 w-full rounded-lg border border-border/60 bg-background shadow-lg">
                  {statusOptions.map((status) => {
                  const config = statusConfig[status];
                  const Icon = config.icon;
                  const isSelected = status === selectedStatus;
                  const isCurrent = status === student.status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusSelect(status)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${isSelected ? 'bg-primary/5 text-foreground' : 'hover:bg-muted/50 text-muted-foreground'}`}>

                        <Icon className="h-4 w-4" />
                        <span className="flex-1 text-left">{status}</span>
                        {isCurrent &&
                      <span className="text-xs text-muted-foreground">
                            Current
                          </span>
                      }
                      </button>);

                })}
                </div>
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {statusConfig[selectedStatus].description}
            </p>
          </div>

          {selectedStatus === 'Flagged' &&
          selectedStatus !== student.status &&
          <div className="space-y-1.5 p-3 rounded-lg bg-amber-50/50 border border-amber-200/60">
                <Label htmlFor="flagReason" className="text-amber-800">
                  <Flag className="h-3.5 w-3.5 inline mr-1.5" />
                  Reason for Flagging (Optional)
                </Label>
                <Textarea
              id="flagReason"
              placeholder="e.g., Missed 3 consecutive sessions..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              rows={3}
              className="bg-white border-amber-200/80 focus:border-amber-300 focus:ring-amber-200/50" />

              </div>
          }

          {showDropConfirm &&
          <div className="p-4 rounded-lg bg-red-50/50 border border-red-200/60 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    Confirm Drop Student
                  </h4>
                  <p className="text-xs text-red-700 mt-1">
                    This will remove <strong>{student.name}</strong> from the
                    cohort.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                variant="outline"
                size="sm"
                onClick={handleCancelChange}
                className="flex-1">

                  Cancel
                </Button>
                <Button
                size="sm"
                onClick={handleConfirmChange}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white">

                  Confirm Drop
                </Button>
              </div>
            </div>
          }

          {hasUnsavedChanges && !showDropConfirm &&
          <div className="flex gap-2">
              <Button
              variant="outline"
              size="sm"
              onClick={handleCancelChange}
              className="flex-1">

                Cancel
              </Button>
              <Button
              size="sm"
              onClick={handleConfirmChange}
              className="flex-1">

                Save Changes
              </Button>
            </div>
          }
        </div>
      </DrawerSection>

      <DrawerDivider />

      {/* Details */}
      <DrawerSection title="Details">
        <div className="space-y-3">
          <div className="flex items-center gap-3 py-2">
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground block">
                Cohort
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">
                  {student.cohortName}
                </span>
                <button
                  onClick={() => setShowTransferCohort(!showTransferCohort)}
                  className="text-xs text-primary hover:underline flex items-center gap-1">

                  <ArrowRightLeft className="h-3 w-3" />
                  Transfer
                </button>
              </div>
            </div>
          </div>

          {/* Transfer Cohort */}
          {showTransferCohort &&
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3 ml-11">
              <Label>Transfer to Cohort</Label>
              <Select
              placeholder="Select new cohort"
              options={cohortOptions.filter(
                (c) => c.value !== student.cohortId
              )}
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)} />

              <div className="flex gap-2">
                <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTransferCohort(false)}
                className="flex-1">

                  Cancel
                </Button>
                <Button
                size="sm"
                onClick={handleTransferCohort}
                disabled={!selectedCohortId}
                className="flex-1">

                  Transfer
                </Button>
              </div>
            </div>
          }

          <div className="flex items-center gap-3 py-2">
            <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs text-muted-foreground block">
                Assigned Mentor
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${!student.mentor ? 'text-muted-foreground italic' : ''}`}>

                  {student.mentor || 'Unassigned'}
                </span>
                <button
                  onClick={() => setShowMentorAssign(!showMentorAssign)}
                  className="text-xs text-primary hover:underline flex items-center gap-1">

                  <UserPlus className="h-3 w-3" />
                  {student.mentor ? 'Change' : 'Assign'}
                </button>
              </div>
            </div>
          </div>

          {/* Mentor Assignment */}
          {showMentorAssign &&
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50 space-y-3 ml-11">
              <Label>Assign Mentor</Label>
              <Select
              placeholder="Select mentor"
              options={mentorOptions}
              value={selectedMentorId}
              onChange={(e) => setSelectedMentorId(e.target.value)} />

              <div className="flex gap-2">
                <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMentorAssign(false)}
                className="flex-1">

                  Cancel
                </Button>
                <Button
                size="sm"
                onClick={handleMentorAssign}
                disabled={!selectedMentorId}
                className="flex-1">

                  Assign
                </Button>
              </div>
            </div>
          }

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 py-2">
              <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">
                  Enrolled
                </span>
                <span className="text-sm font-medium">
                  {student.enrollmentDate}
                </span>
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
                <span className="text-sm font-medium">
                  {student.lastActivity}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DrawerSection>

      <DrawerDivider />

      {/* Notes */}
      <DrawerSection title="Notes">
        <div className="space-y-3">
          {student.notes.length > 0 ?
          <div className="space-y-3">
              {student.notes.map((note) =>
            <div
              key={note.id}
              className="p-3 rounded-lg bg-muted/30 border border-border/50 text-sm">

                  <p className="text-foreground mb-2">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium">
                      {note.authorName} ({note.authorRole})
                    </span>
                    <span>{note.createdAt}</span>
                  </div>
                </div>
            )}
            </div> :

          <p className="text-sm text-muted-foreground italic">
              No notes added yet.
            </p>
          }

          {showAddNote ?
          <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <Label>Add Note</Label>
              <Textarea
              placeholder="Enter note content..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
              className="resize-none" />

              <div className="flex gap-2">
                <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddNote(false);
                  setNewNoteContent('');
                }}
                className="flex-1">

                  Cancel
                </Button>
                <Button
                size="sm"
                onClick={handleAddNote}
                disabled={!newNoteContent.trim()}
                className="flex-1">

                  Add Note
                </Button>
              </div>
            </div> :

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddNote(true)}
            className="w-full gap-2">

              <Plus className="h-3.5 w-3.5" />
              Add Note
            </Button>
          }
        </div>
      </DrawerSection>

      <DrawerDivider />

      {/* Quick Actions */}
      <DrawerSection title="Quick Actions">
        <div className="space-y-2">
          {student.status === 'Invited' &&
          <Button
            variant="outline"
            onClick={onResendInvite}
            className="w-full justify-start gap-3">

              <RefreshCw className="h-4 w-4" />
              Resend Invitation
            </Button>
          }

          <Button
            variant="outline"
            onClick={onSendMessage}
            className="w-full justify-start gap-3">

            <Send className="h-4 w-4" />
            Send Message
          </Button>

          <Button
            variant="outline"
            onClick={onEdit}
            className="w-full justify-start gap-3">

            <Pencil className="h-4 w-4" />
            Edit Student Details
          </Button>

          {/* Delete Student */}
          {!showDeleteConfirm ?
          <Button
            variant="outline"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/5 border-destructive/30">

              <Trash2 className="h-4 w-4" />
              Delete Student
            </Button> :

          <div className="p-4 rounded-lg bg-red-50/50 border border-red-200/60 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-red-800">
                    Delete Student?
                  </h4>
                  <p className="text-xs text-red-700 mt-1">
                    This will permanently delete <strong>{student.name}</strong>{' '}
                    and all their data. This action cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1">

                  Cancel
                </Button>
                <Button
                size="sm"
                onClick={handleDeleteConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white">

                  Delete
                </Button>
              </div>
            </div>
          }
        </div>
      </DrawerSection>
    </div>);

}