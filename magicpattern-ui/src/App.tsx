import React, { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { AnalyticsPage } from './pages/Analytics';
import { CohortsPage } from './pages/Cohorts';
import { ProgramsPage } from './pages/Programs';
import { StudentsPage } from './pages/Students';
import { MentorsPage } from './pages/Mentors';
import { CommunicationsPage } from './pages/Communications';
import { SettingsPage, SettingsTab } from './pages/Settings';
import { PageName } from './components/layout/Sidebar';
import { ToastProvider } from './components/ui/Toast';
export function App() {
  const [currentPage, setCurrentPage] = useState<PageName>('dashboard');
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('organization');
  const [studentCohortFilter, setStudentCohortFilter] = useState<string | null>(
    null
  );
  // Fix 1: Search navigation state
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'student' | 'mentor' | 'cohort';
    id: string;
  } | null>(null);
  // Fix 2: Message recipient state
  const [messageRecipient, setMessageRecipient] = useState<{
    type: 'individual' | 'cohort';
    id: string;
    name: string;
  } | null>(null);
  const handleNavigate = (page: PageName) => {
    setCurrentPage(page);
    // Reset filters when navigating away from students
    if (page !== 'students') {
      setStudentCohortFilter(null);
    }
    // Reset selected entity when navigating manually
    setSelectedEntity(null);
    // Reset message recipient when navigating manually (unless going to communications)
    if (page !== 'communications') {
      setMessageRecipient(null);
    }
  };
  const handleBillingClick = () => {
    setCurrentPage('settings');
    setSettingsTab('billing');
  };
  const handleViewCohortStudents = (cohortId: string) => {
    setCurrentPage('students');
    setStudentCohortFilter(cohortId);
  };
  const handleSelectEntity = (
  type: 'student' | 'mentor' | 'cohort',
  id: string) =>
  {
    setSelectedEntity({
      type,
      id
    });
    if (type === 'student') setCurrentPage('students');
    if (type === 'mentor') setCurrentPage('mentors');
    if (type === 'cohort') setCurrentPage('cohorts');
  };
  const handleComposeMessage = (recipient: {
    type: 'individual' | 'cohort';
    id: string;
    name: string;
  }) => {
    setMessageRecipient(recipient);
    setCurrentPage('communications');
  };
  // Render the appropriate page based on currentPage state
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onBillingClick={handleBillingClick}
            onSelectEntity={handleSelectEntity} />);


      case 'analytics':
        return (
          <AnalyticsPage
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onBillingClick={handleBillingClick}
            onSelectEntity={handleSelectEntity} />);


      case 'cohorts':
        return (
          <CohortsPage
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onViewStudents={handleViewCohortStudents}
            onBillingClick={handleBillingClick}
            onSelectEntity={handleSelectEntity}
            initialCohortId={
            selectedEntity?.type === 'cohort' ? selectedEntity.id : null
            } />);


      case 'programs':
        return (
          <ProgramsPage
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onBillingClick={handleBillingClick}
            onSelectEntity={handleSelectEntity} />);


      case 'students':
        return (
          <StudentsPage
            currentPage={currentPage}
            onNavigate={handleNavigate}
            initialCohortId={studentCohortFilter}
            onBillingClick={handleBillingClick}
            onSelectEntity={handleSelectEntity}
            initialStudentId={
            selectedEntity?.type === 'student' ? selectedEntity.id : null
            }
            onComposeMessage={handleComposeMessage} />);


      case 'mentors':
        return (
          <MentorsPage
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onBillingClick={handleBillingClick}
            onSelectEntity={handleSelectEntity}
            initialMentorId={
            selectedEntity?.type === 'mentor' ? selectedEntity.id : null
            }
            onComposeMessage={handleComposeMessage} />);


      case 'communications':
        return (
          <CommunicationsPage
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onBillingClick={handleBillingClick}
            onSelectEntity={handleSelectEntity}
            initialRecipient={messageRecipient} />);


      case 'settings':
        return (
          <SettingsPage
            currentPage={currentPage}
            onNavigate={handleNavigate}
            initialTab={settingsTab}
            onBillingClick={handleBillingClick}
            onSelectEntity={handleSelectEntity} />);


      default:
        return (
          <Dashboard
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onBillingClick={handleBillingClick}
            onSelectEntity={handleSelectEntity} />);


    }
  };
  return <ToastProvider>{renderPage()}</ToastProvider>;
}