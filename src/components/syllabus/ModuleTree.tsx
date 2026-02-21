'use client';

import { useState } from 'react';
import { GripVertical, Plus, Trash2, BookOpen, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { SyllabusModule } from '@/types/syllabus';

export interface SyllabusSelection {
    moduleIndex: number;
    lessonIndex: number | null;
}

interface ModuleTreeProps {
    modules: SyllabusModule[];
    selection: SyllabusSelection | null;
    readOnly: boolean;
    onSelectModule: (moduleIndex: number) => void;
    onSelectLesson: (moduleIndex: number, lessonIndex: number) => void;
    onAddModule: () => void;
    onAddLesson: (moduleIndex: number) => void;
    onDeleteModule: (moduleIndex: number) => void;
    onDeleteLesson: (moduleIndex: number, lessonIndex: number) => void;
    onReorderModules: (fromIndex: number, toIndex: number) => void;
    onMoveLesson: (
        fromModuleIndex: number,
        fromLessonIndex: number,
        toModuleIndex: number,
        toLessonIndex: number
    ) => void;
}

type DragItem =
    | { type: 'module'; moduleIndex: number }
    | { type: 'lesson'; moduleIndex: number; lessonIndex: number }
    | null;

export function ModuleTree({
    modules,
    selection,
    readOnly,
    onSelectModule,
    onSelectLesson,
    onAddModule,
    onAddLesson,
    onDeleteModule,
    onDeleteLesson,
    onReorderModules,
    onMoveLesson,
}: ModuleTreeProps) {
    const [dragItem, setDragItem] = useState<DragItem>(null);

    const handleDropOnModule = (targetModuleIndex: number) => {
        if (!dragItem || readOnly) return;

        if (dragItem.type === 'module') {
            if (dragItem.moduleIndex !== targetModuleIndex) {
                onReorderModules(dragItem.moduleIndex, targetModuleIndex);
            }
            return;
        }

        const targetLessonIndex = modules[targetModuleIndex]?.lessons.length ?? 0;
        onMoveLesson(
            dragItem.moduleIndex,
            dragItem.lessonIndex,
            targetModuleIndex,
            targetLessonIndex
        );
    };

    const handleDropOnLesson = (targetModuleIndex: number, targetLessonIndex: number) => {
        if (!dragItem || readOnly) return;

        if (dragItem.type === 'module') {
            onReorderModules(dragItem.moduleIndex, targetModuleIndex);
            return;
        }

        onMoveLesson(
            dragItem.moduleIndex,
            dragItem.lessonIndex,
            targetModuleIndex,
            targetLessonIndex
        );
    };

    return (
        <div className="h-full overflow-y-auto px-3 py-3 space-y-3">
            <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Modules</h2>
                <Button size="sm" onClick={onAddModule} disabled={readOnly}>
                    <Plus className="h-3.5 w-3.5" />
                    Add
                </Button>
            </div>

            {modules.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                    No modules yet. Add your first module.
                </div>
            ) : (
                modules.map((moduleItem, moduleIndex) => {
                    const moduleSelected =
                        selection?.moduleIndex === moduleIndex && selection.lessonIndex === null;

                    return (
                        <div
                            key={`${moduleItem.id || moduleIndex}-module`}
                            draggable={!readOnly}
                            onDragStart={() => setDragItem({ type: 'module', moduleIndex })}
                            onDragEnd={() => setDragItem(null)}
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                                event.preventDefault();
                                handleDropOnModule(moduleIndex);
                                setDragItem(null);
                            }}
                            className={`rounded-lg border transition-colors ${
                                moduleSelected
                                    ? 'border-primary/40 bg-primary/5'
                                    : 'border-border/50 bg-card'
                            }`}
                        >
                            <div className="flex items-center gap-1 p-2">
                                <button
                                    type="button"
                                    onClick={() => onSelectModule(moduleIndex)}
                                    className="flex flex-1 min-w-0 items-center gap-2 text-left"
                                >
                                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                    <BookOpen className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-sm font-medium text-foreground truncate flex-1 min-w-0">
                                        {moduleItem.title || `Module ${moduleIndex + 1}`}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                        {moduleItem.lessons.length}
                                    </span>
                                </button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => onAddLesson(moduleIndex)}
                                    disabled={readOnly}
                                    className="h-7 w-7 shrink-0"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => onDeleteModule(moduleIndex)}
                                    disabled={readOnly}
                                    className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            <div className="px-2 pb-2 space-y-1">
                                {moduleItem.lessons.map((lesson, lessonIndex) => {
                                    const lessonSelected =
                                        selection?.moduleIndex === moduleIndex &&
                                        selection.lessonIndex === lessonIndex;

                                    return (
                                        <div
                                            key={`${lesson.id || lessonIndex}-lesson`}
                                            draggable={!readOnly}
                                            onDragStart={() =>
                                                setDragItem({
                                                    type: 'lesson',
                                                    moduleIndex,
                                                    lessonIndex,
                                                })
                                            }
                                            onDragEnd={() => setDragItem(null)}
                                            onDragOver={(event) => event.preventDefault()}
                                            onDrop={(event) => {
                                                event.preventDefault();
                                                handleDropOnLesson(moduleIndex, lessonIndex);
                                                setDragItem(null);
                                            }}
                                            className={`group flex items-center gap-1 rounded-md border px-2 py-1.5 ${
                                                lessonSelected
                                                    ? 'border-primary/40 bg-primary/5'
                                                    : 'border-border/40 bg-background'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => onSelectLesson(moduleIndex, lessonIndex)}
                                                className="flex flex-1 items-center gap-2 text-left"
                                            >
                                                <GripVertical className="h-3 w-3 text-muted-foreground" />
                                                <FileText className="h-3 w-3 text-muted-foreground" />
                                                <span className="text-xs text-foreground truncate">
                                                    {lesson.title || `Lesson ${lessonIndex + 1}`}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                                onClick={() => onDeleteLesson(moduleIndex, lessonIndex)}
                                                disabled={readOnly}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
