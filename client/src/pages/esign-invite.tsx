import { useRef, useState, useCallback } from "react";
import { useRoute, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, PenTool, AlertTriangle, Loader2, FileText } from "lucide-react";

interface InviteDoc {
  id: string;
  documentType: string;
  documentTitle: string;
  documentContext: string | null;
  recipientName: string;
  recipientOrg: string | null;
  status: string;
  signedAt: string | null;
  expiresAt: string | null;
}

/**
 * Public external-invitee signing page — NO session required. Reads the
 * per-document token from the query string and calls the token-scoped public
 * endpoints. Scoped to exactly the one document the token belongs to.
 */
export default function ESignInvitePage() {
  const { toast } = useToast();
  const [, params] = useRoute("/esign/invite/:id");
  const search = useSearch();
  const token = new URLSearchParams(search).get("token") ?? "";
  const id = params?.id ?? "";

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signed, setSigned] = useState(false);

  const { data: doc, isLoading, error } = useQuery<InviteDoc>({
    queryKey: [`/api/esign/invite/${id}`, token],
    queryFn: async () => {
      const res = await fetch(`/api/esign/invite/${id}?token=${encodeURIComponent(token)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Unable to load document (${res.status})`);
      }
      return res.json();
    },
    enabled: !!id && !!token,
    retry: false,
  });

  const signMutation = useMutation({
    mutationFn: async (signatureData: string) => {
      const res = await fetch(`/api/esign/invite/${id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureData, token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to sign (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      setSigned(true);
      toast({ title: "Signed", description: "Thank you — your signature has been recorded." });
    },
    onError: (err: Error) => {
      toast({ title: "Could not sign", description: err.message, variant: "destructive" });
    },
  });

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
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
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e293b";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => setIsDrawing(false), []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSign = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    signMutation.mutate(canvas.toDataURL("image/png"));
  };

  if (!id || !token) {
    return (
      <div className="container max-w-2xl py-16 px-4">
        <Card className="border-2 border-amber-300">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" aria-hidden="true" />
            <h1 className="text-xl font-bold" data-testid="text-invite-invalid">Invalid signing link</h1>
            <p className="text-sm text-muted-foreground">This link is missing its signing token. Please use the exact link you were sent.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl py-12 px-4 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="container max-w-2xl py-16 px-4">
        <Card className="border-2 border-red-300">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <AlertTriangle className="mx-auto h-8 w-8 text-red-500" aria-hidden="true" />
            <h1 className="text-xl font-bold" data-testid="text-invite-error">This signing link isn't valid</h1>
            <p className="text-sm text-muted-foreground">{(error as Error)?.message || "The link may be invalid or expired."}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const alreadySigned = signed || doc.status === "signed";

  return (
    <div className="container max-w-2xl py-10 px-4 space-y-6" data-testid="esign-invite-page">
      <div className="flex items-center gap-2">
        <FileText className="h-6 w-6 text-indigo-600" aria-hidden="true" />
        <div>
          <h1 className="text-2xl font-bold">{doc.documentTitle}</h1>
          <p className="text-sm text-muted-foreground">
            For {doc.recipientName}{doc.recipientOrg ? ` (${doc.recipientOrg})` : ""}
          </p>
        </div>
      </div>

      {doc.documentContext && (
        <Card>
          <CardHeader><CardTitle className="text-base">Document</CardTitle></CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm text-muted-foreground max-h-96 overflow-auto" data-testid="text-invite-context">
              {doc.documentContext}
            </div>
          </CardContent>
        </Card>
      )}

      {alreadySigned ? (
        <Card className="border-2 border-emerald-300">
          <CardContent className="pt-8 pb-8 text-center space-y-3">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" aria-hidden="true" />
            <h2 className="text-lg font-bold" data-testid="text-invite-signed">Document signed</h2>
            <p className="text-sm text-muted-foreground">Thank you. This document has been signed and recorded.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Your signature</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <canvas
              ref={canvasRef}
              width={500}
              height={160}
              className="w-full border rounded-md bg-white touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              data-testid="canvas-invite-signature"
            />
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={clearSignature} data-testid="button-invite-clear">Clear</Button>
              <Button
                onClick={handleSign}
                disabled={signMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                data-testid="button-invite-sign"
              >
                {signMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <PenTool className="h-4 w-4 mr-2" />}
                {signMutation.isPending ? "Signing..." : "Sign Document"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              By signing, you acknowledge you have read and agree to the document above. Your signature, IP address, and timestamp will be recorded.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
