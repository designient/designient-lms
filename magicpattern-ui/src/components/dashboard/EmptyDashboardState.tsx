import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter } from
'../ui/Card';
import { Button } from '../ui/Button';
import { Layers, Users, UserCheck, Plus, ArrowRight } from 'lucide-react';
import { PageName } from '../layout/Sidebar';
interface EmptyDashboardStateProps {
  onNavigate: (page: PageName) => void;
}
export function EmptyDashboardState({ onNavigate }: EmptyDashboardStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full animate-in fade-in duration-500 py-12">
      {/* Header Section */}
      <div className="text-center space-y-3 max-w-lg mb-12">
        <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-6 text-primary">
          <Layers className="h-6 w-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome to Designient
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Your mentorship program is ready to be built. Start by creating your
          first cohort to begin managing students and mentors.
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid gap-4 md:grid-cols-3 w-full max-w-4xl px-4">
        {/* Action 1: Create Cohort */}
        <Card
          className="flex flex-col h-full border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer"
          onClick={() => onNavigate('cohorts')}>

          <CardHeader className="pb-2">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
              <Layers className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-base">Create First Cohort</CardTitle>
            <CardDescription className="text-xs">
              Define dates, curriculum, and capacity for your first group.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1" />
          <CardFooter className="pt-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full group-hover:border-primary/50 group-hover:text-primary transition-colors">

              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Cohort
            </Button>
          </CardFooter>
        </Card>

        {/* Action 2: Invite Students */}
        <Card
          className="flex flex-col h-full border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer"
          onClick={() => onNavigate('students')}>

          <CardHeader className="pb-2">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center mb-2 group-hover:bg-muted/80 transition-colors">
              <Users className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </div>
            <CardTitle className="text-base">Invite Students</CardTitle>
            <CardDescription className="text-xs">
              Add students individually or bulk import them via CSV.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1" />
          <CardFooter className="pt-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full group-hover:border-muted-foreground/50 transition-colors">

              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Students
            </Button>
          </CardFooter>
        </Card>

        {/* Action 3: Add Mentors */}
        <Card
          className="flex flex-col h-full border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 group cursor-pointer"
          onClick={() => onNavigate('mentors')}>

          <CardHeader className="pb-2">
            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center mb-2 group-hover:bg-muted/80 transition-colors">
              <UserCheck className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
            </div>
            <CardTitle className="text-base">Add Mentors</CardTitle>
            <CardDescription className="text-xs">
              Onboard mentors and assign them to upcoming cohorts.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1" />
          <CardFooter className="pt-0">
            <Button
              variant="outline"
              size="sm"
              className="w-full group-hover:border-muted-foreground/50 transition-colors">

              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add Mentors
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Helper Link */}
      <div className="mt-10">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground text-xs"
          onClick={() => onNavigate('settings')}>

          Configure platform settings{' '}
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    </div>);

}