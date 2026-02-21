import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { MoreHorizontal, Clock, Users, Pencil, Trash2, Archive, RotateCcw } from 'lucide-react';
import { Program } from '../../types';

interface ProgramsTableProps {
    programs: Program[];
    onProgramClick: (program: Program) => void;
    onEditProgram: (program: Program) => void;
    onArchiveProgram: (program: Program) => void;
    onMoveProgramToDraft: (program: Program) => void;
    onDeleteProgram: (program: Program) => void;
}

export function ProgramsTable({
    programs,
    onProgramClick,
    onEditProgram,
    onArchiveProgram,
    onMoveProgramToDraft,
    onDeleteProgram,
}: ProgramsTableProps) {
    const [openMenuProgramId, setOpenMenuProgramId] = useState<string | null>(null);

    useEffect(() => {
        if (!openMenuProgramId) return;

        const handleDocumentClick = () => setOpenMenuProgramId(null);
        document.addEventListener('click', handleDocumentClick);
        return () => document.removeEventListener('click', handleDocumentClick);
    }, [openMenuProgramId]);

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
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[140px]">
                                    Duration
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[140px]">
                                    Cohorts
                                </th>
                                <th className="h-10 px-5 text-left align-middle text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-[160px]">
                                    Created
                                </th>
                                <th className="h-10 px-5 text-right align-middle w-8"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {programs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-5 py-8 text-center text-[13px] text-muted-foreground"
                                    >
                                        No programs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                programs.map((program, index) => (
                                    <tr
                                        key={program.id}
                                        className={`border-b border-border/40 transition-colors hover:bg-muted/30 cursor-pointer group ${index === programs.length - 1 ? 'border-b-0' : ''
                                            }`}
                                        onClick={() => onProgramClick(program)}
                                    >
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
                                                className="text-[10px] px-2 py-0.5 font-medium"
                                            >
                                                {program.status}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-4 align-middle whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                                                <Clock className="h-3.5 w-3.5" />
                                                <span className="text-[12px]">{program.duration}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-middle whitespace-nowrap">
                                            <div className="inline-flex items-center gap-1.5 text-muted-foreground whitespace-nowrap">
                                                <Users className="h-3.5 w-3.5" />
                                                <span className="text-[12px]">
                                                    {program.cohortCount} Cohorts
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 align-middle text-[12px] text-muted-foreground whitespace-nowrap">
                                            {program.createdAt}
                                        </td>
                                        <td className="px-5 py-4 align-middle text-right relative">
                                            <button
                                                className={`p-1 hover:bg-muted rounded transition-colors ${openMenuProgramId === program.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuProgramId((prev) =>
                                                        prev === program.id ? null : program.id
                                                    );
                                                }}
                                            >
                                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                                            </button>
                                            {openMenuProgramId === program.id && (
                                                <div
                                                    className="absolute right-5 top-11 z-30 w-36 rounded-md border border-border/60 bg-card shadow-lg p-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-left rounded hover:bg-muted/50"
                                                        onClick={() => {
                                                            setOpenMenuProgramId(null);
                                                            onEditProgram(program);
                                                        }}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-left rounded hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={() => {
                                                            setOpenMenuProgramId(null);
                                                            onArchiveProgram(program);
                                                        }}
                                                        disabled={program.status === 'Archived'}
                                                    >
                                                        <Archive className="h-3.5 w-3.5" />
                                                        Archive
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-left rounded hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        onClick={() => {
                                                            setOpenMenuProgramId(null);
                                                            onMoveProgramToDraft(program);
                                                        }}
                                                        disabled={program.status === 'Draft'}
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        Move to Draft
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-left rounded text-destructive hover:bg-destructive/5"
                                                        onClick={() => {
                                                            setOpenMenuProgramId(null);
                                                            onDeleteProgram(program);
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
