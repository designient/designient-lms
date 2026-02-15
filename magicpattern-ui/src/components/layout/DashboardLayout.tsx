import React from 'react';
import { Sidebar, PageName } from './Sidebar';
import { Header } from './Header';
import { useSidebar } from '../../hooks/useSidebar';
interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
  onBillingClick?: () => void;
  onSelectEntity?: (type: 'student' | 'mentor' | 'cohort', id: string) => void;
}
export function DashboardLayout({
  children,
  title,
  subtitle,
  currentPage,
  onNavigate,
  onBillingClick,
  onSelectEntity
}: DashboardLayoutProps) {
  const { isCollapsed, toggle } = useSidebar();
  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        currentPage={currentPage}
        onNavigate={onNavigate}
        isCollapsed={isCollapsed}
        onToggle={toggle}
        onBillingClick={onBillingClick} />

      <div
        className={`transition-all duration-200 ease-in-out ${isCollapsed ? 'pl-16' : 'pl-52'}`}>

        <Header
          title={title}
          subtitle={subtitle}
          onNavigate={onNavigate}
          onSelectEntity={onSelectEntity} />

        <main className="p-6">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>);

}