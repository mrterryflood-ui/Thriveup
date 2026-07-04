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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import {
  Users, Plus, ArrowRight, Heart, Shield, Baby, User,
  GraduationCap, Briefcase, AlertCircle, CheckCircle2,
  ChevronRight, Home, HandHeart,
} from "lucide-react";

type HouseholdMember = {
  id: string;
  firstName: string;
  lastName?: string;
  relationship: string;
  dateOfBirth?: string;
  gender?: string;
  notes?: string;
};

type Household = {
  id: string;
  householdName: string;
  members: HouseholdMember[];
};

const RELATIONSHIPS = [
  "Self", "Spouse / Partner", "Child", "Parent", "Sibling",
  "Grandchild", "Grandparent", "Foster Child", "Foster Parent",
  "Other Family Member", "Roommate / Housemate",
];

const BENEFIT_LINKS = [
  { label: "Benefits Screening", desc: "Screen the whole household for SNAP, Medicaid, and 7 more programs", href: "/benefits-screener", icon: HandHeart, color: "text-rose-600" },
  { label: "Housing Navigator",  desc: "Find housing options for your household size and situation",         href: "/benefits",        icon: Home,        color: "text-blue-600" },
  { label: "Foster Youth Tools", desc: "If any member is a current or former foster youth",                  href: "/foster-youth",    icon: Baby,        color: "text-violet-600" },
  { label: "My Appointments",    desc: "Track appointments for all household members in one place",           href: "/my-appointments", icon: CheckCircle2,color: "text-emerald-600" },
  { label: "My Document Vault",  desc: "Store ID and documents for household members",                       href: "/my-documents",    icon: Shield,      color: "text-amber-600" },
];

const memberSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().optional(),
  relationship: z.string().min(1, "Relationship required"),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  notes: z.string().optional(),
});
type MemberForm = z.infer<typeof memberSchema>;

function ageFromDOB(dob?: string) {
  if (!dob) return null;
  const d = new Date(dob);
  const now = new Date();
  const age = now.getFullYear() - d.getFullYear();
  return age >= 0 && age < 130 ? age : null;
}

function relationshipIcon(rel: string) {
  if (rel === "Self") return User;
  if (rel === "Child" || rel === "Foster Child" || rel === "Grandchild") return Baby;
  if (rel.includes("Parent") || rel.includes("Grandparent")) return Users;
  return User;
}

function AddMemberDialog({ householdId, onSuccess }: { householdId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const form = useForm<MemberForm>({ resolver: zodResolver(memberSchema), defaultValues: { firstName: "", lastName: "", relationship: "Child", dateOfBirth: "", gender: "", notes: "" } });

  const mutation = useMutation({
    mutationFn: (data: MemberForm) => apiRequest("POST", `/api/my-household/${householdId}/members`, data),
    onSuccess: () => { toast({ title: "Member added" }); setOpen(false); form.reset(); onSuccess(); },
    onError: () => toast({ title: "Error saving member", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" data-testid="button-add-member">
          <Plus className="h-3.5 w-3.5" /> Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Add household member</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(d => mutation.mutate(d))} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="firstName" render={({ field }) => (
                <FormItem><FormLabel>First name</FormLabel>
                  <FormControl><Input {...field} data-testid="input-member-first" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="lastName" render={({ field }) => (
                <FormItem><FormLabel>Last name</FormLabel>
                  <FormControl><Input {...field} data-testid="input-member-last" /></FormControl>
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="relationship" render={({ field }) => (
              <FormItem><FormLabel>Relationship to you</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl><SelectTrigger data-testid="select-member-relationship"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    {RELATIONSHIPS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="dateOfBirth" render={({ field }) => (
              <FormItem><FormLabel>Date of birth (optional)</FormLabel>
                <FormControl><Input type="date" {...field} data-testid="input-member-dob" /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem><FormLabel>Notes (optional)</FormLabel>
                <FormControl><Input placeholder="e.g. has IEP, on Medicaid, foster youth" {...field} data-testid="input-member-notes" /></FormControl>
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-save-member">
              {mutation.isPending ? "Saving…" : "Add to Household"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function MyHouseholdPage() {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const { data: household, refetch, isLoading } = useQuery<Household | null>({
    queryKey: ["/api/my-household"],
    enabled: isAuthenticated,
  });

  const createMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/my-household", { householdName: "My Household" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/my-household"] }); refetch(); },
    onError: () => toast({ title: "Error creating household", variant: "destructive" }),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ householdId, memberId }: { householdId: string; memberId: string }) =>
      apiRequest("DELETE", `/api/my-household/${householdId}/members/${memberId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/my-household"] }); toast({ title: "Member removed" }); },
  });

  if (!isAuthenticated) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-16 text-center space-y-4" data-testid="page-household-unauth">
        <Users className="h-12 w-12 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold">My Household</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Track your household members, their needs, and the benefits and services available to your whole family — in one place.</p>
        <a href="/api/login?returnTo=/my-household">
          <Button className="gap-2" data-testid="button-signin-household">Sign In <ArrowRight className="h-4 w-4" /></Button>
        </a>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 pb-16 space-y-8" data-testid="page-my-household">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" aria-hidden="true" /> My Household</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your household, your services, your story — all in one view.</p>
      </div>

      {isLoading && <div className="text-center py-10 text-muted-foreground text-sm">Loading your household…</div>}

      {!isLoading && !household && (
        <Card className="border-dashed border-2 text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <Users className="h-10 w-10 text-muted-foreground mx-auto" aria-hidden="true" />
            <div>
              <p className="font-semibold">No household set up yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Set up your household to track all members, their needs, and what support is available to your family.</p>
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending} className="gap-2" data-testid="button-create-household">
              <Plus className="h-4 w-4" /> {createMutation.isPending ? "Setting up…" : "Set Up My Household"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && household && (
        <>
          {/* Members */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-base">Household Members ({household.members?.length ?? 0})</h2>
              <AddMemberDialog householdId={household.id} onSuccess={refetch} />
            </div>
            {(!household.members || household.members.length === 0) ? (
              <div className="text-center py-8 text-sm text-muted-foreground border rounded-xl border-dashed">
                No members added yet. Add yourself and your household members to see what support is available to each person.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {household.members.map(m => {
                  const Icon = relationshipIcon(m.relationship);
                  const age = ageFromDOB(m.dateOfBirth);
                  return (
                    <Card key={m.id} className="border" data-testid={`card-member-${m.id}`}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm" data-testid={`text-member-name-${m.id}`}>
                              {m.firstName}{m.lastName ? ` ${m.lastName}` : ""}
                            </p>
                            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                              <Badge variant="outline" className="text-[10px]">{m.relationship}</Badge>
                              {age !== null && <span className="text-[11px] text-muted-foreground">Age {age}</span>}
                            </div>
                            {m.notes && <p className="text-xs text-muted-foreground mt-1 italic">{m.notes}</p>}
                          </div>
                          <Button
                            size="icon" variant="ghost" className="h-8 w-8 hover:text-rose-600 shrink-0"
                            onClick={() => removeMemberMutation.mutate({ householdId: household.id, memberId: m.id })}
                            data-testid={`button-remove-member-${m.id}`} aria-label="Remove member"
                          >
                            ×
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Household services */}
          <section>
            <h2 className="font-semibold text-base mb-3">Services for your household</h2>
            <div className="space-y-2">
              {BENEFIT_LINKS.map(link => (
                <Link key={link.label} href={link.href}>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border hover:bg-muted/30 transition-colors cursor-pointer group" data-testid={`link-household-${link.label.toLowerCase().replace(/\s+/g, '-')}`}>
                    <link.icon className={`h-5 w-5 shrink-0 ${link.color}`} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{link.label}</p>
                      <p className="text-xs text-muted-foreground">{link.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Privacy note */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border text-xs text-muted-foreground">
            <Shield className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" aria-hidden="true" />
            <span>Your household information is private to you. It is never shared with funders, researchers, or partner organizations without your explicit consent.</span>
          </div>
        </>
      )}
    </div>
  );
}
