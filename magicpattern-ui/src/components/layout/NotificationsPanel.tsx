import React from 'react';
import { Bell, Check, UserPlus, Flag, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success';
  read: boolean;
}
const mockNotifications: Notification[] = [
{
  id: '1',
  title: 'New Student Enrollment',
  message: 'Sofia Rodriguez joined Spring 2024 Foundations',
  time: '2 hours ago',
  type: 'success',
  read: false
},
{
  id: '2',
  title: 'Student Flagged',
  message: 'James Wilson was flagged by Sarah Chen',
  time: '5 hours ago',
  type: 'warning',
  read: false
},
{
  id: '3',
  title: 'Cohort Starting Soon',
  message: 'Spring 2024 Design Systems starts in 3 days',
  time: '1 day ago',
  type: 'info',
  read: true
}];

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
}
export function NotificationsPanel({ open, onClose }: NotificationsPanelProps) {
  const { toast } = useToast();
  const handleViewAll = () => {
    onClose();
    toast({
      title: 'Notifications',
      description: 'Full notifications history will be available soon.',
      variant: 'info'
    });
  };
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-30"
        onClick={onClose}
        aria-hidden="true" />

      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-border/50 bg-card shadow-xl z-40 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <button className="text-xs text-primary hover:text-primary/80 font-medium">
            Mark all as read
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {mockNotifications.length > 0 ?
          <div className="divide-y divide-border/30">
              {mockNotifications.map((notification) =>
            <div
              key={notification.id}
              className={`p-4 hover:bg-muted/40 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}>

                  <div className="flex gap-3">
                    <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${notification.type === 'success' ? 'bg-green-100 text-green-600' : notification.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>

                      {notification.type === 'success' &&
                  <UserPlus className="h-4 w-4" />
                  }
                      {notification.type === 'warning' &&
                  <Flag className="h-4 w-4" />
                  }
                      {notification.type === 'info' &&
                  <AlertCircle className="h-4 w-4" />
                  }
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 pt-1">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.read &&
                <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                }
                  </div>
                </div>
            )}
            </div> :

          <div className="py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No new notifications</p>
            </div>
          }
        </div>

        <div className="p-2 border-t border-border/50 bg-muted/20">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs h-8"
            onClick={handleViewAll}>

            View all notifications
          </Button>
        </div>
      </div>
    </>);

}