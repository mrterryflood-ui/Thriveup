import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, Key, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";

const P = 11n;
const Q = 13n;
const N = P * Q;
const PHI = (P - 1n) * (Q - 1n);
const E = 7n;
const D = 103n;

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  let b = base % mod;
  let e = exp;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % mod;
    e >>= 1n;
    b = (b * b) % mod;
  }
  return result;
}

function encryptChar(c: number): number {
  return Number(modPow(BigInt(c), E, N));
}

function decryptNum(n: number): number {
  return Number(modPow(BigInt(n), D, N));
}

export function PubKeySim({ className }: { className?: string }) {
  const [plaintext, setPlaintext] = useState("hello");
  const [mode, setMode] = useState<"encrypt" | "decrypt">("encrypt");

  const codes = useMemo(() => {
    return plaintext.split("").map((ch) => ch.charCodeAt(0)).filter((c) => c > 0 && c < Number(N));
  }, [plaintext]);

  const ciphertext = useMemo(() => codes.map(encryptChar), [codes]);
  const recovered = useMemo(() => ciphertext.map(decryptNum).map((n) => String.fromCharCode(n)).join(""), [ciphertext]);

  const sampleChar = plaintext.length > 0 ? plaintext.charCodeAt(0) : 0;
  const sampleEnc = sampleChar > 0 && sampleChar < Number(N) ? encryptChar(sampleChar) : 0;
  const sampleDec = decryptNum(sampleEnc);

  return (
    <div className={cn("w-full", className)} data-testid="pubkey-sim">
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gradient-to-br from-violet-50 to-sky-50 dark:from-violet-950/30 dark:to-sky-950/20">
          <div className="rounded-lg border-2 border-emerald-500 bg-white dark:bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <Key className="w-4 h-4 text-emerald-600" />
              <span className="font-bold text-sm">PUBLIC KEY</span>
              <Badge variant="outline" className="text-[10px]">share with anyone</Badge>
            </div>
            <div className="text-xs font-mono space-y-1">
              <div>n = <span className="font-bold">{N.toString()}</span></div>
              <div>e = <span className="font-bold">{E.toString()}</span></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Used to lock (encrypt).</p>
          </div>

          <div className="rounded-lg border bg-white dark:bg-card p-3">
            <div className="text-xs text-muted-foreground mb-1">Behind the scenes</div>
            <div className="text-xs font-mono space-y-1">
              <div>p = {P.toString()}, q = {Q.toString()}</div>
              <div>n = p·q = {N.toString()}</div>
              <div>φ(n) = {PHI.toString()}</div>
              <div>e·d mod φ = {(E * D % PHI).toString()}</div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              p and q are kept secret — that's where the asymmetry comes from.
            </p>
          </div>

          <div className="rounded-lg border-2 border-rose-500 bg-white dark:bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-4 h-4 text-rose-600" />
              <span className="font-bold text-sm">PRIVATE KEY</span>
              <Badge variant="outline" className="text-[10px]">keep secret</Badge>
            </div>
            <div className="text-xs font-mono space-y-1">
              <div>n = <span className="font-bold">{N.toString()}</span></div>
              <div>d = <span className="font-bold">{D.toString()}</span></div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Used to unlock (decrypt).</p>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t">
          <label className="text-xs font-semibold text-muted-foreground">
            Type a short message (letters and numbers — each character must be &lt; {N.toString()})
          </label>
          <Input
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value.slice(0, 24))}
            className="mt-2 font-mono"
            data-testid="input-plaintext"
          />

          <div className="mt-4 flex gap-2">
            <Button
              size="sm"
              variant={mode === "encrypt" ? "default" : "outline"}
              onClick={() => setMode("encrypt")}
              data-testid="button-mode-encrypt"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              Encrypt with public key
            </Button>
            <Button
              size="sm"
              variant={mode === "decrypt" ? "default" : "outline"}
              onClick={() => setMode("decrypt")}
              data-testid="button-mode-decrypt"
            >
              <Unlock className="w-3.5 h-3.5 mr-1.5" />
              Decrypt with private key
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground mb-1">Plain</div>
              <div className="font-mono text-sm break-all" data-testid="text-plaintext">{plaintext || "—"}</div>
              <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                {codes.join(" ")}
              </div>
            </div>

            <div className={cn("rounded-md border p-3", mode === "encrypt" ? "bg-violet-100 dark:bg-violet-950/30 border-violet-400" : "bg-muted/30")}>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Encrypted (m<sup>e</sup> mod n)
              </div>
              <div className="font-mono text-xs break-all" data-testid="text-ciphertext">
                {ciphertext.join(" ") || "—"}
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Unlock className="w-3 h-3" /> Decrypted (c<sup>d</sup> mod n)
              </div>
              <div className="font-mono text-sm break-all" data-testid="text-recovered">{recovered || "—"}</div>
            </div>
          </div>

          {sampleChar > 0 && (
            <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/20 p-3">
              <div className="text-xs font-semibold text-amber-900 dark:text-amber-300 mb-1">
                Walking through one character: "{plaintext[0]}"
              </div>
              <div className="text-xs font-mono text-amber-900 dark:text-amber-300 space-y-0.5">
                <div>ASCII code: m = {sampleChar}</div>
                <div>Encrypt: c = m<sup>e</sup> mod n = {sampleChar}<sup>{E.toString()}</sup> mod {N.toString()} = <strong>{sampleEnc}</strong></div>
                <div>Decrypt: m = c<sup>d</sup> mod n = {sampleEnc}<sup>{D.toString()}</sup> mod {N.toString()} = <strong>{sampleDec}</strong> = "{String.fromCharCode(sampleDec)}"</div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className="rounded-md border p-3"><div className="font-semibold">Real RSA</div><div className="text-muted-foreground mt-1">Same math you're using here. Real keys use 2048-bit primes, not 11 and 13.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">One-way trick</div><div className="text-muted-foreground mt-1">Multiplying two huge primes is easy. Factoring the result back is impossibly slow.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">No shared password</div><div className="text-muted-foreground mt-1">You never exchange a secret. The public key is fine to publish.</div></div>
        <div className="rounded-md border p-3"><div className="font-semibold">Where you see it</div><div className="text-muted-foreground mt-1">HTTPS, SSH, Signal, every bank login. Quietly running the whole internet.</div></div>
      </div>
    </div>
  );
}
