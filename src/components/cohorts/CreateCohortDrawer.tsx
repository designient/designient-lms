import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { DrawerSection, DrawerDivider } from '../ui/Drawer';
import { Check, AlertCircle, DollarSign, Calendar } from 'lucide-react';

// Types
export interface CohortFormData {
    name: string;
    program: string;
    startDate: string;
    endDate: string;
    status: 'Upcoming' | 'Active';
    description: string;
    mentors: string[];
    capacity: number;
    price: number;
    currency: string;
    enrollmentDeadline: string;
}

interface CohortFormProps {
    initialData?: Partial<CohortFormData>;
    onSubmit: (data: CohortFormData) => void;
    onCancel: () => void;
    mode?: 'create' | 'edit';
}

// Options
const programOptions = [
    { value: 'advanced-ui', label: 'Advanced UI' },
    { value: 'product-design', label: 'Product Design' },
    { value: 'ux-fundamentals', label: 'UX Fundamentals' },
    { value: 'ux-research', label: 'UX Research' },
    { value: 'interaction-design', label: 'Interaction Design' },
    { value: 'career-development', label: 'Career Development' }
];

const statusOptions = [
    { value: 'Upcoming', label: 'Upcoming' },
    { value: 'Active', label: 'Active' }
];

const mentorOptions = [
    {
        value: 'sarah-chen',
        label: 'Sarah Chen',
        role: 'Senior Design Lead'
    },
    {
        value: 'mike-ross',
        label: 'Mike Ross',
        role: 'Product Designer'
    },
    {
        value: 'alex-kim',
        label: 'Alex Kim',
        role: 'UX Strategist'
    },
    {
        value: 'jessica-lee',
        label: 'Jessica Lee',
        role: 'Design Manager'
    },
    {
        value: 'david-park',
        label: 'David Park',
        role: 'UI Designer'
    },
    {
        value: 'emily-white',
        label: 'Emily White',
        role: 'UX Researcher'
    }
];

const defaultFormData: CohortFormData = {
    name: '',
    program: '',
    startDate: '',
    endDate: '',
    status: 'Upcoming',
    description: '',
    mentors: [],
    capacity: 30,
    price: 2500,
    currency: 'USD',
    enrollmentDeadline: ''
};

export function CreateCohortDrawer({
    initialData,
    onSubmit,
    onCancel,
    mode = 'create'
}: CohortFormProps) {
    const [formData, setFormData] = useState<CohortFormData>({
        ...defaultFormData,
        ...initialData
    });

    const [errors, setErrors] = useState<
        Partial<Record<keyof CohortFormData, string>>
    >({});
    const [touched, setTouched] = useState<
        Partial<Record<keyof CohortFormData, boolean>>
    >({});

    // Reset form when initialData changes (for edit mode)
    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultFormData,
                ...initialData
            });
        }
    }, [initialData]);

    const handleChange = (
        field: keyof CohortFormData,
        value: string | string[] | number
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: undefined
            }));
        }
    };

    const handleBlur = (field: keyof CohortFormData) => {
        setTouched((prev) => ({
            ...prev,
            [field]: true
        }));
        validateField(field);
    };

    const validateField = (field: keyof CohortFormData): string | undefined => {
        let error: string | undefined;

        switch (field) {
            case 'name':
                if (!formData.name.trim()) {
                    error = 'Cohort name is required';
                } else if (formData.name.length < 3) {
                    error = 'Name must be at least 3 characters';
                }
                break;
            case 'program':
                if (!formData.program) {
                    error = 'Please select a program';
                }
                break;
            case 'startDate':
                if (!formData.startDate) {
                    error = 'Start date is required';
                }
                break;
            case 'endDate':
                if (!formData.endDate) {
                    error = 'End date is required';
                } else if (
                    formData.startDate &&
                    new Date(formData.endDate) <= new Date(formData.startDate)
                ) {
                    error = 'End date must be after start date';
                }
                break;
            case 'status':
                if (!formData.status) {
                    error = 'Please select a status';
                }
                break;
            case 'capacity':
                if (formData.capacity < 1) {
                    error = 'Capacity must be at least 1';
                }
                break;
            case 'price':
                if (formData.price < 0) {
                    error = 'Price cannot be negative';
                }
                break;
            case 'enrollmentDeadline':
                if (
                    formData.enrollmentDeadline &&
                    formData.startDate &&
                    new Date(formData.enrollmentDeadline) > new Date(formData.startDate)
                ) {
                    error = 'Deadline cannot be after start date';
                }
                break;
        }

        setErrors((prev) => ({
            ...prev,
            [field]: error
        }));

        return error;
    };

    const validate = (): boolean => {
        const fields: (keyof CohortFormData)[] = [
            'name',
            'program',
            'startDate',
            'endDate',
            'status',
            'capacity',
            'price'
        ];

        let isValid = true;
        fields.forEach((field) => {
            const error = validateField(field);
            if (error) isValid = false;
        });

        // Mark all as touched
        setTouched({
            name: true,
            program: true,
            startDate: true,
            endDate: true,
            status: true,
            capacity: true,
            price: true
        });

        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    const toggleMentor = (mentorValue: string) => {
        const isSelected = formData.mentors.includes(mentorValue);
        const newMentors = isSelected
            ? formData.mentors.filter((m) => m !== mentorValue)
            : [...formData.mentors, mentorValue];
        handleChange('mentors', newMentors);
    };

    const descriptionLength = formData.description.length;
    const maxDescriptionLength = 500;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <DrawerSection title="Basic Information">
                <div className="space-y-4">
                    {/* Cohort Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="name" required>
                            Cohort Name
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g., Spring 2024 Design Systems"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            onBlur={() => handleBlur('name')}
                            className={
                                touched.name && errors.name
                                    ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
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

                    {/* Program */}
                    <div className="space-y-1.5">
                        <Label htmlFor="program" required>
                            Program
                        </Label>
                        <Select
                            id="program"
                            placeholder="Select a program"
                            options={programOptions}
                            value={formData.program}
                            onChange={(e) => handleChange('program', e.target.value)}
                            onBlur={() => handleBlur('program')}
                            className={
                                touched.program && errors.program ? 'border-destructive' : ''
                            }
                        />
                        {touched.program && errors.program && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.program}
                            </p>
                        )}
                    </div>

                    {/* Initial Status */}
                    <div className="space-y-1.5">
                        <Label htmlFor="status" required>
                            Initial Status
                        </Label>
                        <Select
                            id="status"
                            options={statusOptions}
                            value={formData.status}
                            onChange={(e) =>
                                handleChange('status', e.target.value as 'Upcoming' | 'Active')
                            }
                            onBlur={() => handleBlur('status')}
                            className={
                                touched.status && errors.status ? 'border-destructive' : ''
                            }
                        />
                        <p className="text-xs text-muted-foreground">
                            Set to "Active" if the cohort is starting immediately.
                        </p>
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Capacity & Pricing */}
            <DrawerSection title="Capacity & Pricing">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="capacity" required>
                            Student Capacity
                        </Label>
                        <Input
                            id="capacity"
                            type="number"
                            min={1}
                            value={formData.capacity}
                            onChange={(e) =>
                                handleChange('capacity', parseInt(e.target.value) || 0)
                            }
                            onBlur={() => handleBlur('capacity')}
                            className={
                                touched.capacity && errors.capacity
                                    ? 'border-destructive focus:border-destructive'
                                    : ''
                            }
                        />
                        {touched.capacity && errors.capacity && (
                            <p className="text-xs text-destructive">{errors.capacity}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="price" required>
                            Tuition Price ({formData.currency})
                        </Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <DollarSign className="h-3.5 w-3.5" />
                            </div>
                            <Input
                                id="price"
                                type="number"
                                min={0}
                                value={formData.price}
                                onChange={(e) =>
                                    handleChange('price', parseInt(e.target.value) || 0)
                                }
                                onBlur={() => handleBlur('price')}
                                className={`pl-9 ${touched.price && errors.price
                                        ? 'border-destructive focus:border-destructive'
                                        : ''
                                    }`}
                            />
                        </div>
                        {touched.price && errors.price && (
                            <p className="text-xs text-destructive">{errors.price}</p>
                        )}
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Timeline */}
            <DrawerSection title="Timeline">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="startDate" required>
                                Start Date
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => handleChange('startDate', e.target.value)}
                                onBlur={() => handleBlur('startDate')}
                                className={
                                    touched.startDate && errors.startDate
                                        ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                                        : ''
                                }
                            />
                            {touched.startDate && errors.startDate && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.startDate}
                                </p>
                            )}
                        </div>

                        {/* End Date */}
                        <div className="space-y-1.5">
                            <Label htmlFor="endDate" required>
                                End Date
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => handleChange('endDate', e.target.value)}
                                onBlur={() => handleBlur('endDate')}
                                className={
                                    touched.endDate && errors.endDate
                                        ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                                        : ''
                                }
                            />
                            {touched.endDate && errors.endDate && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.endDate}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="enrollmentDeadline">Enrollment Deadline</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                            </div>
                            <Input
                                id="enrollmentDeadline"
                                type="date"
                                value={formData.enrollmentDeadline}
                                onChange={(e) =>
                                    handleChange('enrollmentDeadline', e.target.value)
                                }
                                onBlur={() => handleBlur('enrollmentDeadline')}
                                className="pl-9"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Optional. Defaults to start date if not set.
                        </p>
                        {touched.enrollmentDeadline && errors.enrollmentDeadline && (
                            <p className="text-xs text-destructive">
                                {errors.enrollmentDeadline}
                            </p>
                        )}
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            {/* Assign Mentors */}
            <DrawerSection title="Assign Mentors">
                <p className="text-sm text-muted-foreground mb-3">
                    Select mentors to lead this cohort. You can assign multiple mentors.
                </p>
                <div className="space-y-2">
                    {mentorOptions.map((mentor) => {
                        const isSelected = formData.mentors.includes(mentor.value);
                        return (
                            <button
                                key={mentor.value}
                                type="button"
                                onClick={() => toggleMentor(mentor.value)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all border ${isSelected
                                        ? 'bg-primary/5 border-primary/30 text-foreground'
                                        : 'bg-transparent border-border/60 text-muted-foreground hover:bg-muted/40 hover:border-border'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${isSelected
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-muted text-muted-foreground'
                                            }`}
                                    >
                                        {mentor.label.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <p
                                            className={`font-medium ${isSelected ? 'text-foreground' : ''
                                                }`}
                                        >
                                            {mentor.label}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {mentor.role}
                                        </p>
                                    </div>
                                </div>
                                {isSelected && (
                                    <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
                {formData.mentors.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3">
                        {formData.mentors.length} mentor
                        {formData.mentors.length > 1 ? 's' : ''} selected
                    </p>
                )}
            </DrawerSection>

            <DrawerDivider />

            {/* Description */}
            <DrawerSection title="Description">
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="description">Cohort Description</Label>
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
                        placeholder="Describe the focus, goals, and expectations for this cohort..."
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={4}
                        className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                        This description will be visible to students and mentors.
                    </p>
                </div>
            </DrawerSection>
        </form>
    );
}

// Footer component to be used with the Drawer
export function CreateCohortFooter({
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
                        ? 'Save Cohort'
                        : 'Create Cohort'}
            </Button>
        </div>
    );
}

// Backwards compatibility alias
export { CreateCohortDrawer as CohortForm };
