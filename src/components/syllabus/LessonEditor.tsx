'use client';

import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import type { SyllabusLesson } from '@/types/syllabus';

interface LessonEditorProps {
    lesson: SyllabusLesson;
    disabled: boolean;
    onChange: (nextLesson: SyllabusLesson) => void;
}

function getContentLabel(type: SyllabusLesson['contentType']) {
    if (type === 'TEXT') return 'Lesson Content';
    if (type === 'VIDEO') return 'Video URL';
    return 'File URL';
}

export function LessonEditor({ lesson, disabled, onChange }: LessonEditorProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Lesson title</label>
                <Input
                    value={lesson.title}
                    onChange={(event) => onChange({ ...lesson, title: event.target.value })}
                    disabled={disabled}
                    placeholder="e.g. Foundations of Prompting"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Content type</label>
                <Select
                    value={lesson.contentType}
                    onChange={(event) =>
                        onChange({
                            ...lesson,
                            contentType: event.target.value as SyllabusLesson['contentType'],
                        })
                    }
                    disabled={disabled}
                    options={[
                        { value: 'TEXT', label: 'Text lesson' },
                        { value: 'VIDEO', label: 'Video lesson' },
                        { value: 'FILE', label: 'File resource' },
                    ]}
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{getContentLabel(lesson.contentType)}</label>
                <Textarea
                    value={lesson.contentBody || ''}
                    onChange={(event) =>
                        onChange({
                            ...lesson,
                            contentBody: event.target.value,
                        })
                    }
                    disabled={disabled}
                    rows={lesson.contentType === 'TEXT' ? 10 : 4}
                    placeholder={
                        lesson.contentType === 'TEXT'
                            ? 'Write lesson notes, instructions, or HTML content'
                            : 'https://'
                    }
                />
            </div>
        </div>
    );
}
