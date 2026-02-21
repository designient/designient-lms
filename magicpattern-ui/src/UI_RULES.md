
# Designient Workspace Admin - Global UI Rules

## Design Philosophy
- **Calm, Modern SaaS** - Premium, confident, enterprise-ready
- **Actions over Analytics** - Dashboard prioritizes actionable items
- **Clarity First** - Clear hierarchy, readable data, obvious interactions

---

## 1. Navigation Pattern

### Hybrid Navigation
- **Left Sidebar** (fixed, 256px): Primary navigation
  - Dashboard, Cohorts, Students, Mentors
  - Settings at bottom
- **Top Header** (sticky): Page title, search, notifications, user menu

---

## 2. Data Surfaces

### Tables (Primary Data Surface)
```
Structure:
- Card wrapper with overflow-hidden, rounded-xl border
- Header: bg-muted/30, h-11, font-medium text-muted-foreground
- Rows: py-3.5 px-4, hover:bg-muted/40, cursor-pointer
- Last row: border-b-0
- Actions column: MoreHorizontal icon, opacity-0 group-hover:opacity-100
```

### Cards (Summary/Stats)
- Used for stat cards, overview sections
- rounded-xl, border-border/60, shadow-sm hover:shadow-md

---

## 3. Create/Edit Actions → Right-Side Drawers

### Rule: NO full-page forms
All create and edit actions open in right-side drawers.

### Drawer Sizes
- `sm` (max-w-sm): Simple forms, quick edits
- `md` (max-w-md): Standard forms (Student, Mentor details)
- `lg` (max-w-lg): Complex forms (Cohort creation with multiple sections)
- `xl` (max-w-xl): Extended content

### Drawer Structure
```
┌─────────────────────────────┐
│ Header (title + close)      │
├─────────────────────────────┤
│ Body (scrollable)           │
│ - DrawerSection components  │
│ - DrawerDivider between     │
├─────────────────────────────┤
│ Footer (sticky actions)     │
│ [Cancel] [Primary Action]   │
└─────────────────────────────┘
```

### Drawer Modes
- **View Mode**: Display details, actions to edit/manage
- **Create Mode**: Empty form, "Create X" title
- **Edit Mode**: Pre-filled form, "Edit X" title

---

## 4. Status Badges (Colored Pills)

### Rule: Status ALWAYS shown as Badge component

### Student Lifecycle States
| Status    | Variant       | Color        |
|-----------|---------------|--------------|
| Invited   | `neutral`     | Slate/Gray   |
| Active    | `success`     | Emerald      |
| Flagged   | `warning`     | Amber        |
| Dropped   | `destructive` | Red          |
| Completed | `default`     | Primary tint |

### Cohort States
| Status    | Variant     | Color        |
|-----------|-------------|--------------|
| Active    | `success`   | Emerald      |
| Upcoming  | `neutral`   | Slate/Gray   |
| Completed | `secondary` | Gray         |
| Archived  | `outline`   | Border only  |

### Mentor States
| Status   | Variant   | Color      |
|----------|-----------|------------|
| Active   | `success` | Emerald    |
| Inactive | `neutral` | Slate/Gray |

---

## 5. Destructive Actions → Confirmation Required

### Rule: ALL destructive actions require inline confirmation

### Confirmation Pattern
```jsx
<div className="p-4 rounded-lg bg-red-50/50 border border-red-200/60 space-y-3">
  <div className="flex items-start gap-3">
    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
      <AlertTriangle className="h-4 w-4 text-red-600" />
    </div>
    <div>
      <h4 className="text-sm font-medium text-red-800">Confirm [Action]</h4>
      <p className="text-xs text-red-700 mt-1">
        Warning message with <strong>entity name</strong>.
      </p>
    </div>
  </div>
  <div className="flex gap-2 pt-1">
    <Button variant="outline" size="sm">Cancel</Button>
    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
      Confirm [Action]
    </Button>
  </div>
</div>
```

### Destructive Actions List
- Drop Student
- Deactivate Mentor
- Archive Cohort
- Remove from Cohort

### Warning Actions (Amber variant)
- Flag Student
- Deactivate Mentor (uses amber for less severity)

---

## 6. Modals (Confirmations Only)

### Rule: Modals used ONLY for:
- Assignment confirmations (Assign Mentor to Cohort)
- Multi-step confirmations requiring selection

### NOT for:
- Create/Edit forms (use Drawers)
- Simple confirmations (use inline confirmation)

---

## 7. Dashboard Design

### Rule: Prioritize Actions over Analytics

### Layout Priority
1. **Attention Required** - Flagged students, pending assignments, critical cohorts
2. **Quick Stats** - Active cohorts, students, mentors at capacity
3. **System Overview** - Upcoming/completed cohorts

### Empty State
- Clear onboarding guidance
- Action cards: Create Cohort, Invite Students, Add Mentors

---

## 8. Color Palette

### Semantic Colors
- **Primary**: Indigo (238 55% 55%) - Actions, links, focus
- **Success**: Emerald - Active states, confirmations
- **Warning**: Amber - Flagged, attention needed
- **Destructive**: Red - Errors, drop/remove actions
- **Neutral**: Slate/Gray - Inactive, pending states

### Background Hierarchy
- Page: `bg-background` (98.5% white)
- Cards: `bg-card` (pure white)
- Muted areas: `bg-muted/30` to `bg-muted/50`
- Hover states: `hover:bg-muted/40`

---

## 9. Typography

### Font
- Inter (400, 500, 600, 700)
- Feature settings: cv02, cv03, cv04, cv11

### Hierarchy
- Page title: text-xl font-semibold
- Section title: text-lg font-semibold
- Card title: text-base font-semibold
- Body: text-sm
- Caption/Helper: text-xs text-muted-foreground

---

## 10. Spacing & Layout

### Page Layout
- Sidebar: 256px fixed
- Main content: pl-64
- Content max-width: max-w-7xl mx-auto
- Page padding: p-8

### Component Spacing
- Section gaps: space-y-6 or space-y-8
- Card padding: p-5
- Table cell padding: px-4 py-3.5
- Drawer body padding: p-6

---

## 11. Interactive States

### Buttons
- Primary: Solid primary color, shadow-sm
- Outline: Border, transparent bg, hover:bg-muted/60
- Ghost: No border, hover:bg-muted/60
- Destructive: Red variant for dangerous actions

### Hover States
- Table rows: hover:bg-muted/40
- Cards: hover:shadow-md
- Buttons: Defined per variant

### Focus States
- Ring: 2px solid primary color
- Offset: 2px

---

## Component Import Reference

```tsx
// UI Components
import { Button } from './components/ui/Button'
import { Badge } from './components/ui/Badge'
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card'
import { Drawer, DrawerSection, DrawerDivider } from './components/ui/Drawer'
import { Input } from './components/ui/Input'
import { Label } from './components/ui/Label'
import { Select } from './components/ui/Select'
import { Textarea } from './components/ui/Textarea'

// Layout Components
import { DashboardLayout } from './components/layout/DashboardLayout'
import { Sidebar } from './components/layout/Sidebar'
import { Header } from './components/layout/Header'
```
