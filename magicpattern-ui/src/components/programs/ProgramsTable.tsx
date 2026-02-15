import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MoreHorizontal, Clock, Users } from 'lucide-react';
import { Program } from '../../types';
interface ProgramsTableProps {
  programs: Program[];
  onProgramClick: (program: Program) => void;
}
export function ProgramsTable({
  programs,
  onProgramClick
}: ProgramsTableProps) {
  const getStatusVariant = (status: Program['status']) => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Draft':
        return 'neutral';
      case 'Archived':
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
                  Program Name
                </th>
                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Duration
                </th>
                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Cohorts
                </th>
                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="h-10 px-5 text-right align-middle w-8"></th>
              </tr>
            </thead>
            <tbody>
              {programs.length === 0 ?
              <tr>
                  <td
                  colSpan={6}
                  className="px-5 py-8 text-center text-[13px] text-muted-foreground">

                    No programs found matching your criteria.
                  </td>
                </tr> :

              programs.map((program, index) =>
              <tr
                key={program.id}
                className={`border-b border-border/40 transition-colors hover:bg-muted/30 cursor-pointer group ${index === programs.length - 1 ? 'border-b-0' : ''}`}
                onClick={() => onProgramClick(program)}>

                    <td className="px-5 py-4 align-middle">
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-foreground">
                          {program.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {program.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <Badge
                    variant={getStatusVariant(program.status)}
                    className="text-[10px] px-2 py-0.5 font-medium">

                        {program.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-[12px]">{program.duration}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-[12px]">
                          {program.cohortCount} Cohorts
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 align-middle text-[12px] text-muted-foreground">
                      {program.createdAt}
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