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
  Search, Building2, Handshake, X
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
  highlight: boolean;
}

interface PricingData {
  tiers: Tier[];
  customOption: { tagline: string; cta: string };
  allTiersInclude: string[];
}

function TierCard({ tier, onSelect }: { tier: Tier; onSelect: (tier: Tier) => void }) {
  const iconMap: Record<string, typeof DollarSign> = {
    "try-it": Rocket,
    "group-entity": Users,
    "professional": Briefcase,
  };
  const Icon = iconMap[tier.slug] || DollarSign;
  const colorMap: Record<string, string> = {
    "try-it": "from-blue-500 to-indigo-600",
    "group-entity": "from-emerald-500 to-teal-600",
    "professional": "from-purple-500 to-indigo-600",
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
      toast({ title: "Order Submitted!", description: "We'll reach out within 24 hours to finalize your setup and payment." });
      queryClient.invalidateQueries({ queryKey: ["/api/pricing/orders"] });
      onClose();
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
            We'll contact you within 24 hours to finalize setup and arrange payment.
          </p>
        </form>
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
          in the government contracting and grant space. Backed by a 23-platform AI-powered ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-96 animate-pulse bg-muted/30" />
          ))
        ) : (
          pricingData?.tiers.map(tier => (
            <TierCard key={tier.slug} tier={tier} onSelect={setSelectedTier} />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-muted/30 rounded-xl p-6">
        <div className="sm:col-span-2 lg:col-span-3 mb-2">
          <h3 className="text-lg font-bold" data-testid="text-all-tiers-include">All Tiers Include</h3>
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
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium">Credit Card</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="text-xs font-medium">PayPal</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium">Cash App</span>
          </div>
        </div>
      </div>

      <ConsultationForm />

      {selectedTier && <OrderModal tier={selectedTier} onClose={() => setSelectedTier(null)} />}
      <BackToTop />
    </div>
  );
}
