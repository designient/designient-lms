import React, { useMemo, useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import {
  ProgramFilters,
  ProgramStatus } from
'../components/programs/ProgramFilters';
import { ProgramsTable } from '../components/programs/ProgramsTable';
import { ProgramDrawer } from '../components/programs/ProgramDrawer';
import {
  ProgramForm,
  ProgramFormData,
  ProgramFormFooter } from
'../components/programs/ProgramForm';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import { Plus } from 'lucide-react';
import { PageName } from '../components/layout/Sidebar';
import { Program } from '../types';
// Mock Data
const initialPrograms: Program[] = [
{
  id: 'P-001',
  name: 'Advanced UI',
  description:
  'Master the art of user interface design with advanced techniques in layout, typography, and color theory.',
  duration: '12 weeks',
  status: 'Active',
  cohortCount: 3,
  createdAt: 'Jan 15, 2023'
},
{
  id: 'P-002',
  name: 'Product Design',
  description:
  'End-to-end product design process from research to prototyping and handoff.',
  duration: '16 weeks',
  status: 'Active',
  cohortCount: 4,
  createdAt: 'Feb 20, 2023'
},
{
  id: 'P-003',
  name: 'UX Fundamentals',
  description:
  'Core principles of user experience design, usability testing, and information architecture.',
  duration: '8 weeks',
  status: 'Active',
  cohortCount: 2,
  createdAt: 'Mar 10, 2023'
},
{
  id: 'P-004',
  name: 'UX Research',
  description:
  'Deep dive into qualitative and quantitative research methods for digital products.',
  duration: '12 weeks',
  status: 'Active',
  cohortCount: 2,
  createdAt: 'Apr 5, 2023'
},
{
  id: 'P-005',
  name: 'Interaction Design',
  description:
  'Creating engaging and intuitive interactions for web and mobile applications.',
  duration: '10 weeks',
  status: 'Draft',
  cohortCount: 0,
  createdAt: 'May 12, 2023'
},
{
  id: 'P-006',
  name: 'Career Development',
  description:
  'Portfolio building, interview preparation, and career strategy for designers.',
  duration: '4 weeks',
  status: 'Active',
  cohortCount: 1,
  createdAt: 'Jun 1, 2023'
}];

type DrawerMode = 'view' | 'create' | 'edit';
interface ProgramsPageProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
  onBillingClick?: () => void;
  onSelectEntity?: (type: 'student' | 'mentor' | 'cohort', id: string) => void;
}
export function ProgramsPage({
  currentPage,
  onNavigate,
  onBillingClick,
  onSelectEntity
}: ProgramsPageProps) {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<Program[]>(initialPrograms);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ProgramStatus>('All');
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const filteredPrograms = useMemo(() => {
    return programs.filter((program) => {
      const matchesSearch = program.name.
      toLowerCase().
      includes(searchQuery.toLowerCase());
      const matchesFilter =
      activeFilter === 'All' || program.status === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [programs, searchQuery, activeFilter]);
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
  const handleArchive = () => {
    if (!selectedProgram) return;
    const updatedProgram: Program = {
      ...selectedProgram,
      status: 'Archived'
    };
    setPrograms((prev) =>
    prev.map((p) => p.id === selectedProgram.id ? updatedProgram : p)
    );
    setSelectedProgram(updatedProgram);
    toast({
      title: 'Program Archived',
      description: `${selectedProgram.name} has been archived.`,
      variant: 'info'
    });
  };
  const handleRestore = () => {
    if (!selectedProgram) return;
    const updatedProgram: Program = {
      ...selectedProgram,
      status: 'Draft'
    };
    setPrograms((prev) =>
    prev.map((p) => p.id === selectedProgram.id ? updatedProgram : p)
    );
    setSelectedProgram(updatedProgram);
    toast({
      title: 'Program Restored',
      description: `${selectedProgram.name} has been restored as a draft.`,
      variant: 'success'
    });
  };
  const handleDelete = () => {
    if (!selectedProgram) return;
    setPrograms((prev) => prev.filter((p) => p.id !== selectedProgram.id));
    toast({
      title: 'Program Deleted',
      description: `${selectedProgram.name} has been permanently deleted.`,
      variant: 'success'
    });
    handleCloseDrawer();
  };
  const handleDuplicate = () => {
    if (!selectedProgram) return;
    const newProgram: Program = {
      id: `P-${String(programs.length + 1).padStart(3, '0')}`,
      name: `${selectedProgram.name} (Copy)`,
      description: selectedProgram.description,
      duration: selectedProgram.duration,
      status: 'Draft',
      cohortCount: 0,
      createdAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    };
    setPrograms((prev) => [newProgram, ...prev]);
    toast({
      title: 'Program Duplicated',
      description: `Created "${newProgram.name}" as a draft.`,
      variant: 'success'
    });
    // Open the new program
    setSelectedProgram(newProgram);
  };
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedProgram(null);
      setDrawerMode('view');
    }, 200);
  };
  const handleFormSubmit = (data: ProgramFormData) => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (drawerMode === 'create') {
        const newProgram: Program = {
          id: `P-${String(programs.length + 1).padStart(3, '0')}`,
          name: data.name,
          description: data.description,
          duration: data.duration,
          status: data.status,
          cohortCount: 0,
          createdAt: new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        };
        setPrograms((prev) => [newProgram, ...prev]);
        toast({
          title: 'Program Created',
          description: `${data.name} has been created successfully.`,
          variant: 'success'
        });
      } else if (drawerMode === 'edit' && selectedProgram) {
        const updatedProgram: Program = {
          ...selectedProgram,
          name: data.name,
          description: data.description,
          duration: data.duration,
          status: data.status
        };
        setPrograms((prev) =>
        prev.map((p) => p.id === selectedProgram.id ? updatedProgram : p)
        );
        setSelectedProgram(updatedProgram);
        toast({
          title: 'Program Updated',
          description: `${data.name} has been updated.`,
          variant: 'success'
        });
      }
      setIsSubmitting(false);
      handleCloseDrawer();
    }, 500);
  };
  const programToFormData = (program: Program): Partial<ProgramFormData> => ({
    name: program.name,
    description: program.description,
    duration: program.duration,
    status:
    program.status === 'Archived' ?
    'Draft' :
    program.status as 'Active' | 'Draft'
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
      currentPage={currentPage}
      onNavigate={onNavigate}
      onBillingClick={onBillingClick}
      onSelectEntity={onSelectEntity}>

      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <ProgramFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter} />

          <Button
            className="gap-2 sm:flex-shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={handleCreateClick}>

            <Plus className="h-3.5 w-3.5" />
            Create Program
          </Button>
        </div>

        <ProgramsTable
          programs={filteredPrograms}
          onProgramClick={handleProgramClick} />


        <Drawer
          open={isDrawerOpen}
          onClose={handleCloseDrawer}
          title={getDrawerTitle()}
          size="md"
          footer={
          drawerMode === 'create' || drawerMode === 'edit' ?
          <ProgramFormFooter
            onSubmit={() => {
              const form = document.querySelector('form');
              if (form) form.requestSubmit();
            }}
            onCancel={handleCloseDrawer}
            isSubmitting={isSubmitting}
            mode={drawerMode} /> :

          undefined
          }>

          {drawerMode === 'view' && selectedProgram &&
          <ProgramDrawer
            program={selectedProgram}
            onEdit={handleEditClick}
            onArchive={handleArchive}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
            onRestore={
            selectedProgram.status === 'Archived' ?
            handleRestore :
            undefined
            } />

          }
          {drawerMode === 'create' &&
          <ProgramForm
            onSubmit={handleFormSubmit}
            onCancel={handleCloseDrawer}
            mode="create" />

          }
          {drawerMode === 'edit' && selectedProgram &&
          <ProgramForm
            initialData={programToFormData(selectedProgram)}
            onSubmit={handleFormSubmit}
            onCancel={handleCloseDrawer}
            mode="edit" />

          }
        </Drawer>
      </div>
    </DashboardLayout>);

}