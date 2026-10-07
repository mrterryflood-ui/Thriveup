import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import {
  Mail, Phone, MapPin, GraduationCap, Shield, Award, BookOpen,
  CheckCircle2, Clock, Send, Building2, Users,
} from "lucide-react";
import type { ContactInquiry, AcademyAvatar } from "@shared/schema";

const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  organizationName: z.string().optional(),
  inquiryType: z.enum(["general", "partnership", "demo", "grant"]),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

function ContactForm() {
  const { toast } = useToast();
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      organizationName: "",
      inquiryType: "general",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: ContactFormValues) => {
      const res = await apiRequest("POST", "/api/contact", values);
      return res.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["/api/contact/inquiries"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit inquiry. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-xl font-bold" data-testid="text-contact-success">Message Sent Successfully</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Thank you for reaching out! We'll respond within 24 hours. Check your email for a confirmation.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              form.reset();
            }}
            data-testid="button-send-another"
          >
            Send Another Message
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Us a Message</CardTitle>
        <CardDescription>Fill out the form and we'll get back to you within 24 hours.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Your name" {...field} data-testid="input-contact-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} data-testid="input-contact-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="organizationName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Your organization" {...field} data-testid="input-contact-org" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="inquiryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inquiry Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-inquiry-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="general">General Inquiry</SelectItem>
                      <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                      <SelectItem value="demo">Request a Demo</SelectItem>
                      <SelectItem value="grant">Grant Collaboration</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us how we can help..."
                      className="min-h-[120px]"
                      {...field}
                      data-testid="input-contact-message"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={mutation.isPending} data-testid="button-submit-contact">
              {mutation.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function LeadershipCard() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-md bg-gradient-to-br from-violet-700 to-indigo-800 flex items-center justify-center shrink-0">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg" data-testid="text-contact-leader-name">Dr. Terry Flood, DHA</h3>
            <p className="text-sm text-muted-foreground">Implementation Scientist &middot; Veteran &middot; Platform Architect</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <span data-testid="text-contact-email">president@thecollaborativeadvocate.org</span>
          </div>

          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <span>U.S. Army (Retired), CW2 &middot; Bronze Star Medal (x2)</span>
          </div>

          <div className="flex items-start gap-2">
            <BookOpen className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <span>DHA, DBA, MBA, MS Implementation Science (Dartmouth, July 2026)</span>
          </div>

          <div className="flex items-start gap-2">
            <Award className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <span>VA VCL Social Science Program Specialist</span>
          </div>

          <div className="flex items-start gap-2">
            <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <span>Collaborative Advocate Foundation 501(c)(3) + LLC (VOSB)</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">MAP-GAP</Badge>
          <Badge variant="secondary">SALP</Badge>
          <Badge variant="secondary">Lean Six Sigma</Badge>
          <Badge variant="secondary">FEMA/ICS</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminInquiriesPanel() {
  const { data: inquiries, isLoading } = useQuery<ContactInquiry[]>({
    queryKey: ["/api/contact/inquiries"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/contact/inquiries/${id}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contact/inquiries"] });
    },
  });

  if (isLoading) return null;
  if (!inquiries || inquiries.length === 0) return null;

  const statusColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    contacted: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    "in-progress": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Contact Inquiries ({inquiries.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {inquiries.map((inq) => (
            <div key={inq.id} className="border rounded-md p-4 space-y-2" data-testid={`card-inquiry-${inq.id}`}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold" data-testid={`text-inquiry-name-${inq.id}`}>{inq.name}</span>
                  <Badge variant="outline">{inq.inquiryType}</Badge>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[inq.status] || ""}`}>
                    {inq.status}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : ""}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{inq.email}</p>
              {inq.organizationName && (
                <p className="text-sm text-muted-foreground">{inq.organizationName}</p>
              )}
              <p className="text-sm">{inq.message}</p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {["new", "contacted", "in-progress", "closed"].map((s) => (
                  <Button
                    key={s}
                    variant={inq.status === s ? "default" : "outline"}
                    size="sm"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: inq.id, status: s })}
                    data-testid={`button-status-${s}-${inq.id}`}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ContactPage() {
  const { isAuthenticated } = useAuth();
  const { data: avatarData } = useQuery<AcademyAvatar>({
    queryKey: ["/api/academy/avatar"],
    enabled: isAuthenticated,
  });
  const userRole = avatarData?.role || "student";
  const isAdmin = userRole === "admin" || userRole === "teacher" || userRole === "case_manager";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader
        title="Contact Us"
        description="Get in touch with the ThriveUp team for partnerships, demos, grant collaborations, or general inquiries."
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <ContactForm />
        </div>
        <div className="lg:col-span-2 space-y-4">
          <LeadershipCard />
          <Card>
            <CardContent className="p-6 space-y-3">
              <h4 className="font-semibold">How Can We Help?</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                  <span><strong>Partnership</strong> — Explore coalition and community partnership opportunities</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                  <span><strong>Demo</strong> — See the platform in action with a guided walkthrough</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                  <span><strong>Grant</strong> — Collaborate on grant applications and funding opportunities</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 dark:text-green-400 shrink-0" />
                  <span><strong>General</strong> — Any other questions or feedback</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isAuthenticated && isAdmin && <AdminInquiriesPanel />}
    </div>
  );
}
