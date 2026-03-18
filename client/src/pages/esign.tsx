import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, PenTool, Send, CheckCircle2, Clock, XCircle,
  Plus, Copy, Download, Loader2, Users, Building2,
  AlertTriangle, ExternalLink, Sparkles, Handshake, Shield,
  Eye, RefreshCw,
} from "lucide-react";
import type { DocumentSignature } from "@shared/schema";

const DOC_TYPES = [
  { value: "mou", label: "Memorandum of Understanding (MOU)", icon: Handshake },
  { value: "letter-of-support", label: "Letter of Support", icon: FileText },
  { value: "partnership-agreement", label: "Partnership Agreement", icon: Users },
  { value: "data-sharing", label: "Data Sharing Agreement", icon: Shield },
  { value: "subcontract", label: "Subcontractor Agreement", icon: Building2 },
];

const GRANT_OPTIONS = [
  { value: "dfc", label: "Drug-Free Communities (DFC)" },
  { value: "wioa", label: "WIOA Title I Youth" },
  { value: "nba-foundation", label: "NBA Foundation" },
  { value: "st-davids", label: "St. David's Foundation" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "Awaiting Signature", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", icon: Clock },
  signed: { label: "Signed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: CheckCircle2 },
  revoked: { label: "Revoked", color: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", icon: XCircle },
};

export default function ESignPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("documents");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSignModal, setShowSignModal] = useState<string | null>(null);
  const [showTemplateGenerator, setShowTemplateGenerator] = useState(false);

  const [newDoc, setNewDoc] = useState({
    documentType: "",
    documentTitle: "",
    documentContext: "",
    recipientName: "",
    recipientEmail: "",
    recipientOrg: "",
    grantId: "",
  });

  const [templateType, setTemplateType] = useState("");
  const [templateGrantName, setTemplateGrantName] = useState("");
  const [templatePartnerOrg, setTemplatePartnerOrg] = useState("");
  const [templatePartnerContact, setTemplatePartnerContact] = useState("");
  const [generatedTemplate, setGeneratedTemplate] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { data: documents = [], isLoading } = useQuery<DocumentSignature[]>({
    queryKey: ["/api/esign/documents"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof newDoc) => {
      const res = await apiRequest("POST", "/api/esign/create", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esign/documents"] });
      setShowCreateForm(false);
      setNewDoc({ documentType: "", documentTitle: "", documentContext: "", recipientName: "", recipientEmail: "", recipientOrg: "", grantId: "" });
      toast({ title: "Signature request created", description: "Share the signing link with your recipient." });
    },
    onError: () => {
      toast({ title: "Failed to create request", variant: "destructive" });
    },
  });

  const signMutation = useMutation({
    mutationFn: async ({ id, signatureData }: { id: string; signatureData: string }) => {
      const res = await apiRequest("POST", `/api/esign/sign/${id}`, { signatureData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esign/documents"] });
      setShowSignModal(null);
      toast({ title: "Document signed", description: "The signature has been recorded." });
    },
    onError: () => {
      toast({ title: "Failed to sign", variant: "destructive" });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/esign/revoke/${id}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/esign/documents"] });
      toast({ title: "Request revoked" });
    },
  });

  const templateMutation = useMutation({
    mutationFn: async (data: { templateType: string; grantName: string; partnerOrg: string; partnerContact: string }) => {
      const res = await apiRequest("POST", "/api/esign/generate-template", data);
      return res.json();
    },
    onSuccess: (data) => {
      setGeneratedTemplate(data.content);
      toast({ title: "Template generated", description: "Review and customize the document before sending for signature." });
    },
    onError: () => {
      toast({ title: "Failed to generate template", variant: "destructive" });
    },
  });

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  }, []);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = (docId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureData = canvas.toDataURL("image/png");
    signMutation.mutate({ id: docId, signatureData });
  };

  const copySignLink = (docId: string) => {
    const url = `${window.location.origin}/esign/${docId}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Share this link with the signer." });
  };

  const pendingDocs = documents.filter((d) => d.status === "pending");
  const signedDocs = documents.filter((d) => d.status === "signed");
  const revokedDocs = documents.filter((d) => d.status === "revoked");

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-esign-title">E-Sign Center</h1>
          <p className="text-muted-foreground mt-1">Create, send, and track document signatures across all grants and partnerships</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTemplateGenerator(true)} variant="outline" data-testid="button-generate-template">
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Document
          </Button>
          <Button onClick={() => setShowCreateForm(true)} data-testid="button-new-signature" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Signature Request
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-pending-count">{pendingDocs.length}</p>
              <p className="text-xs text-muted-foreground">Awaiting Signature</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-signed-count">{signedDocs.length}</p>
              <p className="text-xs text-muted-foreground">Signed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900/40">
              <FileText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-total-count">{documents.length}</p>
              <p className="text-xs text-muted-foreground">Total Documents</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {showTemplateGenerator && (
        <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-bold">AI Document Generator</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setShowTemplateGenerator(false); setGeneratedTemplate(""); }}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label>Document Type</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger data-testid="select-template-type"><SelectValue placeholder="Select document type" /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Related Grant</Label>
                  <Select value={templateGrantName} onValueChange={setTemplateGrantName}>
                    <SelectTrigger data-testid="select-template-grant"><SelectValue placeholder="Select grant" /></SelectTrigger>
                    <SelectContent>
                      {GRANT_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.label}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Partner Organization</Label>
                  <Input
                    value={templatePartnerOrg}
                    onChange={(e) => setTemplatePartnerOrg(e.target.value)}
                    placeholder="e.g., Austin ISD"
                    data-testid="input-template-partner-org"
                  />
                </div>
                <div>
                  <Label>Partner Contact Name</Label>
                  <Input
                    value={templatePartnerContact}
                    onChange={(e) => setTemplatePartnerContact(e.target.value)}
                    placeholder="e.g., Dr. Jane Smith"
                    data-testid="input-template-partner-contact"
                  />
                </div>
                <Button
                  onClick={() => templateMutation.mutate({
                    templateType,
                    grantName: templateGrantName,
                    partnerOrg: templatePartnerOrg,
                    partnerContact: templatePartnerContact,
                  })}
                  disabled={!templateType || templateMutation.isPending}
                  className="w-full"
                  data-testid="button-generate-template-submit"
                >
                  {templateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  {templateMutation.isPending ? "Generating..." : "Generate Document"}
                </Button>
              </div>
              <div>
                {generatedTemplate ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Generated Document</Label>
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(generatedTemplate); toast({ title: "Copied to clipboard" }); }}>
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                    </div>
                    <Textarea
                      value={generatedTemplate}
                      onChange={(e) => setGeneratedTemplate(e.target.value)}
                      className="min-h-[300px] text-sm font-mono"
                      data-testid="textarea-generated-template"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setNewDoc({
                          ...newDoc,
                          documentType: templateType,
                          documentTitle: `${DOC_TYPES.find((t) => t.value === templateType)?.label || templateType} — ${templatePartnerOrg || "Partner"}`,
                          documentContext: generatedTemplate,
                          recipientName: templatePartnerContact,
                          recipientOrg: templatePartnerOrg,
                        });
                        setShowCreateForm(true);
                        setShowTemplateGenerator(false);
                        setGeneratedTemplate("");
                      }}
                      data-testid="button-send-for-signature"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send for Signature
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    <p>Select a document type and click Generate to create a ready-to-sign document</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <Card className="border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/20">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold">New Signature Request</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <Label>Document Type</Label>
                  <Select value={newDoc.documentType} onValueChange={(v) => setNewDoc({ ...newDoc, documentType: v })}>
                    <SelectTrigger data-testid="select-doc-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {DOC_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Document Title</Label>
                  <Input
                    value={newDoc.documentTitle}
                    onChange={(e) => setNewDoc({ ...newDoc, documentTitle: e.target.value })}
                    placeholder="e.g., MOU — Austin ISD Coalition Partnership"
                    data-testid="input-doc-title"
                  />
                </div>
                <div>
                  <Label>Related Grant (optional)</Label>
                  <Select value={newDoc.grantId} onValueChange={(v) => setNewDoc({ ...newDoc, grantId: v })}>
                    <SelectTrigger data-testid="select-doc-grant"><SelectValue placeholder="Select grant" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific grant</SelectItem>
                      {GRANT_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Recipient Name</Label>
                  <Input
                    value={newDoc.recipientName}
                    onChange={(e) => setNewDoc({ ...newDoc, recipientName: e.target.value })}
                    placeholder="Full name of signer"
                    data-testid="input-recipient-name"
                  />
                </div>
                <div>
                  <Label>Recipient Email (optional)</Label>
                  <Input
                    value={newDoc.recipientEmail}
                    onChange={(e) => setNewDoc({ ...newDoc, recipientEmail: e.target.value })}
                    placeholder="email@example.com"
                    data-testid="input-recipient-email"
                  />
                </div>
                <div>
                  <Label>Recipient Organization (optional)</Label>
                  <Input
                    value={newDoc.recipientOrg}
                    onChange={(e) => setNewDoc({ ...newDoc, recipientOrg: e.target.value })}
                    placeholder="e.g., Austin ISD"
                    data-testid="input-recipient-org"
                  />
                </div>
              </div>
            </div>
            {newDoc.documentContext && (
              <div>
                <Label>Document Content</Label>
                <Textarea
                  value={newDoc.documentContext}
                  onChange={(e) => setNewDoc({ ...newDoc, documentContext: e.target.value })}
                  className="min-h-[150px] text-sm"
                  data-testid="textarea-doc-context"
                />
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
              <Button
                onClick={() => createMutation.mutate(newDoc)}
                disabled={!newDoc.documentType || !newDoc.documentTitle || !newDoc.recipientName || createMutation.isPending}
                data-testid="button-create-signature"
              >
                {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                {createMutation.isPending ? "Creating..." : "Create & Send"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showSignModal && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenTool className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold">Sign Document</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSignModal(null)}>
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            {(() => {
              const doc = documents.find((d) => d.id === showSignModal);
              if (!doc) return null;
              return (
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border">
                    <p className="font-semibold">{doc.documentTitle}</p>
                    <p className="text-sm text-muted-foreground">For: {doc.recipientName} {doc.recipientOrg ? `(${doc.recipientOrg})` : ""}</p>
                  </div>
                  {doc.documentContext && (
                    <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border max-h-[200px] overflow-y-auto">
                      <p className="text-sm whitespace-pre-wrap">{doc.documentContext}</p>
                    </div>
                  )}
                  <div>
                    <Label>Draw Your Signature</Label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-950 mt-1">
                      <canvas
                        ref={canvasRef}
                        width={500}
                        height={150}
                        className="w-full cursor-crosshair touch-none"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        data-testid="canvas-signature"
                      />
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={clearSignature} data-testid="button-clear-signature">
                        <RefreshCw className="h-3 w-3 mr-1" /> Clear
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By signing, you acknowledge that you have read and agree to the document above. Your signature, IP address, and timestamp will be recorded.
                  </p>
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setShowSignModal(null)}>Cancel</Button>
                    <Button
                      onClick={() => handleSign(showSignModal)}
                      disabled={signMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      data-testid="button-submit-signature"
                    >
                      {signMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PenTool className="h-4 w-4 mr-2" />}
                      {signMutation.isPending ? "Signing..." : "Sign Document"}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents" data-testid="tab-all-docs">
            <FileText className="h-4 w-4 mr-1.5" />
            All Documents ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending">
            <Clock className="h-4 w-4 mr-1.5" />
            Pending ({pendingDocs.length})
          </TabsTrigger>
          <TabsTrigger value="signed" data-testid="tab-signed">
            <CheckCircle2 className="h-4 w-4 mr-1.5" />
            Signed ({signedDocs.length})
          </TabsTrigger>
        </TabsList>

        {["documents", "pending", "signed"].map((tab) => {
          const filteredDocs = tab === "documents" ? documents : tab === "pending" ? pendingDocs : signedDocs;
          return (
            <TabsContent key={tab} value={tab} className="space-y-3 mt-4">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isLoading && filteredDocs.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="font-medium">No documents yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tab === "pending" ? "No documents awaiting signature." : tab === "signed" ? "No documents have been signed yet." : "Create your first signature request or generate a document with AI."}
                    </p>
                    <Button className="mt-4" onClick={() => setShowCreateForm(true)} data-testid="button-create-first">
                      <Plus className="h-4 w-4 mr-2" /> Create Signature Request
                    </Button>
                  </CardContent>
                </Card>
              )}
              {filteredDocs.map((doc) => {
                const status = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending;
                const StatusIcon = status.icon;
                const docType = DOC_TYPES.find((t) => t.value === doc.documentType);
                const DocIcon = docType?.icon || FileText;
                const grantLabel = GRANT_OPTIONS.find((g) => g.value === doc.grantId)?.label;

                return (
                  <Card key={doc.id} className="hover:border-primary/30 transition-colors" data-testid={`doc-card-${doc.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 mt-0.5">
                            <DocIcon className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">{doc.documentTitle}</h4>
                              <Badge className={`text-[10px] ${status.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {docType?.label || doc.documentType} · To: {doc.recipientName}
                              {doc.recipientOrg && ` (${doc.recipientOrg})`}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              {grantLabel && <span className="text-purple-600 dark:text-purple-400">{grantLabel}</span>}
                              <span>Created {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : "N/A"}</span>
                              {doc.signedAt && <span className="text-emerald-600">Signed {new Date(doc.signedAt).toLocaleDateString()}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          {doc.status === "pending" && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => copySignLink(doc.id)} data-testid={`button-copy-link-${doc.id}`}>
                                <Copy className="h-3.5 w-3.5 mr-1" /> Copy Link
                              </Button>
                              <Button size="sm" onClick={() => setShowSignModal(doc.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white" data-testid={`button-sign-${doc.id}`}>
                                <PenTool className="h-3.5 w-3.5 mr-1" /> Sign
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => revokeMutation.mutate(doc.id)} data-testid={`button-revoke-${doc.id}`}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {doc.status === "signed" && (
                            <Button variant="outline" size="sm" onClick={() => copySignLink(doc.id)} data-testid={`button-verify-${doc.id}`}>
                              <Eye className="h-3.5 w-3.5 mr-1" /> Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
