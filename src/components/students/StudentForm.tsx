'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { DrawerSection, DrawerDivider } from '@/components/ui/Drawer';
import { AlertCircle, Mail, MessageCircle } from 'lucide-react';

// Types
export interface StudentFormData {
    name: string;
    email: string;
    phone: string;
    alternatePhone: string;
    whatsappOptIn: boolean;
    cohortId: string;
    mentorId: string;
    paymentStatus: 'Paid' | 'Pending';
    sendInvite: boolean;
}

interface SelectOption {
    value: string;
    label: string;
}

interface StudentFormProps {
    initialData?: Partial<StudentFormData>;
    onSubmit: (data: StudentFormData) => void;
    onCancel: () => void;
    mode?: 'create' | 'edit';
    cohortOptions?: SelectOption[];
    mentorOptions?: SelectOption[];
}

const paymentOptions = [
    {
        value: 'Pending',
        label: 'Pending',
    },
    {
        value: 'Paid',
        label: 'Paid',
    },
];

const defaultFormData: StudentFormData = {
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    whatsappOptIn: true,
    cohortId: '',
    mentorId: '',
    paymentStatus: 'Pending',
    sendInvite: true,
};

export function StudentForm({
    initialData,
    onSubmit,
    onCancel,
    mode = 'create',
    cohortOptions = [],
    mentorOptions = [],
}: StudentFormProps) {
    const [formData, setFormData] = useState<StudentFormData>({
        ...defaultFormData,
        ...initialData,
    });

    const [errors, setErrors] = useState<
        Partial<Record<keyof StudentFormData, string>>
    >({});
    const [touched, setTouched] = useState<
        Partial<Record<keyof StudentFormData, boolean>>
    >({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultFormData,
                ...initialData,
            });
        }
    }, [initialData]);

    const handleChange = (
        field: keyof StudentFormData,
        value: string | boolean
    ) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({
                ...prev,
                [field]: undefined,
            }));
        }
    };

    const handleBlur = (field: keyof StudentFormData) => {
        setTouched((prev) => ({
            ...prev,
            [field]: true,
        }));
        validateField(field);
    };

    const validateField = (field: keyof StudentFormData): string | undefined => {
        let error: string | undefined;

        switch (field) {
            case 'name':
                if (!formData.name.trim()) {
                    error = 'Full name is required';
                } else if (formData.name.length < 2) {
                    error = 'Name must be at least 2 characters';
                }
                break;
            case 'email':
                if (!formData.email.trim()) {
                    error = 'Email is required';
                } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    error = 'Please enter a valid email address';
                }
                break;
            case 'cohortId':
                if (!formData.cohortId) {
                    error = 'Please select a cohort';
                }
                break;
        }

        setErrors((prev) => ({
            ...prev,
            [field]: error,
        }));

        return error;
    };

    const validate = (): boolean => {
        const fields: (keyof StudentFormData)[] = ['name', 'email', 'cohortId'];
        let isValid = true;

        fields.forEach((field) => {
            const error = validateField(field);
            if (error) isValid = false;
        });

        setTouched({
            name: true,
            email: true,
            cohortId: true,
        });

        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            onSubmit(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <DrawerSection title="Student Information">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" required>
                            Full Name
                        </Label>
                        <Input
                            id="name"
                            placeholder="e.g., Priya Sharma"
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

                    <div className="space-y-1.5">
                        <Label htmlFor="email" required>
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="e.g., priya.sharma@example.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            onBlur={() => handleBlur('email')}
                            className={
                                touched.email && errors.email
                                    ? 'border-destructive focus:border-destructive focus:ring-destructive/20'
                                    : ''
                            }
                        />
                        {touched.email && errors.email && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.email}
                            </p>
                        )}
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            <DrawerSection title="Contact Details">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="phone">Phone Number (Optional)</Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium border-r border-border/60 pr-2">
                                +91
                            </div>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="98765 43210"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="pl-12"
                            />
                        </div>
                    </div>

                    {formData.phone && (
                        <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                            <input
                                type="checkbox"
                                id="whatsappOptIn"
                                className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                                checked={formData.whatsappOptIn}
                                onChange={(e) =>
                                    handleChange('whatsappOptIn', e.target.checked)
                                }
                            />
                            <div>
                                <label
                                    htmlFor="whatsappOptIn"
                                    className="text-sm font-medium text-foreground flex items-center gap-2"
                                >
                                    Enable WhatsApp notifications
                                    <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                                </label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Student will receive updates via WhatsApp on this number.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label htmlFor="alternatePhone">
                            Alternate Contact (Parent/Guardian)
                        </Label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium border-r border-border/60 pr-2">
                                +91
                            </div>
                            <Input
                                id="alternatePhone"
                                type="tel"
                                placeholder="87654 32109"
                                value={formData.alternatePhone}
                                onChange={(e) => handleChange('alternatePhone', e.target.value)}
                                className="pl-12"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">
                            For emergency contact and payment reminders.
                        </p>
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            <DrawerSection title="Enrollment Details">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="cohortId" required>
                            Assign to Cohort
                        </Label>
                        <Select
                            placeholder="Select a cohort"
                            options={cohortOptions}
                            value={formData.cohortId}
                            onChange={(e) => handleChange('cohortId', e.target.value)}
                            className={
                                touched.cohortId && errors.cohortId ? 'border-destructive' : ''
                            }
                        />
                        {touched.cohortId && errors.cohortId && (
                            <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.cohortId}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="mentorId">Assign Mentor (Optional)</Label>
                        <Select
                            placeholder="Select a mentor"
                            options={mentorOptions}
                            value={formData.mentorId}
                            onChange={(e) => handleChange('mentorId', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            You can assign a mentor later if needed.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="paymentStatus">Initial Payment Status</Label>
                        <Select
                            options={paymentOptions}
                            value={formData.paymentStatus}
                            onChange={(e) =>
                                handleChange(
                                    'paymentStatus',
                                    e.target.value as 'Paid' | 'Pending'
                                )
                            }
                        />
                    </div>
                </div>
            </DrawerSection>

            <DrawerDivider />

            <DrawerSection title="Invitation">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                    <input
                        type="checkbox"
                        id="sendInvite"
                        className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={formData.sendInvite}
                        onChange={(e) => handleChange('sendInvite', e.target.checked)}
                    />
                    <div>
                        <label
                            htmlFor="sendInvite"
                            className="text-sm font-medium text-foreground flex items-center gap-2"
                        >
                            Send Invitation Email
                            <Mail className="h-3 w-3 text-muted-foreground" />
                        </label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            The student will receive an email with login instructions and a
                            link to set up their account.
                        </p>
                    </div>
                </div>
            </DrawerSection>
        </form>
    );
}

export function StudentFormFooter({
    onSubmit,
    onCancel,
    isSubmitting = false,
    mode = 'create',
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
                        : 'Sending Invite...'
                    : mode === 'edit'
                        ? 'Save Changes'
                        : 'Add Student'}
            </Button>
        </div>
    );
}
