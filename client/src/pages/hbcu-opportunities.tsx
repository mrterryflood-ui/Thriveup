import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EvidenceSummary } from "@/components/evidence-label";
import { ConsentDisclosure } from "@/components/consent-disclosure";

const institutions: [string, string, number, string][] = [
  ["Howard University", "DC", 1867, "https://howard.edu"], ["Spelman College", "GA", 1881, "https://spelman.edu"],
  ["Morehouse College", "GA", 1867, "https://morehouse.edu"], ["Tuskegee University", "AL", 1881, "https://tuskegee.edu"],
  ["Hampton University", "VA", 1868, "https://hamptonu.edu"], ["Florida A&M University", "FL", 1887, "https://famu.edu"],
  ["Texas Southern University", "TX", 1927, "https://tsu.edu"], ["Prairie View A&M University", "TX", 1876, "https://pvamu.edu"],
  ["Jackson State University", "MS", 1877, "https://jsums.edu"], ["Southern University and A&M College", "LA", 1880, "https://sus.edu"],
];

export default function HBCUOpportunitiesPage() {
  const [interest, setInterest] = useState("");
  return <main className="container mx-auto max-w-6xl space-y-10 px-4 py-10">
    <header className="max-w-3xl space-y-3"><h1 className="text-4xl font-bold">HBCU Opportunity Network</h1><p className="text-lg text-muted-foreground">Connecting historically Black colleges and universities with workforce, grant, and community partnerships across 50 states.</p></header>
    <section><h2 className="mb-4 text-2xl font-semibold">Featured institutions</h2><div className="grid gap-4 md:grid-cols-2">
      {institutions.map(([name, state, year, url]) => <Card key={name}><CardContent className="flex items-center justify-between gap-4 pt-6"><div><h3 className="font-semibold">{name}</h3><p className="text-sm text-muted-foreground">{state} · Founded {year}</p></div><a className="text-sm text-blue-600 hover:underline" href={url} target="_blank" rel="noreferrer">Visit site</a></CardContent></Card>)}
    </div></section>
    <section className="grid gap-4 md:grid-cols-3"><Card><CardHeader><CardTitle>Workforce partnerships</CardTitle></CardHeader><CardContent>Connect students and alumni with employers, apprenticeships, and career pathways aligned to regional demand.</CardContent></Card><Card><CardHeader><CardTitle>Grant partnerships</CardTitle></CardHeader><CardContent>Build collaborative proposals that expand institutional capacity and community-serving programs.</CardContent></Card><Card><CardHeader><CardTitle>Research partnerships</CardTitle></CardHeader><CardContent>Advance community-informed research, data sharing, and evidence that supports durable local solutions.</CardContent></Card></section>
    <section className="max-w-2xl space-y-4"><h2 className="text-2xl font-semibold">Start a partnership conversation</h2><ConsentDisclosure compact purpose="This inquiry helps the network route your partnership request." fields={[{ name: "Institution name", why: "To identify the institution represented.", required: true }, { name: "Contact email", why: "To respond to your inquiry.", required: true }, { name: "Partnership interest", why: "To connect you with the relevant partnership pathway.", required: true }]} sharing="Information is shared only with the HBCU Opportunity Network team for follow-up." withdrawal="Contact the network team to withdraw your inquiry." />
      <form className="space-y-4" onSubmit={(event) => event.preventDefault()}><div><Label htmlFor="institution">Institution name</Label><Input id="institution" required /></div><div><Label htmlFor="email">Contact email</Label><Input id="email" type="email" required /></div><div><Label>Partnership interest</Label><Select value={interest} onValueChange={setInterest}><SelectTrigger><SelectValue placeholder="Select an interest" /></SelectTrigger><SelectContent><SelectItem value="workforce">Workforce</SelectItem><SelectItem value="grant">Grant</SelectItem><SelectItem value="research">Research</SelectItem><SelectItem value="all">All</SelectItem></SelectContent></Select></div><Button type="submit">Submit inquiry</Button></form>
    </section>
    <EvidenceSummary claims={[{ value: null, unit: "", source: "IPEDS HBCU Classification + USDA 1890 Land-Grant Institutions", sourceId: "ipeds-institutions", asOfDate: null, geographyKey: null, confidence: "verified", decisionCaption: "Institutional classifications inform the network directory." }]} />
  </main>;
}