import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Users, Building2, DollarSign, BarChart3, Plus, ChevronLeft, CheckCircle2, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";

interface PartnerOrg {
  id: string; orgName: string; orgType: string; contactName: string;
  contactEmail: string; phone: string; county: string; mission: string;
  yearsServingDvSa: number; approved: boolean; createdAt: string;
}

interface Listing {
  id: string; name: string; county: string; beds: number; available: boolean;
  childrenAllowed: boolean; maxMonths: number; phone: string;
}

interface Voucher {
  id: string; caseRef: string; expenseType: string; amountRequested: number;
  vendorName: string; status: string; createdAt: string;
}

interface Impact {
  totalSessions: number; byType: Record<string, number>;
  partnerOrgsCount: number; activeListings: number;
  vouchersRequested: number; vouchersApproved: number;
}

const SERVICE_TYPES = ["safety-plan","housing-assessment","benefits-bridge","legal-navigation","employment","housing-placement","voucher-request","peer-mentor","housing-finder"];
const EXPENSE_TYPES = ["security-deposit","first-month-rent","utility-deposit","furniture","application-fee","other"];

export default function PartnerPortalPage() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [showRegForm, setShowRegForm] = useState(false);
  const [showListingForm, setShowListingForm] = useState(false);
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [logType, setLogType] = useState("");

  const { data: org, isLoading: orgLoading } = useQuery<PartnerOrg | null>({
    queryKey: ["/api/safe-passage/partner/me"],
    enabled: isAuthenticated,
  });

  const { data: listings = [], isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: ["/api/safe-passage/listings"],
    enabled: isAuthenticated,
  });

  const { data: vouchers = [], isLoading: vouchersLoading } = useQuery<Voucher[]>({
    queryKey: ["/api/safe-passage/vouchers"],
    enabled: isAuthenticated,
  });

  const { data: impact } = useQuery<Impact>({
    queryKey: ["/api/safe-passage/impact"],
    enabled: isAuthenticated,
  });

  const registerMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/safe-passage/partner/register", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/safe-passage/partner/me"] }); setShowRegForm(false); toast({ title: "Registration submitted", description: "We'll review and approve your account shortly." }); },
    onError: () => toast({ title: "Error", description: "Registration failed. Please try again.", variant: "destructive" }),
  });

  const listingMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/safe-passage/listings", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/safe-passage/listings"] }); setShowListingForm(false); toast({ title: "Listing submitted" }); },
    onError: () => toast({ title: "Error submitting listing", variant: "destructive" }),
  });

  const voucherMut = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/safe-passage/vouchers", data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/safe-passage/vouchers"] }); setShowVoucherForm(false); toast({ title: "Voucher request submitted" }); },
    onError: () => toast({ title: "Error submitting request", variant: "destructive" }),
  });

  const logMut = useMutation({
    mutationFn: (serviceType: string) => apiRequest("POST", "/api/safe-passage/partner/log", { serviceType }),
    onSuccess: () => { setLogType(""); toast({ title: "Service logged" }); },
  });

  if (authLoading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>;

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <Card className="max-w-sm w-full">
        <CardContent className="p-6 text-center space-y-4">
          <Users className="h-10 w-10 text-teal-600 mx-auto" />
          <h1 className="font-bold text-lg">Partner Organization Portal</h1>
          <p className="text-sm text-slate-500">Sign in to manage your housing listings, authorize vouchers, and log services.</p>
          <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" onClick={() => navigate("/api/login")} data-testid="button-login">
            Sign In to Continue
          </Button>
          <Link href="/safe-passage"><span className="text-xs text-slate-400 underline cursor-pointer block">← Back to Safe Passage</span></Link>
        </CardContent>
      </Card>
    </div>
  );

  function RegForm() {
    const [form, setForm] = useState({ orgName: "", orgType: "nonprofit", contactName: "", contactEmail: "", phone: "", county: "Travis", mission: "", yearsServingDvSa: 0 });
    return (
      <div className="space-y-3 mt-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
        <h3 className="font-semibold text-sm">Register Your Organization</h3>
        {[["orgName","Organization legal name"],["contactName","Your name"],["contactEmail","Contact email"],["phone","Phone number"]].map(([k,l]) => (
          <div key={k}><Label className="text-xs">{l}</Label><Input value={(form as any)[k]} onChange={e => setForm(f => ({...f,[k]:e.target.value}))} className="text-sm mt-1" data-testid={`input-reg-${k}`} /></div>
        ))}
        <div><Label className="text-xs">Mission statement</Label><Textarea rows={2} value={form.mission} onChange={e => setForm(f => ({...f,mission:e.target.value}))} className="text-sm mt-1 resize-none" /></div>
        <div><Label className="text-xs">Years serving DV/SA survivors</Label><Input type="number" value={form.yearsServingDvSa} onChange={e => setForm(f => ({...f,yearsServingDvSa:parseInt(e.target.value)||0}))} className="text-sm mt-1 w-24" /></div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={() => registerMut.mutate(form)} disabled={registerMut.isPending} data-testid="button-reg-submit">
            {registerMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Submit Registration
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowRegForm(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  function ListingForm() {
    const [form, setForm] = useState({ name:"", address:"", county:"Travis", zipCode:"", type:"site-based", beds:1, childrenAllowed:true, maxChildAge:null as number|null, petsAllowed:false, wheelchairAccessible:false, deafAccessible:false, languages:["English"], maxMonths:12, onSiteServices:[] as string[], phone:"", applyUrl:"", notes:"" });
    return (
      <div className="space-y-3 mt-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
        <h3 className="font-semibold text-sm">Add Housing Unit</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Unit/program name</Label><Input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="text-sm mt-1" data-testid="input-listing-name" /></div>
          <div><Label className="text-xs">County</Label><Input value={form.county} onChange={e => setForm(f=>({...f,county:e.target.value}))} className="text-sm mt-1" /></div>
          <div><Label className="text-xs">Beds</Label><Input type="number" value={form.beds} onChange={e => setForm(f=>({...f,beds:parseInt(e.target.value)||1}))} className="text-sm mt-1" /></div>
          <div><Label className="text-xs">Max months</Label><Input type="number" value={form.maxMonths} onChange={e => setForm(f=>({...f,maxMonths:parseInt(e.target.value)||12}))} className="text-sm mt-1" /></div>
          <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} className="text-sm mt-1" /></div>
          <div><Label className="text-xs">Apply URL (optional)</Label><Input value={form.applyUrl} onChange={e => setForm(f=>({...f,applyUrl:e.target.value}))} className="text-sm mt-1" /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[{label:"Children allowed",key:"childrenAllowed"},{label:"Pets allowed",key:"petsAllowed"},{label:"Wheelchair accessible",key:"wheelchairAccessible"},{label:"Deaf accessible",key:"deafAccessible"}].map(f => (
            <div key={f.key} className="flex items-center justify-between p-2 border border-slate-200 dark:border-slate-700 rounded-lg">
              <Label className="text-xs">{f.label}</Label>
              <Switch checked={(form as any)[f.key]} onCheckedChange={v => setForm(p => ({...p,[f.key]:v}))} />
            </div>
          ))}
        </div>
        <div><Label className="text-xs">Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} className="text-sm mt-1 resize-none" /></div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => listingMut.mutate(form)} disabled={listingMut.isPending} data-testid="button-listing-submit">
            {listingMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Submit Listing
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowListingForm(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  function VoucherForm() {
    const [form, setForm] = useState({ caseRef:"", expenseType:"security-deposit", amountRequested:0, vendorName:"", notes:"" });
    return (
      <div className="space-y-3 mt-4 p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
        <h3 className="font-semibold text-sm">New Voucher Request</h3>
        <p className="text-xs text-slate-500">Use your internal case reference — no client names in this system.</p>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Your case reference #</Label><Input value={form.caseRef} onChange={e => setForm(f=>({...f,caseRef:e.target.value}))} className="text-sm mt-1" data-testid="input-case-ref" /></div>
          <div><Label className="text-xs">Expense type</Label>
            <Select value={form.expenseType} onValueChange={v => setForm(f=>({...f,expenseType:v}))}>
              <SelectTrigger className="text-sm mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>{EXPENSE_TYPES.map(t => <SelectItem key={t} value={t}>{t.replace(/-/g," ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Amount requested ($)</Label><Input type="number" value={form.amountRequested} onChange={e => setForm(f=>({...f,amountRequested:parseFloat(e.target.value)||0}))} className="text-sm mt-1" /></div>
          <div><Label className="text-xs">Vendor/payee name</Label><Input value={form.vendorName} onChange={e => setForm(f=>({...f,vendorName:e.target.value}))} className="text-sm mt-1" /></div>
        </div>
        <div><Label className="text-xs">Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} className="text-sm mt-1 resize-none" /></div>
        <div className="flex gap-2">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={() => voucherMut.mutate(form)} disabled={voucherMut.isPending} data-testid="button-voucher-submit">
            {voucherMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null} Submit Request
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowVoucherForm(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link href="/safe-passage" className="text-xs text-slate-500 hover:text-teal-600 flex items-center gap-1 mb-6"><ChevronLeft className="h-3 w-3" /> Back to Safe Passage</Link>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 dark:text-slate-50">Partner Portal</h1>
              <p className="text-xs text-slate-500">{org?.orgName || "Register your organization below"}</p>
            </div>
          </div>
          {org && <Badge className={org.approved ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"}>{org.approved ? "Approved" : "Pending approval"}</Badge>}
        </div>

        {orgLoading ? <div className="text-center py-8 text-slate-400"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
        : !org ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Register your organization to submit housing listings, authorize voucher payments, and log services delivered to survivors. Free — no cost to join the network.</p>
              {!showRegForm ? <Button onClick={() => setShowRegForm(true)} className="bg-teal-600 hover:bg-teal-700 text-white" data-testid="button-start-registration"><Plus className="h-4 w-4 mr-2" />Register My Organization</Button> : <RegForm />}
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="listings">
            <TabsList className="mb-4 grid grid-cols-4 w-full">
              <TabsTrigger value="listings" data-testid="tab-listings"><Building2 className="h-3.5 w-3.5 mr-1.5" />Housing Units</TabsTrigger>
              <TabsTrigger value="vouchers" data-testid="tab-vouchers"><DollarSign className="h-3.5 w-3.5 mr-1.5" />Vouchers</TabsTrigger>
              <TabsTrigger value="log" data-testid="tab-log"><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Log Service</TabsTrigger>
              <TabsTrigger value="impact" data-testid="tab-impact"><BarChart3 className="h-3.5 w-3.5 mr-1.5" />Impact</TabsTrigger>
            </TabsList>

            <TabsContent value="listings">
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between">
                  <CardTitle className="text-base">Housing Units</CardTitle>
                  {org.approved && <Button size="sm" onClick={() => setShowListingForm(s => !s)} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="button-add-listing"><Plus className="h-3.5 w-3.5 mr-1" />Add Unit</Button>}
                </CardHeader>
                <CardContent>
                  {!org.approved && <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg mb-4"><AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" /><p className="text-xs text-amber-800 dark:text-amber-200">Your account is pending approval. Once approved, you can submit housing listings.</p></div>}
                  {showListingForm && <ListingForm />}
                  {listingsLoading ? <div className="text-center py-4 text-slate-400"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
                  : listings.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">No listings yet. Click "Add Unit" to submit your first.</p>
                  : listings.map(l => (
                    <div key={l.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg mb-2">
                      <div><p className="text-sm font-medium text-slate-800 dark:text-slate-200">{l.name}</p><p className="text-xs text-slate-500">{l.county} · {l.beds} beds · {l.maxMonths} months · {l.childrenAllowed ? "Children OK" : "Adults only"}</p></div>
                      <Badge className={l.available ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : "bg-slate-100 text-slate-600"}>{l.available ? "Available" : "Full"}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vouchers">
              <Card>
                <CardHeader className="pb-3 flex-row items-center justify-between">
                  <CardTitle className="text-base">Voucher Requests</CardTitle>
                  {org.approved && <Button size="sm" onClick={() => setShowVoucherForm(s => !s)} className="bg-amber-600 hover:bg-amber-700 text-white" data-testid="button-add-voucher"><Plus className="h-3.5 w-3.5 mr-1" />New Request</Button>}
                </CardHeader>
                <CardContent>
                  {showVoucherForm && <VoucherForm />}
                  {vouchersLoading ? <div className="text-center py-4"><Loader2 className="h-4 w-4 animate-spin mx-auto text-slate-400" /></div>
                  : vouchers.length === 0 ? <p className="text-sm text-slate-400 text-center py-6">No voucher requests yet.</p>
                  : vouchers.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Case {v.caseRef} · {v.expenseType.replace(/-/g," ")}</p>
                        <p className="text-xs text-slate-500">${v.amountRequested.toLocaleString()} · {v.vendorName}</p>
                      </div>
                      <Badge className={v.status === "approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" : v.status === "denied" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}>{v.status}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="log">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300">Log a service delivered to a survivor. No client names — just the service type. This contributes to the platform's documented history.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {SERVICE_TYPES.map(t => (
                      <button key={t} onClick={() => setLogType(t)}
                        className={`p-2.5 rounded-lg border text-xs text-left transition-colors ${logType === t ? "border-teal-400 bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 font-medium" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-teal-300"}`}
                        data-testid={`service-type-${t}`}>{t.replace(/-/g," ")}</button>
                    ))}
                  </div>
                  <Button className="w-full bg-teal-600 hover:bg-teal-700 text-white" disabled={!logType || logMut.isPending} onClick={() => logMut.mutate(logType)} data-testid="button-log-service">
                    {logMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}Log Service
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="impact">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-50">Platform Impact (All Partners)</h3>
                  {impact && (
                    <div className="grid grid-cols-2 gap-3">
                      {[["Total sessions", impact.totalSessions], ["Partner orgs", impact.partnerOrgsCount], ["Active listings", impact.activeListings], ["Vouchers submitted", impact.vouchersRequested]].map(([k,v]) => (
                        <div key={k as string} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-center">
                          <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">{v}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{k}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-400">This data supports TCAF's documented history of effective work — required for OVW and VOCA grant eligibility. Every service logged counts.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
