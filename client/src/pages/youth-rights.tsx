import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, ShieldCheck, Bus, FileCheck, HeartHandshake, DollarSign, Phone, MessageCircle } from "lucide-react";
import { Link } from "wouter";

// Public "Know Your Rights" hub for youth. Content is served from
// /api/yhsi/program-guide, which is built ONLY from uploaded source documents
// (McKinney-Vento Quick Reference Aug 2024; ACF Chafee program page).

export default function YouthRightsPage() {
  const { data: guide, isLoading, error, refetch } = useQuery<any>({ queryKey: ["/api/yhsi/program-guide"] });

  return (
    <div className="container max-w-4xl py-8 px-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-rights-title">Know Your Rights</h1>
        <p className="text-muted-foreground max-w-prose">
          If you don't have a stable place to stay, or you're in foster care or aging out of it,
          federal law gives you real rights and real money for school, housing, and your future.
          Everything on this page comes from the actual law and official federal program documents —
          citations included, so you can show them to anyone who tells you no.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm" data-testid="button-ask-navigator">
            <Link href="/navigator"><MessageCircle className="mr-2 h-4 w-4" /> Ask the Navigator (private)</Link>
          </Button>
          <Button asChild size="sm" variant="outline" data-testid="button-voice-wall">
            <Link href="/youth-voice">Youth Voice Wall</Link>
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-destructive" data-testid="text-rights-error">Couldn't load the guide right now — this is a loading problem, not a rights problem. Your rights don't depend on this page working.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()} data-testid="button-rights-retry">Retry</Button>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs defaultValue="school" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="school" data-testid="tab-school">School Rights</TabsTrigger>
            <TabsTrigger value="money" data-testid="tab-money">Money for Your Future</TabsTrigger>
            <TabsTrigger value="checker" data-testid="tab-checker">What Am I Eligible For?</TabsTrigger>
          </TabsList>

          <TabsContent value="school" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Do these rights apply to me?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>{guide?.mckinneyVento?.whoQualifies?.summary}</p>
                <p className="text-muted-foreground">{guide?.mckinneyVento?.whoQualifies?.unaccompaniedYouth}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline">{guide?.mckinneyVento?.whoQualifies?.citation}</Badge>
                  <Badge variant="outline">{guide?.mckinneyVento?.whoQualifies?.unaccompaniedCitation}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  "Doubled up" counts. Couch surfing counts. A motel counts. You do not have to be
                  sleeping outside for these rights to apply.
                </p>
              </CardContent>
            </Card>
            <div className="grid gap-3 sm:grid-cols-2">
              {(guide?.mckinneyVento?.rights ?? []).map((r: any, i: number) => (
                <Card key={i} data-testid={`card-right-${i}`}>
                  <CardContent className="pt-4 pb-4 space-y-2">
                    <p className="font-semibold text-sm">{r.right}</p>
                    <p className="text-sm text-muted-foreground">{r.detail}</p>
                    <Badge variant="outline" className="text-xs">{r.citation}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="pt-4 pb-4 text-sm space-y-2">
                <p className="font-semibold flex items-center gap-2"><Phone className="h-4 w-4" /> Who do I talk to?</p>
                <p className="text-muted-foreground">
                  Every school district is required by law to have a <strong>homeless liaison</strong> whose
                  job is to help you. Ask the front office: "Who is the McKinney-Vento liaison?" If you're
                  in immediate danger or need somewhere to sleep tonight, the National Runaway Safeline is
                  1-800-786-2929 (call or text, 24/7).
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="money" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><HeartHandshake className="h-5 w-5" /> Chafee Program</CardTitle>
                <CardDescription>Support for youth in or formerly in foster care transitioning to adulthood</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{guide?.chafee?.description}</p>
                <p className="font-semibold">You may be eligible if you are:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  {(guide?.chafee?.eligibility ?? []).map((e: string, i: number) => <li key={i}>{e}</li>)}
                </ul>
                <p className="text-xs text-muted-foreground">{guide?.chafee?.age23Note}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5" /> Education & Training Voucher (ETV)</CardTitle>
                <CardDescription>Real money for college or job training</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{guide?.chafee?.etv?.description}</p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-md border p-3"><p className="text-xl font-bold" data-testid="text-etv-amount">$5,000</p><p className="text-xs text-muted-foreground">per year</p></div>
                  <div className="rounded-md border p-3"><p className="text-xl font-bold">to age 26</p><p className="text-xs text-muted-foreground">age limit</p></div>
                  <div className="rounded-md border p-3"><p className="text-xl font-bold">5 years</p><p className="text-xs text-muted-foreground">max total</p></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Plus: if you're an unaccompanied homeless youth, you file the FAFSA as an <strong>independent
                  student</strong> — no parent signature or parent income info needed. Your school liaison or a
                  shelter can give you the verification (42 U.S.C. §11432(g)(6)(A)(x)(III)).
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 text-sm space-y-2">
                <p className="font-semibold flex items-center gap-2"><FileCheck className="h-4 w-4" /> How to get it</p>
                <p className="text-muted-foreground">{guide?.chafee?.howToAccess}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checker">
            <EligibilityChecker guide={guide} />
          </TabsContent>
        </Tabs>
      )}
      <p className="text-xs text-muted-foreground">
        Sources: {(guide?.sources ?? []).map((s: any) => `${s.title} (${s.publisher})`).join(" · ")}
      </p>
    </div>
  );
}

// Client-side screener. Rules come directly from the source documents; this is
// guidance, not a determination — the child welfare agency / liaison decides.
function EligibilityChecker({ guide }: { guide: any }) {
  const [age, setAge] = useState<string>("");
  const [fosterStatus, setFosterStatus] = useState<string>("");
  const [housing, setHousing] = useState<string>("");
  const [withParent, setWithParent] = useState<string>("");
  const [careAfter14, setCareAfter14] = useState<string>("");

  const ageN = age === "" ? null : parseInt(age, 10);
  const results: Array<{ program: string; eligible: "likely" | "maybe" | "no"; why: string }> = [];

  const inCareOrFormer = fosterStatus !== "" && fosterStatus !== "never";
  const needsCareTiming = fosterStatus === "former" || fosterStatus === "adopted16";

  if (ageN !== null && fosterStatus && housing && withParent && (!needsCareTiming || careAfter14)) {
    // Foster-care-after-14 condition (source: ETV requires foster care
    // experience after age 14; Chafee "in care" band starts at 14).
    const careExperienceAfter14 =
      fosterStatus === "current" ? ageN >= 14 : careAfter14 === "yes";
    const unaccompanied = withParent === "no";

    // McKinney-Vento: based purely on housing situation (42 U.S.C. §11434a(2))
    if (housing === "unstable") {
      results.push({ program: "McKinney-Vento school rights", eligible: "likely", why: "Lacking a fixed, regular, adequate nighttime residence (including doubled-up, motels, shelters, cars) qualifies. 42 U.S.C. §11434a(2)." });
    } else {
      results.push({ program: "McKinney-Vento school rights", eligible: "no", why: "These rights apply while you lack stable housing (school-of-origin rights continue through the school year after you get permanent housing)." });
    }

    // Chafee (Kansas: to 21, since KS is not on the age-23 list in the source doc).
    // Source bands: youth IN care 14+; people in/formerly in care 18-21;
    // adoption/guardianship exit at 16+.
    if (!inCareOrFormer) {
      results.push({ program: "Chafee services", eligible: "no", why: "Chafee is for youth in or formerly in foster care." });
    } else if (fosterStatus === "current" && ageN >= 14) {
      results.push({ program: "Chafee services (Kansas)", eligible: "likely", why: "Youth in foster care ages 14 and older are eligible." });
    } else if (fosterStatus === "current" && ageN < 14) {
      results.push({ program: "Chafee services", eligible: "maybe", why: "Chafee starts at 14, but youth 'likely to remain in foster care until 18' can get help participating in age-appropriate activities." });
    } else if (fosterStatus === "adopted16" && ageN <= 21) {
      results.push({ program: "Chafee services (Kansas)", eligible: "likely", why: "Youth who left foster care through adoption or guardianship at age 16 or older are eligible." });
    } else if (fosterStatus === "former" && ageN >= 18 && ageN <= 21) {
      results.push({ program: "Chafee services (Kansas)", eligible: "likely", why: "Young people formerly in foster care, ages 18 to 21, are eligible in Kansas." });
    } else if (fosterStatus === "former" && ageN < 18) {
      results.push({ program: "Chafee services", eligible: "maybe", why: "The formerly-in-care band in the federal rules is ages 18-21; ask your child welfare agency what applies before 18." });
    } else if (ageN > 21 && ageN <= 23) {
      results.push({ program: "Chafee services", eligible: "maybe", why: "Kansas serves to age 21, but 31 states + DC + PR serve to 23 — if you live in one of those states, you may still qualify." });
    } else {
      results.push({ program: "Chafee services", eligible: "no", why: "Chafee ends at 21 (23 in some states)." });
    }

    // ETV: requires foster care experience AFTER age 14; up to 26, max 5 years.
    if (inCareOrFormer && ageN >= 14 && ageN <= 26 && careExperienceAfter14) {
      results.push({ program: "ETV — up to $5,000/yr for college or training", eligible: "likely", why: "Available up to age 26 (max 5 years total) for young adults who experienced foster care after age 14." });
    } else if (inCareOrFormer && ageN <= 26) {
      results.push({ program: "ETV", eligible: "maybe", why: "ETV requires foster care experience after age 14 — if that ends up applying to you, you may qualify up to age 26." });
    } else if (inCareOrFormer) {
      results.push({ program: "ETV", eligible: "no", why: "ETV ends at age 26." });
    }

    // FAFSA independent status: unaccompanied homeless youth only
    // (42 U.S.C. §11434a(6) + §11432(g)(6)(A)(x)(III)).
    if (housing === "unstable" && unaccompanied) {
      results.push({ program: "FAFSA independent student status", eligible: "likely", why: "Unaccompanied homeless youth (not in a parent/guardian's physical custody) file FAFSA without parent info. Your school liaison must give you verification. 42 U.S.C. §11432(g)(6)(A)(x)(III)." });
    } else if (housing === "unstable") {
      results.push({ program: "FAFSA independent student status", eligible: "maybe", why: "This applies to unaccompanied homeless youth — youth not in a parent or guardian's physical custody. Since you're with a parent/guardian, talk to your school liaison about your situation." });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Quick check</CardTitle>
        <CardDescription>
          Anonymous — nothing you pick here is saved or sent anywhere. This is guidance based on
          the federal rules, not an official determination.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Your age</Label>
            <Select value={age} onValueChange={setAge}>
              <SelectTrigger data-testid="select-checker-age"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 17 }, (_, i) => i + 12).map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
                <SelectItem value="29">Over 28</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Foster care</Label>
            <Select value={fosterStatus} onValueChange={setFosterStatus}>
              <SelectTrigger data-testid="select-checker-foster"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="current">I'm in foster care now</SelectItem>
                <SelectItem value="former">I was in foster care</SelectItem>
                <SelectItem value="adopted16">Adopted / guardianship at 16+</SelectItem>
                <SelectItem value="never">Never in foster care</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Housing right now</Label>
            <Select value={housing} onValueChange={setHousing}>
              <SelectTrigger data-testid="select-checker-housing"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unstable">Not stable (staying with others, motel, shelter, car, outside)</SelectItem>
                <SelectItem value="stable">Stable place to live</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Are you living with a parent or guardian?</Label>
            <Select value={withParent} onValueChange={setWithParent}>
              <SelectTrigger data-testid="select-checker-parent"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes, I'm with a parent/guardian</SelectItem>
                <SelectItem value="no">No, I'm on my own</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(fosterStatus === "former" || fosterStatus === "adopted16") && (
            <div className="space-y-1.5">
              <Label>Were you in foster care at any point after turning 14?</Label>
              <Select value={careAfter14} onValueChange={setCareAfter14}>
                <SelectTrigger data-testid="select-checker-after14"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No, only before 14</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {results.length > 0 && (
          <div className="space-y-2 pt-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-md border p-3" data-testid={`result-${i}`}>
                <Badge variant={r.eligible === "likely" ? "default" : r.eligible === "maybe" ? "secondary" : "outline"} className="mt-0.5 shrink-0">
                  {r.eligible === "likely" ? "Likely eligible" : r.eligible === "maybe" ? "Maybe" : "Not this one"}
                </Badge>
                <div>
                  <p className="text-sm font-medium">{r.program}</p>
                  <p className="text-xs text-muted-foreground">{r.why}</p>
                </div>
              </div>
            ))}
            <p className="text-xs text-muted-foreground pt-1">
              Next step: talk to your school's McKinney-Vento liaison, your local child welfare agency —
              or <Link href="/navigator" className="text-primary hover:underline">ask the Navigator</Link> and
              we'll help you figure out who to call.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
