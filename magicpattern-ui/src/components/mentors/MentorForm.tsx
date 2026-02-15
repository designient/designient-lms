import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { DrawerSection, DrawerDivider } from '../ui/Drawer';
import { AlertCircle, MessageCircle } from 'lucide-react';
// Types
export interface MentorFormData {
  name: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  specialty: string;
  status: 'Active' | 'Inactive';
  maxCohorts: number;
  bio: string;
}
interface MentorFormProps {
  initialData?: Partial<MentorFormData>;
  onSubmit: (data: MentorFormData) => void;
  onCancel: () => void;
  mode?: 'create' | 'edit';
}
// Options
const specialtyOptions = [
{
  value: 'design-systems',
  label: 'Design Systems'
},
{
  value: 'product-design',
  label: 'Product Design'
},
{
  value: 'ux-strategy',
  label: 'UX Strategy'
},
{
  value: 'ui-design',
  label: 'UI Design'
},
{
  value: 'ux-research',
  label: 'UX Research'
},
{
  value: 'interaction-design',
  label: 'Interaction Design'
},
{
  value: 'career-development',
  label: 'Career Development'
}];

const statusOptions = [
{
  value: 'Active',
  label: 'Active'
},
{
  value: 'Inactive',
  label: 'Inactive'
}];

const defaultFormData: MentorFormData = {
  name: '',
  email: '',
  phone: '',
  whatsappOptIn: true,
  specialty: '',
  status: 'Active',
  maxCohorts: 3,
  bio: ''
};
export function MentorForm({
  initialData,
  onSubmit,
  onCancel,
  mode = 'create'
}: MentorFormProps) {
  const [formData, setFormData] = useState<MentorFormData>({
    ...defaultFormData,
    ...initialData
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof MentorFormData, string>>>(
    {});
  const [touched, setTouched] = useState<
    Partial<Record<keyof MentorFormData, boolean>>>(
    {});
  // Reset form when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultFormData,
        ...initialData
      });
      setErrors({});
      setTouched({});
    }
  }, [initialData]);
  const handleChange = (
  field: keyof MentorFormData,
  value: string | number | boolean) =>
  {
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
  const handleBlur = (field: keyof MentorFormData) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true
    }));
    validateField(field);
  };
  const validateField = (field: keyof MentorFormData): string | undefined => {
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
      case 'specialty':
        if (!formData.specialty) {
          error = 'Please select a specialty';
        }
        break;
      case 'status':
        if (!formData.status) {
          error = 'Please select a status';
        }
        break;
      case 'maxCohorts':
        if (formData.maxCohorts < 1) {
          error = 'Minimum capacity is 1';
        } else if (formData.maxCohorts > 10) {
          error = 'Maximum capacity is 10';
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
    const fields: (keyof MentorFormData)[] = [
    'name',
    'email',
    'specialty',
    'status',
    'maxCohorts'];

    let isValid = true;
    fields.forEach((field) => {
      const error = validateField(field);
      if (error) isValid = false;
    });
    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      specialty: true,
      status: true,
      maxCohorts: true
    });
    return isValid;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };
  const bioLength = formData.bio.length;
  const maxBioLength = 300;
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <DrawerSection title="Basic Information">
        <div className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name" required>
              Full Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Rahul Verma"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              className={
              touched.name && errors.name ?
              'border-destructive focus:border-destructive focus:ring-destructive/20' :
              ''
              } />

            {touched.name && errors.name &&
            <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.name}
              </p>
            }
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" required>
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="e.g., rahul.verma@designient.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              className={
              touched.email && errors.email ?
              'border-destructive focus:border-destructive focus:ring-destructive/20' :
              ''
              } />

            {touched.email && errors.email &&
            <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            }
          </div>

          {/* Phone Number Field */}
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
                className="pl-12" />

            </div>
          </div>

          {formData.phone &&
          <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
              <input
              type="checkbox"
              id="whatsappOptIn"
              className="mt-1 rounded border-gray-300 text-primary focus:ring-primary"
              checked={formData.whatsappOptIn}
              onChange={(e) =>
              handleChange('whatsappOptIn', e.target.checked)
              } />

              <div>
                <label
                htmlFor="whatsappOptIn"
                className="text-sm font-medium text-foreground block flex items-center gap-2">

                  Enable WhatsApp notifications
                  <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mentor will receive session reminders and updates via
                  WhatsApp.
                </p>
              </div>
            </div>
          }

          {/* Specialty */}
          <div className="space-y-1.5">
            <Label htmlFor="specialty" required>
              Specialty
            </Label>
            <Select
              id="specialty"
              placeholder="Select a specialty"
              options={specialtyOptions}
              value={formData.specialty}
              onChange={(e) => handleChange('specialty', e.target.value)}
              onBlur={() => handleBlur('specialty')}
              className={
              touched.specialty && errors.specialty ?
              'border-destructive' :
              ''
              } />

            {touched.specialty && errors.specialty &&
            <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.specialty}
              </p>
            }
          </div>
        </div>
      </DrawerSection>

      <DrawerDivider />

      {/* Status & Capacity */}
      <DrawerSection title="Status & Capacity">
        <div className="space-y-4">
          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status" required>
              Status
            </Label>
            <Select
              id="status"
              options={statusOptions}
              value={formData.status}
              onChange={(e) =>
              handleChange('status', e.target.value as 'Active' | 'Inactive')
              }
              onBlur={() => handleBlur('status')}
              className={
              touched.status && errors.status ? 'border-destructive' : ''
              } />

            <p className="text-xs text-muted-foreground">
              Inactive mentors cannot be assigned to new cohorts.
            </p>
          </div>

          {/* Max Cohort Capacity */}
          <div className="space-y-1.5">
            <Label htmlFor="maxCohorts" required>
              Max Cohort Capacity
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                handleChange(
                  'maxCohorts',
                  Math.max(1, formData.maxCohorts - 1)
                )
                }
                disabled={formData.maxCohorts <= 1}
                className="h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

                -
              </button>
              <Input
                id="maxCohorts"
                type="number"
                min={1}
                max={10}
                value={formData.maxCohorts}
                onChange={(e) =>
                handleChange('maxCohorts', parseInt(e.target.value) || 1)
                }
                onBlur={() => handleBlur('maxCohorts')}
                className={`w-20 text-center ${touched.maxCohorts && errors.maxCohorts ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''}`} />

              <button
                type="button"
                onClick={() =>
                handleChange(
                  'maxCohorts',
                  Math.min(10, formData.maxCohorts + 1)
                )
                }
                disabled={formData.maxCohorts >= 10}
                className="h-9 w-9 rounded-lg border border-border/60 flex items-center justify-center text-muted-foreground hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">

                +
              </button>
            </div>
            {touched.maxCohorts && errors.maxCohorts ?
            <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.maxCohorts}
              </p> :

            <p className="text-xs text-muted-foreground">
                Maximum number of cohorts this mentor can be assigned to (1-10).
              </p>
            }
          </div>
        </div>
      </DrawerSection>

      <DrawerDivider />

      {/* Bio */}
      <DrawerSection title="Bio">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="bio">Short Bio</Label>
            <span
              className={`text-xs ${bioLength > maxBioLength ? 'text-destructive' : 'text-muted-foreground'}`}>

              {bioLength}/{maxBioLength}
            </span>
          </div>
          <Textarea
            id="bio"
            placeholder="Brief description of the mentor's background and expertise..."
            value={formData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            rows={3}
            className="resize-none" />

          <p className="text-xs text-muted-foreground">
            Optional. This will be visible on the mentor's profile.
          </p>
        </div>
      </DrawerSection>
    </form>);

}
// Footer component to be used with the Drawer
export function MentorFormFooter({
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode = 'create'





}: {onSubmit: () => void;onCancel: () => void;isSubmitting?: boolean;mode?: 'create' | 'edit';}) {
  return (
    <div className="flex gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onCancel}
        className="flex-1"
        disabled={isSubmitting}>

        Cancel
      </Button>
      <Button
        type="submit"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="flex-1">

        {isSubmitting ?
        mode === 'edit' ?
        'Saving...' :
        'Adding...' :
        mode === 'edit' ?
        'Save Mentor' :
        'Add Mentor'}
      </Button>
    </div>);

}