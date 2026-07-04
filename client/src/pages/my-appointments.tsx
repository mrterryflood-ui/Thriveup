import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  Calendar, Plus, Clock, MapPin, FileText, CheckCircle2,
  AlertCircle, XCircle, Building2, ChevronRight, Trash2,
  ArrowRight, Bell,
} from "lucide-react";

type Appointment = {
  id: string;
  title: string;
  orgName?: string;
  appointmentDate: string;
  appointmentTime?: string;
  location?: string;
  notes?: string;
  documentsNeeded?: string[];
  status: "upcoming" | "attended" | "missed" | "cancelled";
  reminderDismissed: boolean;
  createdAt: string;
};

const STATUS_META: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  upcoming:  { label: "Upcoming",  color: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",   icon: Clock },
  attended:  { label: "Attended",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300", icon: CheckCircle2 },
  missed:    { label: "Missed",    color: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",   icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground",                                     icon: XCircle },
};

const apptSchema = z.object({
  title: z.string().min(2, "Appointment title required"),
  orgName: z.string().optional(),
  appointmentDate: z.string().min(1, "Date required"),
  appointmentTime: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
  documentsNeeded: z.string().optional(),
});

type ApptForm = z.infer<typeof apptSchema>;

function daysUntil(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function AddAppointmentDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<ApptForm>({ resolver: zodResolver(apptSchema), defaultValues: { title: "", orgName: "", appointmentDate: "", appointmentTime: "", location: "", notes: "", documentsNeeded: "" } });

  const mutation = useMutation({
    mutationFn: (data: ApptForm) => apiRequest("POST", "/api/my-appointments", {
      ...data,
      documentsNeeded: data.documentsNeeded ? data.documentsNeeded.split(",").map(s => s.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => {
      toast({ title: "Appointment added", description: "You'll see a reminder before the date." });
      setOpen(false);
      form.reset();
      onSuccess();
    },
    onError: () => toast({ title: "Error", description: "Could not save appointment.", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" data-testid="button-add-appointment">
          <Plus className="h-4 w-4" /> Add Appointment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add an appointment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>What is this appointment for?</FormLabel>
                <FormControl><Input placeholder="e.g. SNAP recertification, housing interview…" {...field} data-testid="input-appt-title" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="orgName" render={({ field }) => (
              <FormItem><FormLabel>Organization (optional)</FormLabel>
                <FormControl><Input placeholder="e.g. Travis County HHS, Workforce Solutions" {...field} data-testid="input-appt-org" /></FormControl>
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="appointmentDate" render={({ field }) => (
                <FormItem><FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} data-testid="input-appt-date" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="appointmentTime" render={({ field }) => (
                <FormItem><FormLabel>Time (optional)</FormLabel>
                  <FormControl><Input type="time" {...field} data-testid="input-appt-time" /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem><FormLabel>Location (optional)</FormLabel>
                <FormControl><Input placeholder="Address or virtual link" {...field} data-testid="input-appt-location" /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="documentsNeeded" render={({ field }) => (
              <FormItem><FormLabel>Documents to bring (comma-separated, optional)</FormLabel>
                <FormControl><Input placeholder="ID, birth certificate, proof of income…" {...field} data-testid="input-appt-docs" /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes (optional)</FormLabel>
                <FormControl><Textarea placeholder="Any details you want to remember…" rows={2} {...field} data-testid="input-appt-notes" /></FormControl>
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-save-appointment">
              {mutation.isPending ? "Saving…" : "Save Appointment"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AppointmentCard({ appt, onStatusChange, onDelete }: { appt: Appointment; onStatusChange: (id: string, status: string) => void; onDelete: (id: string) => void }) {
  const meta = STATUS_META[appt.status] || STATUS_META.upcoming;
  const StatusIcon = meta.icon;
  const days = daysUntil(appt.appointmentDate);
  const isUrgent = appt.status === "upcoming" && days >= 0 && days <= 2;
  const isPast = appt.status === "upcoming" && days < 0;

  return (
    <Card className={`border-l-4 ${isUrgent ? "border-l-amber-400" : isPast ? "border-l-rose-400" : "border-l-border"}`} data-testid={`card-appointment-${appt.id}`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
                <StatusIcon className="h-3 w-3" aria-hidden="true" />
                {meta.label}
              </span>
              {isUrgent && <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600 dark:text-amber-400">{days === 0 ? "TODAY" : `${days}d away`}</Badge>}
              {isPast && appt.status === "upcoming" && <Badge variant="outline" className="text-[10px] border-rose-400 text-rose-600">Past due — update status</Badge>}
            </div>
            <p className="font-semibold text-sm" data-testid={`text-appt-title-${appt.id}`}>{appt.title}</p>
            <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
              {appt.orgName && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" aria-hidden="true" />{appt.orgName}</span>}
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" aria-hidden="true" />{appt.appointmentDate}{appt.appointmentTime ? ` at ${appt.appointmentTime}` : ""}</span>
              {appt.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{appt.location}</span>}
            </div>
            {appt.documentsNeeded && appt.documentsNeeded.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1"><FileText className="h-3 w-3" aria-hidden="true" />Bring:</span>
                {appt.documentsNeeded.map((d) => <Badge key={d} variant="outline" className="text-[10px]">{d}</Badge>)}
              </div>
            )}
            {appt.notes && <p className="text-xs text-muted-foreground mt-1.5 italic">{appt.notes}</p>}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            {appt.status === "upcoming" && (
              <>
                <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => onStatusChange(appt.id, "attended")} data-testid={`button-attended-${appt.id}`}>✓ Attended</Button>
                <Button size="sm" variant="outline" className="text-xs h-7 text-rose-600" onClick={() => onStatusChange(appt.id, "missed")} data-testid={`button-missed-${appt.id}`}>✗ Missed</Button>
              </>
            )}
            <Button size="sm" variant="ghost" className="text-xs h-7 text-muted-foreground hover:text-rose-600" onClick={() => onDelete(appt.id)} data-testid={`button-delete-appt-${appt.id}`}>
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyAppointmentsPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: appts = [], refetch } = useQuery<Appointment[]>({
    queryKey: ["/api/my-appointments"],
    enabled: isAuthenticated,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => apiRequest("PATCH", `/api/my-appointments/${id}`, { status }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/my-appointments"] }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/my-appointments/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/my-appointments"] }); toast({ title: "Appointment removed" }); },
  });

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center space-y-4" data-testid="page-appointments-unauth">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold">My Appointments</h1>
        <p className="text-muted-foreground">Sign in to track your appointments, get reminders, and never miss a deadline.</p>
        <a href="/api/login?returnTo=/my-appointments">
          <Button className="gap-2" data-testid="button-signin-appointments">Sign In <ArrowRight className="h-4 w-4" /></Button>
        </a>
      </div>
    );
  }

  const upcoming = appts.filter(a => a.status === "upcoming").sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate));
  const past = appts.filter(a => a.status !== "upcoming");
  const soonest = upcoming.filter(a => daysUntil(a.appointmentDate) <= 7 && !a.reminderDismissed);

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 pb-16 space-y-8" data-testid="page-my-appointments">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6 text-primary" aria-hidden="true" /> My Appointments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track every appointment, what to bring, and what happened.</p>
        </div>
        <AddAppointmentDialog onSuccess={refetch} />
      </div>

      {/* Upcoming reminders */}
      {soonest.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2" data-testid="section-appointment-reminders">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2"><Bell className="h-4 w-4" aria-hidden="true" /> Coming up this week</p>
          {soonest.map(a => (
            <div key={a.id} className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <strong>{a.title}</strong> — {a.appointmentDate}{a.appointmentTime ? ` at ${a.appointmentTime}` : ""}
              {a.documentsNeeded && a.documentsNeeded.length > 0 && <span className="text-xs opacity-75">(bring: {a.documentsNeeded.join(", ")})</span>}
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      <section>
        <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-xs">Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm" data-testid="text-no-upcoming">
            No upcoming appointments. Add one above to start tracking.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map(a => (
              <AppointmentCard key={a.id} appt={a}
                onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3 text-muted-foreground uppercase tracking-wide text-xs">Past ({past.length})</h2>
          <div className="space-y-3">
            {past.slice(0, 5).map(a => (
              <AppointmentCard key={a.id} appt={a}
                onStatusChange={(id, status) => updateMutation.mutate({ id, status })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
