import React, { useState } from 'react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Label } from './Label';
import { Select } from './Select';
import {
  X,
  Users,
  Layers,
  AlertTriangle,
  CheckCircle2,
  UserCheck } from
'lucide-react';
// Types for mentor assignment
export interface MentorForAssignment {
  id: string;
  name: string;
  email: string;
  currentLoad: number;
  maxCohorts: number;
  status: 'Active' | 'Inactive';
}
export interface CohortForAssignment {
  id: string;
  name: string;
  status: 'Active' | 'Upcoming' | 'Completed' | 'Archived';
  currentMentors: string[];
}
// Assign Mentor to Cohort Modal (from Mentor Drawer)
interface AssignMentorToCohortProps {
  open: boolean;
  onClose: () => void;
  mentor: MentorForAssignment;
  availableCohorts: CohortForAssignment[];
  onConfirm: (cohortId: string) => void;
}
export function AssignMentorToCohortModal({
  open,
  onClose,
  mentor,
  availableCohorts,
  onConfirm
}: AssignMentorToCohortProps) {
  const [selectedCohortId, setSelectedCohortId] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  if (!open) return null;
  const isAtCapacity = mentor.currentLoad >= mentor.maxCohorts;
  const isNearCapacity = mentor.currentLoad >= mentor.maxCohorts - 1;
  const selectedCohort = availableCohorts.find((c) => c.id === selectedCohortId);
  const handleSelectCohort = (cohortId: string) => {
    setSelectedCohortId(cohortId);
    setShowConfirmation(false);
  };
  const handleProceed = () => {
    if (!selectedCohortId) return;
    setShowConfirmation(true);
  };
  const handleConfirm = () => {
    onConfirm(selectedCohortId);
    handleClose();
  };
  const handleClose = () => {
    setSelectedCohortId('');
    setShowConfirmation(false);
    onClose();
  };
  const cohortOptions = availableCohorts.
  filter((c) => c.status === 'Active' || c.status === 'Upcoming').
  map((c) => ({
    value: c.id,
    label: c.name
  }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose} />


      {/* Modal */}
      <div className="relative z-50 w-full max-w-md mx-4 bg-background rounded-xl shadow-xl border border-border/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Assign to Cohort
            </h2>
            <p className="text-sm text-muted-foreground">
              Assign {mentor.name} to a cohort
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors">

            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mentor Load Indicator */}
          <div
            className={`p-4 rounded-lg border ${isAtCapacity ? 'bg-red-50/50 border-red-200/60' : isNearCapacity ? 'bg-amber-50/50 border-amber-200/60' : 'bg-muted/30 border-border/60'}`}>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`h-10 w-10 rounded-lg flex items-center justify-center ${isAtCapacity ? 'bg-red-100' : isNearCapacity ? 'bg-amber-100' : 'bg-primary/10'}`}>

                  <Users
                    className={`h-5 w-5 ${isAtCapacity ? 'text-red-600' : isNearCapacity ? 'text-amber-600' : 'text-primary'}`} />

                </div>
                <div>
                  <span className="text-sm font-medium text-foreground block">
                    Current Mentor Load
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {mentor.currentLoad} of {mentor.maxCohorts} cohorts assigned
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`text-2xl font-bold ${isAtCapacity ? 'text-red-600' : isNearCapacity ? 'text-amber-600' : 'text-foreground'}`}>

                  {mentor.currentLoad}
                </span>
                <span className="text-muted-foreground">
                  /{mentor.maxCohorts}
                </span>
              </div>
            </div>

            {/* Capacity Bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isAtCapacity ? 'bg-red-500' : isNearCapacity ? 'bg-amber-500' : 'bg-primary'}`}
                style={{
                  width: `${mentor.currentLoad / mentor.maxCohorts * 100}%`
                }} />

            </div>

            {isAtCapacity &&
            <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Mentor is at maximum capacity. Increase limit or remove an
                assignment first.
              </p>
            }
          </div>

          {/* Cohort Selection */}
          {!isAtCapacity &&
          <div className="space-y-2">
              <Label htmlFor="cohort">Select Cohort</Label>
              <Select
              id="cohort"
              placeholder="Choose a cohort to assign..."
              options={cohortOptions}
              value={selectedCohortId}
              onChange={(e) => handleSelectCohort(e.target.value)} />

              {cohortOptions.length === 0 &&
            <p className="text-xs text-muted-foreground">
                  No available cohorts to assign. The mentor may already be
                  assigned to all active cohorts.
                </p>
            }
            </div>
          }

          {/* Selected Cohort Preview */}
          {selectedCohort && !showConfirmation &&
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground block">
                    {selectedCohort.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge
                    variant={
                    selectedCohort.status === 'Active' ?
                    'success' :
                    'neutral'
                    }
                    className="text-[10px]">

                      {selectedCohort.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {selectedCohort.currentMentors.length} mentor
                      {selectedCohort.currentMentors.length !== 1 ? 's' : ''}{' '}
                      assigned
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }

          {/* Confirmation Step */}
          {showConfirmation && selectedCohort &&
          <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/60 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-emerald-800">
                    Confirm Assignment
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Assign <strong>{mentor.name}</strong> to{' '}
                    <strong>{selectedCohort.name}</strong>?
                  </p>
                  <p className="text-xs text-emerald-600 mt-2">
                    After this assignment, the mentor will have{' '}
                    {mentor.currentLoad + 1} of {mentor.maxCohorts} cohorts.
                  </p>
                </div>
              </div>
            </div>
          }
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          {!showConfirmation ?
          <Button
            onClick={handleProceed}
            disabled={!selectedCohortId || isAtCapacity}
            className="flex-1">

              Continue
            </Button> :

          <Button
            onClick={handleConfirm}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700">

              <UserCheck className="h-4 w-4 mr-2" />
              Confirm Assignment
            </Button>
          }
        </div>
      </div>
    </div>);

}
// Assign Mentor to Cohort Modal (from Cohort Drawer)
interface AssignMentorFromCohortProps {
  open: boolean;
  onClose: () => void;
  cohort: CohortForAssignment;
  availableMentors: MentorForAssignment[];
  onConfirm: (mentorId: string) => void;
}
export function AssignMentorFromCohortModal({
  open,
  onClose,
  cohort,
  availableMentors,
  onConfirm
}: AssignMentorFromCohortProps) {
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  if (!open) return null;
  const selectedMentor = availableMentors.find((m) => m.id === selectedMentorId);
  const isSelectedAtCapacity = selectedMentor ?
  selectedMentor.currentLoad >= selectedMentor.maxCohorts :
  false;
  const handleSelectMentor = (mentorId: string) => {
    setSelectedMentorId(mentorId);
    setShowConfirmation(false);
  };
  const handleProceed = () => {
    if (!selectedMentorId || isSelectedAtCapacity) return;
    setShowConfirmation(true);
  };
  const handleConfirm = () => {
    onConfirm(selectedMentorId);
    handleClose();
  };
  const handleClose = () => {
    setSelectedMentorId('');
    setShowConfirmation(false);
    onClose();
  };
  // Filter to only active mentors not already assigned
  const eligibleMentors = availableMentors.filter(
    (m) => m.status === 'Active' && !cohort.currentMentors.includes(m.name)
  );
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose} />


      {/* Modal */}
      <div className="relative z-50 w-full max-w-md mx-4 bg-background rounded-xl shadow-xl border border-border/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Assign Mentor
            </h2>
            <p className="text-sm text-muted-foreground">
              Add a mentor to {cohort.name}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-muted transition-colors">

            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Current Mentors */}
          <div className="p-3 rounded-lg bg-muted/30 border border-border/60">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Current Mentors ({cohort.currentMentors.length})
              </span>
            </div>
            {cohort.currentMentors.length > 0 ?
            <div className="flex flex-wrap gap-2">
                {cohort.currentMentors.map((mentor, idx) =>
              <div
                key={idx}
                className="flex items-center gap-2 bg-background border border-border/60 px-2.5 py-1.5 rounded-lg text-sm">

                    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 flex items-center justify-center text-[10px] font-semibold text-emerald-700">
                      {mentor.charAt(0)}
                    </div>
                    {mentor}
                  </div>
              )}
              </div> :

            <p className="text-sm text-muted-foreground italic">
                No mentors assigned yet
              </p>
            }
          </div>

          {/* Mentor Selection */}
          <div className="space-y-3">
            <Label>Select Mentor to Assign</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {eligibleMentors.map((mentor) => {
                const isAtCapacity = mentor.currentLoad >= mentor.maxCohorts;
                const isSelected = mentor.id === selectedMentorId;
                return (
                  <button
                    key={mentor.id}
                    onClick={() =>
                    !isAtCapacity && handleSelectMentor(mentor.id)
                    }
                    disabled={isAtCapacity}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${isSelected ? 'bg-primary/5 border-primary/30' : isAtCapacity ? 'bg-muted/20 border-border/40 opacity-50 cursor-not-allowed' : 'bg-transparent border-border/60 hover:bg-muted/40'}`}>

                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-lg flex items-center justify-center text-sm font-semibold ${isSelected ? 'bg-primary/10 text-primary' : 'bg-gradient-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-700'}`}>

                        {mentor.name.charAt(0)}
                      </div>
                      <div>
                        <span className="text-sm font-medium text-foreground block">
                          {mentor.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {mentor.email}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-medium ${isAtCapacity ? 'text-red-600' : 'text-foreground'}`}>

                        {mentor.currentLoad}/{mentor.maxCohorts}
                      </span>
                      {isAtCapacity &&
                      <span className="text-[10px] text-red-600 block">
                          At capacity
                        </span>
                      }
                    </div>
                  </button>);

              })}
              {eligibleMentors.length === 0 &&
              <p className="text-sm text-muted-foreground text-center py-4">
                  No available mentors to assign.
                </p>
              }
            </div>
          </div>

          {/* Confirmation Step */}
          {showConfirmation && selectedMentor &&
          <div className="p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/60 space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-emerald-800">
                    Confirm Assignment
                  </h4>
                  <p className="text-xs text-emerald-700 mt-1">
                    Assign <strong>{selectedMentor.name}</strong> to{' '}
                    <strong>{cohort.name}</strong>?
                  </p>
                  <p className="text-xs text-emerald-600 mt-2">
                    After this, {selectedMentor.name} will have{' '}
                    {selectedMentor.currentLoad + 1} of{' '}
                    {selectedMentor.maxCohorts} cohorts.
                  </p>
                </div>
              </div>
            </div>
          }
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border bg-muted/30">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          {!showConfirmation ?
          <Button
            onClick={handleProceed}
            disabled={!selectedMentorId || isSelectedAtCapacity}
            className="flex-1">

              Continue
            </Button> :

          <Button
            onClick={handleConfirm}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700">

              <UserCheck className="h-4 w-4 mr-2" />
              Confirm Assignment
            </Button>
          }
        </div>
      </div>
    </div>);

}