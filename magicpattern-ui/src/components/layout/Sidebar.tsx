import React, { useState } from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  UserCheck,
  Settings,
  Layers,
  BookOpen,
  BarChart3,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  ArrowLeftRight,
  MoreVertical } from
'lucide-react';
import { useToast } from '../ui/Toast';
export type PageName =
'dashboard' |
'analytics' |
'cohorts' |
'programs' |
'students' |
'mentors' |
'communications' |
'settings';
interface SidebarProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
  isCollapsed: boolean;
  onToggle: () => void;
  onBillingClick?: () => void;
}
// Tooltip component for collapsed state
function Tooltip({
  children,
  label,
  show




}: {children: React.ReactNode;label: string;show: boolean;}) {
  const [isHovered, setIsHovered] = useState(false);
  if (!show) return <>{children}</>;
  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}>

      {children}
      {isHovered &&
      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 px-2 py-1 text-xs font-medium bg-foreground text-background rounded-md whitespace-nowrap shadow-lg border border-border">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-border" />
        </div>
      }
    </div>);

}
export function Sidebar({
  currentPage,
  onNavigate,
  isCollapsed,
  onToggle,
  onBillingClick
}: SidebarProps) {
  const { toast } = useToast();
  const handleComingSoon = (feature: string) => {
    toast({
      title: 'Coming Soon',
      description: `${feature} functionality is currently under development.`,
      variant: 'info'
    });
  };
  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r border-border/50 bg-card transition-all duration-200 ease-in-out flex flex-col ${isCollapsed ? 'w-16' : 'w-64'}`}>

      {/* Logo */}
      <div
        className={`flex h-14 items-center border-b border-border/50 ${isCollapsed ? 'justify-center px-2' : 'px-4'}`}>

        {isCollapsed ?
        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">D</span>
          </div> :

        <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">D</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Designient</span>
          </div>
        }
      </div>

      {/* Navigation Content */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* MAIN Section */}
        <div>
          {!isCollapsed &&
          <h3 className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Main
            </h3>
          }
          <nav className="space-y-0.5">
            {[
            {
              icon: LayoutDashboard,
              label: 'Dashboard',
              page: 'dashboard'
            },
            {
              icon: BarChart3,
              label: 'Analytics',
              page: 'analytics'
            },
            {
              icon: MessageSquare,
              label: 'Communications',
              page: 'communications'
            }].
            map((item) => {
              const isActive = currentPage === item.page;
              return (
                <Tooltip key={item.label} label={item.label} show={isCollapsed}>
                  <button
                    onClick={() => onNavigate(item.page as PageName)}
                    className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}>

                    <item.icon
                      className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`} />

                    {!isCollapsed &&
                    <span className="text-sm font-medium">{item.label}</span>
                    }
                  </button>
                </Tooltip>);

            })}
          </nav>
        </div>

        {/* YOUR ACADEMY Section */}
        <div>
          {!isCollapsed &&
          <h3 className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 mt-6">
              Your Academy
            </h3>
          }
          <nav className="space-y-0.5">
            {[
            {
              icon: Layers,
              label: 'Cohorts',
              page: 'cohorts'
            },
            {
              icon: BookOpen,
              label: 'Programs',
              page: 'programs'
            },
            {
              icon: GraduationCap,
              label: 'Students',
              page: 'students'
            },
            {
              icon: UserCheck,
              label: 'Mentors',
              page: 'mentors'
            }].
            map((item) => {
              const isActive = currentPage === item.page;
              return (
                <Tooltip key={item.label} label={item.label} show={isCollapsed}>
                  <button
                    onClick={() => onNavigate(item.page as PageName)}
                    className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}>

                    <item.icon
                      className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-primary' : 'group-hover:text-foreground'}`} />

                    {!isCollapsed &&
                    <span className="text-sm font-medium">{item.label}</span>
                    }
                  </button>
                </Tooltip>);

            })}

            {/* Academy Actions */}
            <div className="pt-2 mt-2 border-t border-border/40 space-y-0.5">
              <Tooltip label="Preview Academy" show={isCollapsed}>
                <button
                  onClick={() => handleComingSoon('Academy Preview')}
                  className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} text-muted-foreground hover:bg-muted/60 hover:text-foreground`}>

                  <Eye className="h-4.5 w-4.5 flex-shrink-0 group-hover:text-foreground" />
                  {!isCollapsed &&
                  <span className="text-sm font-medium">Preview</span>
                  }
                </button>
              </Tooltip>
              <Tooltip label="Switch Academy" show={isCollapsed}>
                <button
                  onClick={() => handleComingSoon('Switch Academy')}
                  className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} text-muted-foreground hover:bg-muted/60 hover:text-foreground`}>

                  <ArrowLeftRight className="h-4.5 w-4.5 flex-shrink-0 group-hover:text-foreground" />
                  {!isCollapsed &&
                  <span className="text-sm font-medium">Switch</span>
                  }
                </button>
              </Tooltip>
              <Tooltip label="Settings" show={isCollapsed}>
                <button
                  onClick={() => onNavigate('settings')}
                  className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} ${currentPage === 'settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'}`}>

                  <Settings className="h-4.5 w-4.5 flex-shrink-0" />
                  {!isCollapsed &&
                  <span className="text-sm font-medium">Settings</span>
                  }
                </button>
              </Tooltip>
              <Tooltip label="Billing" show={isCollapsed}>
                <button
                  onClick={onBillingClick}
                  className={`w-full flex items-center rounded-md transition-all duration-150 group ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2'} text-muted-foreground hover:bg-muted/60 hover:text-foreground`}>

                  <CreditCard className="h-4.5 w-4.5 flex-shrink-0 group-hover:text-foreground" />
                  {!isCollapsed &&
                  <span className="text-sm font-medium">Billing</span>
                  }
                </button>
              </Tooltip>
            </div>
          </nav>
        </div>
      </div>

      {/* Footer / User Profile */}
      <div className="p-3 border-t border-border/50 bg-card">
        <div
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-2'}`}>

          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm">
            SA
          </div>
          {!isCollapsed &&
          <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                Super Admin
              </p>
              <p className="text-xs text-muted-foreground truncate">
                admin@designient.com
              </p>
            </div>
          }
          {!isCollapsed &&
          <button className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          }
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className={`mt-3 w-full flex items-center rounded-md p-2 text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all duration-150 ${isCollapsed ? 'justify-center' : 'justify-center'}`}
          title={isCollapsed ? 'Expand (⌘B)' : 'Collapse (⌘B)'}>

          {isCollapsed ?
          <ChevronRight className="h-4 w-4" /> :

          <div className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              <span className="text-xs font-medium">Collapse Sidebar</span>
            </div>
          }
        </button>
      </div>
    </aside>);

}