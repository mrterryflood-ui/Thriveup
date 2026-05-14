import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Check, ArrowRight, DollarSign, Users, Briefcase, Rocket,
  CreditCard, Phone, MessageCircle, Star, Shield, FileText,
  Search, Building2, Handshake, X, Mail, GraduationCap, BookOpen, Church
} from "lucide-react";
import { BackToTop } from "@/components/back-to-top";

interface Tier {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  priceLabel: string;
  billingType: string;
  billingLabel: string;
  minimumMembers?: number;
  features: string[];
  executionAddon?: {
    label: string;
    price: number;
    billingLabel: string;
    additionalRate?: string;
    description: string;
  };
  annualDiscount?: {
    price: number;
    label: string;
  };
  highlight: boolean;
}

interface TrainingOption {
  name: string;
  price: number;
  unit: string;
  description: string;
}

interface TrainingTier {
  slug: string;
  name: string;
  tagline: string;
  options: TrainingOption[];
}

interface PricingData {
  tiers: Tier[];
  trainingTiers: TrainingTier[];
  trainingCourses: string[];
  customOption: { tagline: string; cta: string };
  allTiersInclude: string[];
}

function TierCard({ tier, onSelect }: { tier: Tier; onSelect: (tier: Tier) => void }) {
  const iconMap: Record<string, typeof DollarSign> = {
    "try-it": Rocket,
    "group-entity": Users,
    "professional": Briefcase,
    "city-partnership": Building2,
  };
  const Icon = iconMap[tier.slug] || DollarSign;
  const colorMap: Record<string, string> = {
    "try-it": "from-blue-500 to-indigo-600",
    "group-entity": "from-emerald-500 to-teal-600",
    "professional": "from-purple-500 to-indigo-600",
    "city-partnership": "from-amber-500 to-orange-600",
  };

  return (
    <Card
      data-testid={`card-tier-${tier.slug}`}
      className={`relative flex flex-col p-0 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        tier.highlight ? "ring-2 ring-emerald-500 dark:ring-emerald-400" : "border border-border"
      }`}
    >
      {tier.highlight && (
        <div className="absolute top-0 right-0">
          <Badge className="rounded-none rounded-bl-lg bg-emerald-500 text-white px-3 py-1 text-xs font-semibold" data-testid="badge-popular">
            <Star className="w-3 h-3 mr-1" /> Most Popular
          </Badge>
        </div>
      )}

      <div className={`bg-gradient-to-r ${colorMap[tier.slug] || "from-gray-500 to-gray-600"} p-6 text-white`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-bold">{tier.name}</h3>
        </div>
        <p className="text-white/80 text-sm">{tier.tagline}</p>
        <div className="mt-4">
          <span className="text-4xl font-extrabold">{tier.priceLabel}</span>
          <span className="text-white/70 text-sm ml-2">{tier.billingLabel}</span>
        </div>
        {tier.minimumMembers && (
          <p className="text-white/70 text-xs mt-1">Minimum {tier.minimumMembers} members (${tier.minimumMembers * tier.price}/mo starting)</p>
        )}
      </div>

      <div className="flex-1 p-6 space-y-3">
        {tier.features.map((feature, i) => (
          <div key={i} className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
            <span className="text-sm text-muted-foreground">{feature}</span>
          </div>
        ))}

        {tier.executionAddon && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs font-semibold text-foreground mb-1">{tier.executionAddon.label}</p>
            <p className="text-sm font-bold text-foreground">{tier.executionAddon.billingLabel}</p>
            {tier.executionAddon.additionalRate && (
              <p className="text-xs text-muted-foreground">{tier.executionAddon.additionalRate}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">{tier.executionAddon.description}</p>
          </div>
        )}

        {tier.annualDiscount && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">{tier.annualDiscount.label}</p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pt-0">
        <Button
          className="w-full"
          variant={tier.highlight ? "default" : "outline"}
          onClick={() => onSelect(tier)}
          data-testid={`button-select-${tier.slug}`}
        >
          Get Started <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
}

function OrderModal({ tier, onClose }: { tier: Tier; onClose: () => void }) {
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [orderAmount, setOrderAmount] = useState(0);
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    memberCount: tier.minimumMembers || 1,
    notes: "",
    paymentMethod: "",
  });

  const orderMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let amountCents = tier.price * 100;
      if (tier.billingType === "per-member-monthly") {
        amountCents = data.memberCount * tier.price * 100;
      }
      setOrderAmount(amountCents / 100);
      const res = await apiRequest("POST", "/api/pricing/order", {
        tierSlug: tier.slug,
        tierName: tier.name,
        companyName: data.companyName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        memberCount: tier.billingType === "per-member-monthly" ? data.memberCount : null,
        amount: amountCents,
        paymentMethod: data.paymentMethod || null,
        paymentStatus: "pending",
        notes: data.notes || null,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/orders"] });
      setShowConfirmation(true);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to submit order", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName || !formData.contactName || !formData.contactEmail) {
      toast({ title: "Missing Fields", description: "Please fill in company name, your name, and email.", variant: "destructive" });
      return;
    }
    orderMutation.mutate(formData);
  };

  const computedPrice = tier.billingType === "per-member-monthly"
    ? formData.memberCount * tier.price
    : tier.price;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" data-testid="modal-order">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground" data-testid="button-close-order">
          <X className="w-5 h-5" />
        </button>

        {showConfirmation ? (
          <div className="space-y-5 text-center" data-testid="section-order-confirmation">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold" data-testid="text-confirmation-title">Order Received!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {tier.name} Tier — ${orderAmount}{tier.billingType === "one-time" ? " one-time" : "/month"}
              </p>
            </div>

            <div className="text-left space-y-3">
              <p className="text-sm font-semibold">Pay now using any of these methods:</p>

              <a
                href="https://cash.app/$MRTDFLOOD"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                data-testid="link-cashapp-pay"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Cash App</p>
                  <p className="text-xs text-muted-foreground">$MRTDFLOOD</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </a>

              <a
                href="https://paypal.me/TERRYFLOODCEO"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                data-testid="link-paypal-pay"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">PayPal</p>
                  <p className="text-xs text-muted-foreground">PayPal · TCAF direct (EIN 41-3618503)</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
              </a>

              <p className="text-xs text-muted-foreground text-center">
                PayPal also accepts credit and debit cards — no PayPal account needed.
              </p>
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex items-center gap-2 justify-center">
                <Mail className="w-4 h-4 text-primary" />
                <p className="text-sm">
                  Questions? Contact us at{" "}
                  <a href="mailto:president@thecollaborativeadvocate.org" className="text-primary font-semibold hover:underline" data-testid="link-contact-email">
                    president@thecollaborativeadvocate.org
                  </a>
                </p>
              </div>
            </div>

            <Button onClick={onClose} variant="outline" className="w-full" data-testid="button-close-confirmation">
              Done
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-1" data-testid="text-modal-tier-name">{tier.name} Tier</h2>
            <p className="text-sm text-muted-foreground mb-4">{tier.tagline}</p>

            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-lg font-bold" data-testid="text-modal-price">${computedPrice}{tier.billingType === "one-time" ? " one-time" : "/month"}</p>
              {tier.billingType === "per-member-monthly" && (
                <p className="text-xs text-muted-foreground">{formData.memberCount} members × ${tier.price}/member</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">+ 5% success fee on contract wins</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="companyName">Company / Organization Name *</Label>
                <Input id="companyName" value={formData.companyName} onChange={e => setFormData(d => ({ ...d, companyName: e.target.value }))} required data-testid="input-company-name" />
              </div>
              <div>
                <Label htmlFor="contactName">Your Name *</Label>
                <Input id="contactName" value={formData.contactName} onChange={e => setFormData(d => ({ ...d, contactName: e.target.value }))} required data-testid="input-contact-name" />
              </div>
              <div>
                <Label htmlFor="contactEmail">Email *</Label>
                <Input id="contactEmail" type="email" value={formData.contactEmail} onChange={e => setFormData(d => ({ ...d, contactEmail: e.target.value }))} required data-testid="input-contact-email" />
              </div>
              <div>
                <Label htmlFor="contactPhone">Phone (optional)</Label>
                <Input id="contactPhone" type="tel" value={formData.contactPhone} onChange={e => setFormData(d => ({ ...d, contactPhone: e.target.value }))} data-testid="input-contact-phone" />
              </div>

              {tier.billingType === "per-member-monthly" && (
                <div>
                  <Label htmlFor="memberCount">Number of Members (min {tier.minimumMembers})</Label>
                  <Input
                    id="memberCount"
                    type="number"
                    min={tier.minimumMembers}
                    value={formData.memberCount}
                    onChange={e => setFormData(d => ({ ...d, memberCount: Math.max(tier.minimumMembers || 50, parseInt(e.target.value) || 50) }))}
                    data-testid="input-member-count"
                  />
                </div>
              )}

              <div>
                <Label>Preferred Payment Method</Label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {[
                    { value: "credit-card", label: "Credit Card", icon: CreditCard },
                    { value: "paypal", label: "PayPal", icon: DollarSign },
                    { value: "cashapp", label: "Cash App", icon: Phone },
                  ].map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setFormData(d => ({ ...d, paymentMethod: pm.value }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border text-xs transition-colors ${
                        formData.paymentMethod === pm.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                      data-testid={`button-payment-${pm.value}`}
                    >
                      <pm.icon className="w-5 h-5" />
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea id="notes" value={formData.notes} onChange={e => setFormData(d => ({ ...d, notes: e.target.value }))} rows={2} data-testid="input-order-notes" />
              </div>

              <Button type="submit" className="w-full" disabled={orderMutation.isPending} data-testid="button-submit-order">
                {orderMutation.isPending ? "Submitting..." : "Submit Order Request"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                After submitting, you'll see payment options to pay immediately.
              </p>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}

function ConsultationForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    message: "",
  });

  const consultMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/pricing/consultation", {
        companyName: data.companyName,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone || null,
        message: data.message || null,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Request Received!", description: "We'll be in touch within 24 hours to schedule your consultation." });
      setFormData({ companyName: "", contactName: "", contactEmail: "", contactPhone: "", message: "" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to submit", variant: "destructive" });
    },
  });

  return (
    <Card className="p-6 max-w-xl mx-auto" data-testid="card-consultation-form">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3">
          <Handshake className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold" data-testid="text-custom-plan-heading">Need a Custom Plan?</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Every organization is different. Let's talk and build a plan that works for you.
        </p>
      </div>
      <form onSubmit={e => { e.preventDefault(); consultMutation.mutate(formData); }} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="consultCompany">Company *</Label>
            <Input id="consultCompany" value={formData.companyName} onChange={e => setFormData(d => ({ ...d, companyName: e.target.value }))} required data-testid="input-consult-company" />
          </div>
          <div>
            <Label htmlFor="consultName">Your Name *</Label>
            <Input id="consultName" value={formData.contactName} onChange={e => setFormData(d => ({ ...d, contactName: e.target.value }))} required data-testid="input-consult-name" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="consultEmail">Email *</Label>
            <Input id="consultEmail" type="email" value={formData.contactEmail} onChange={e => setFormData(d => ({ ...d, contactEmail: e.target.value }))} required data-testid="input-consult-email" />
          </div>
          <div>
            <Label htmlFor="consultPhone">Phone</Label>
            <Input id="consultPhone" type="tel" value={formData.contactPhone} onChange={e => setFormData(d => ({ ...d, contactPhone: e.target.value }))} data-testid="input-consult-phone" />
          </div>
        </div>
        <div>
          <Label htmlFor="consultMessage">Tell us about your needs</Label>
          <Textarea id="consultMessage" value={formData.message} onChange={e => setFormData(d => ({ ...d, message: e.target.value }))} rows={3} data-testid="input-consult-message" />
        </div>
        <Button type="submit" className="w-full" variant="outline" disabled={consultMutation.isPending} data-testid="button-submit-consultation">
          {consultMutation.isPending ? "Submitting..." : "Schedule a Consultation"}
        </Button>
      </form>
    </Card>
  );
}

export default function PricingPage() {
  const { data: pricingData, isLoading } = useQuery<PricingData>({ queryKey: ["/api/pricing/tiers"] });
  const [selectedTier, setSelectedTier] = useState<Tier | null>(null);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-12">
      <div className="text-center space-y-4 py-8">
        <Badge variant="outline" className="text-sm px-4 py-1" data-testid="badge-pricing-header">
          <DollarSign className="w-3 h-3 mr-1" /> Grant & Contract Services
        </Badge>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight" data-testid="text-pricing-title">
          Win More Contracts. Secure More Grants.
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          From SAM.gov registration to contract execution — we help your business compete and win
          in the government contracting and grant space. Backed by a 24-platform AI-powered ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-96 animate-pulse bg-muted/30" />
          ))
        ) : (
          pricingData?.tiers.filter(t => t.slug !== "city-partnership").map(tier => (
            <TierCard key={tier.slug} tier={tier} onSelect={setSelectedTier} />
          ))
        )}
      </div>

      {!isLoading && pricingData?.tiers.find(t => t.slug === "city-partnership") && (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-4">
            <Badge variant="outline" className="text-sm px-4 py-1 border-amber-300 text-amber-700 dark:text-amber-400" data-testid="badge-city-tier">
              <Building2 className="w-3 h-3 mr-1" /> For Cities & Municipal Governments
            </Badge>
          </div>
          <TierCard
            tier={pricingData.tiers.find(t => t.slug === "city-partnership")!}
            onSelect={setSelectedTier}
          />
        </div>
      )}

      {pricingData?.trainingTiers && (
        <div className="space-y-6" id="training">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="text-sm px-4 py-1" data-testid="badge-training-header">
              <GraduationCap className="w-3 h-3 mr-1" /> Workforce Training & Education
            </Badge>
            <h2 className="text-2xl md:text-3xl font-extrabold" data-testid="text-training-title">
              Training That Transforms Your Team
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              AI workforce skills, project management, financial literacy, career readiness, and more —
              delivered live or self-paced, for any size organization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pricingData.trainingTiers.map(tt => {
              const isComm = tt.slug === "community-training";
              return (
                <Card key={tt.slug} className={`p-0 overflow-hidden ${isComm ? "border-green-200 dark:border-green-800" : "border-blue-200 dark:border-blue-800"}`} data-testid={`card-training-${tt.slug}`}>
                  <div className={`p-5 text-white ${isComm ? "bg-gradient-to-r from-green-600 to-emerald-600" : "bg-gradient-to-r from-blue-600 to-indigo-600"}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                        {isComm ? <Church className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                      </div>
                      <h3 className="text-lg font-bold">{tt.name}</h3>
                    </div>
                    <p className="text-white/80 text-sm">{tt.tagline}</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {tt.options.map((opt, i) => (
                      <div key={i} className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{opt.name}</p>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold">${opt.price.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{opt.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })}
          </div>

          {pricingData.trainingCourses && (
            <div className="bg-muted/30 rounded-xl p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2" data-testid="text-available-courses">
                <BookOpen className="w-5 h-5 text-primary" /> Available Courses
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pricingData.trainingCourses.map((course, i) => (
                  <div key={i} className="flex items-center gap-2 bg-background rounded-lg p-3 border border-border">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-sm">{course}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-muted/30 rounded-xl p-6">
        <div className="sm:col-span-2 lg:col-span-3 mb-2">
          <h3 className="text-lg font-bold" data-testid="text-all-tiers-include">All Contract Tiers Include</h3>
        </div>
        {pricingData?.allTiersInclude.map((item, i) => {
          const icons = [MessageCircle, FileText, Search, Shield, Building2, Star];
          const ItemIcon = icons[i % icons.length];
          return (
            <div key={i} className="flex items-center gap-3 bg-background rounded-lg p-3 border border-border">
              <ItemIcon className="w-5 h-5 text-primary shrink-0" />
              <span className="text-sm">{item}</span>
            </div>
          );
        })}
      </div>

      <div className="text-center space-y-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8">
        <h3 className="text-xl font-bold" data-testid="text-payment-methods-heading">Flexible Payment Options</h3>
        <p className="text-muted-foreground text-sm">We accept multiple payment methods to make it easy for you.</p>
        <div className="flex justify-center gap-6 mt-4">
          <a href="https://cash.app/$MRTDFLOOD" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity" data-testid="link-cashapp-main">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium">Cash App</span>
            <span className="text-xs text-muted-foreground">$MRTDFLOOD</span>
          </a>
          <a href="https://paypal.me/TERRYFLOODCEO" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 hover:opacity-80 transition-opacity" data-testid="link-paypal-main">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium">PayPal</span>
            <span className="text-xs text-muted-foreground">PayPal · TCAF direct (EIN 41-3618503)</span>
          </a>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-xs font-medium">Credit Card</span>
            <span className="text-xs text-muted-foreground">via PayPal</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-primary/10">
          <div className="flex items-center justify-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <p className="text-sm">
              Contact us: <a href="mailto:president@thecollaborativeadvocate.org" className="text-primary font-semibold hover:underline" data-testid="link-contact-email-main">president@thecollaborativeadvocate.org</a>
            </p>
          </div>
        </div>
      </div>

      <ConsultationForm />

      {selectedTier && <OrderModal tier={selectedTier} onClose={() => setSelectedTier(null)} />}
      <BackToTop />
    </div>
  );
}
