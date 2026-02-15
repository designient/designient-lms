import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MoreHorizontal } from 'lucide-react';
import { Student } from '../../types';
interface StudentsTableProps {
  students: Student[];
  onStudentClick: (student: Student) => void;
}
export function StudentsTable({
  students,
  onStudentClick
}: StudentsTableProps) {
  const getStatusVariant = (status: Student['status']) => {
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
    <Card className="overflow-hidden bg-white dark:bg-card border-border/50 shadow-sm">
      <CardContent className="p-0">
        <div className="relative w-full overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-slate-50/50 dark:bg-slate-900/20">
                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Student
                </th>
                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Cohort
                </th>
                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Progress
                </th>
                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Payment
                </th>
                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="h-10 px-5 text-right align-middle w-8"></th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ?
              <tr>
                  <td
                  colSpan={7}
                  className="px-5 py-8 text-center text-[13px] text-muted-foreground">

                    No students found matching your criteria.
                  </td>
                </tr> :

              students.map((student, index) =>
              <tr
                key={student.id}
                className={`border-b border-border/40 transition-colors hover:bg-muted/30 cursor-pointer group ${index === students.length - 1 ? 'border-b-0' : ''}`}
                onClick={() => onStudentClick(student)}>

                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          {student.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-foreground">
                            {student.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground leading-none mt-0.5">
                            {student.email}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle text-muted-foreground text-[12px]">
                      {student.cohortName}
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <Badge
                    variant={getStatusVariant(student.status)}
                    className="text-[10px] px-2 py-0.5 font-medium">

                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-2 w-24">
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${student.progress}%`
                        }} />

                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">
                          {student.progress}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <Badge
                    variant={getPaymentVariant(student.paymentStatus)}
                    className="text-[10px] px-2 py-0.5 font-medium">

                        {student.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 align-middle text-muted-foreground text-[12px]">
                      {student.lastActivity}
                    </td>
                    <td className="px-5 py-4 align-middle text-right">
                      <button
                    className="p-1 hover:bg-muted rounded transition-colors opacity-0 group-hover:opacity-100"
                    onClick={(e) => e.stopPropagation()}>

                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </td>
                  </tr>
              )
              }
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>);

}