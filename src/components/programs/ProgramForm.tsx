import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { DrawerSection, DrawerDivider } from '../ui/Drawer';
import { AlertCircle } from 'lucide-react';

export interface ProgramFormData {
    name: string;
    description: string;
    duration: string;
    status: 'Active' | 'Draft';
}

interface ProgramFormProps {
    initialData?: Partial<ProgramFormData>;
    onSubmit: (data: ProgramFormData) => void;
    onCancel: () => void;
    mode?: 'create' | 'edit';
}

const durationOptions = [
    { value: '4 weeks', label: '4 Weeks' },
    { value: '8 weeks', label: '8 Weeks' },
    { value: '10 weeks', label: '10 Weeks' },
    { value: '12 weeks', label: '12 Weeks' },
    { value: '16 weeks', label: '16 Weeks' },
    { value: '24 weeks', label: '24 Weeks' }
];

const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Draft', label: 'Draft' }
];

const defaultFormData: ProgramFormData = {
    name: '',
    description: '',
    duration: '12 weeks',
    status: 'Draft'
};

export function ProgramForm({
    initialData,
    onSubmit,
    onCancel,
    mode = 'create'
}: ProgramFormProps) {
    const [formData, setFormData] = useState<ProgramFormData>({
        ...defaultFormData,
        ...initialData
    });

    const [errors, setErrors] = useState<
        Partial<Record<keyof ProgramFormData, string>>
    >({});
    const [touched, setTouched] = useState<
        Partial<Record<keyof ProgramFormData, boolean>>
    >({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultFormData,
                ...initialData
            });
        }
    }, [initialData]);

    const handleChange = (field: keyof ProgramFormData, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleBlur = (field: keyof ProgramFormData) => {
        setTouched((prev) => ({
            ...prev,
            [field]: true
        }));
        validateField(field);
    };

    const validateField = (field: keyof ProgramFormData): string | undefined => {
        let error: string | undefined;

        switch (field) {
            case 'name':
                if (!formData.name.trim()) error = 'Program name is required';
                else if (formData.name.length < 3)
                    error = 'Name must be at least 3 characters';
                break;
            case 'duration':
                if (!formData.duration) error = 'Please select a duration';
                break;
            case 'status':
                if (!formData.status) error = 'Please select a status';
                break;
        }

        setErrors((prev) => ({
            ...prev,
            [field]: error
        }));

        return error;
    };

    const validate = (): boolean => {
        const fields: (keyof ProgramFormData)[] = ['name', 'duration', 'status'];
        let isValid = true;
        fields.forEach((field) => {
            const error = validateField(field);
            if (error) isValid = false;
        });

        setTouched({
            name: true,
            duration: true,
            status: true
        });

        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    const descriptionLength = formData.description.length;
    const maxDescriptionLength = 500;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <DrawerSection title="Program Details">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" required>
                            Program Name
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g., Advanced UI Design"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            className={
                                touched.name && errors.name
                                    ? 'border-destructive focus:border-destructive'
                                    : ''
                            }
                        />
                        {touched.name && errors.name && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.name}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="duration" required>
                            Duration
                        </Label>
                        <Select
                            id="duration"
                            options={durationOptions}
                            value={formData.duration}
                            onChange={(e) => handleChange('duration', e.target.value)}
                            onBlur={() => handleBlur('duration')}
                            className={
                                touched.duration && errors.duration ? 'border-destructive' : ''
                            }
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="status" required>
                            Status
                        </Label>
                        <Select
                            id="status"
                            options={statusOptions}
                            value={formData.status}
                            onChange={(e) =>
                                handleChange('status', e.target.value as 'Active' | 'Draft')
                            }
                            onBlur={() => handleBlur('status')}
                            className={
                                touched.status && errors.status ? 'border-destructive' : ''
                            }
                        />
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            <DrawerSection title="Description">
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="description">Program Description</Label>
                        <span
                            className={`text-xs ${descriptionLength > maxDescriptionLength
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                                }`}
                        >
                            {descriptionLength}/{maxDescriptionLength}
                        </span>
                    </div>
                    <Textarea
                        id="description"
                        placeholder="Describe the curriculum and goals..."
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={5}
                        className="resize-none"
                    />
                </div>
            </DrawerSection>
        </form>
    );
}

export function ProgramFormFooter({
    onSubmit,
    onCancel,
    isSubmitting = false,
    mode = 'create'
}: {
    onSubmit: () => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    mode?: 'create' | 'edit';
}) {
    return (
        <div className="flex gap-3">
            <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
            >
                Cancel
            </Button>
            <Button
                type="submit"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="flex-1"
            >
                {isSubmitting
                    ? mode === 'edit'
                        ? 'Saving...'
                        : 'Creating...'
                    : mode === 'edit'
                        ? 'Save Program'
                        : 'Create Program'}
            </Button>
        </div>
    );
}
