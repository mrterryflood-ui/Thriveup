import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function FunderDashboardPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/funder", shareToken, "dashboard"],
    queryFn: async () => {
      const res = await fetch(`/api/funder/${shareToken}/dashboard`);
      if (!res.ok) throw new Error("Dashboard not found");
      return res.json();
    },
    enabled: !!shareToken,
  });

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  if (error || !data)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-destructive">Dashboard not found or unavailable.</p>
      </div>
    );

  const { funder, metrics, byProgram, recentActivity } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-blue-950/20 dark:to-background p-4 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <Badge variant="outline" className="mb-2">
          {funder.type}
        </Badge>
        <h1 className="text-2xl font-bold">{funder.name} — Impact Dashboard</h1>
        <p className="text-muted-foreground text-sm">Community benefit outcomes tracked by TCAF</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Referrals", value: metrics.totalReferrals, color: "text-blue-600" },
          { label: "Enrolled", value: metrics.enrolled, color: "text-green-600" },
          { label: "Enrollment Rate", value: `${metrics.enrollmentRate}%`, color: "text-purple-600" },
          {
            label: "Est. Annual Value",
            value: `$${(metrics.valueUnlocked || 0).toLocaleString()}`,
            color: "text-emerald-600",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {byProgram?.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">By Program</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-left border-b">
                  <th className="pb-2">Program</th>
                  <th className="pb-2 text-right">Referrals</th>
                  <th className="pb-2 text-right">Enrolled</th>
                  <th className="pb-2 text-right">Est. Value</th>
                </tr>
              </thead>
              <tbody>
                {byProgram.map((p: any) => (
                  <tr key={p.programCode} className="border-b last:border-0">
                    <td className="py-2 font-medium">{p.programCode}</td>
                    <td className="py-2 text-right">{p.referrals}</td>
                    <td className="py-2 text-right text-green-600">{p.enrolled}</td>
                    <td className="py-2 text-right">${(p.value || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {recentActivity?.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentActivity.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-sm border-b last:border-0 pb-2"
                >
                  <div>
                    <span className="font-medium">{r.programCode}</span>
                    <span className="text-muted-foreground mx-2">→</span>
                    {r.orgName}
                  </div>
                  <Badge
                    variant={r.status === "enrolled" ? "default" : "outline"}
                    className="text-xs"
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {metrics.totalReferrals === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p className="text-sm">
              No referrals tracked yet. Referrals will appear here as CHWs connect clients to
              programs.
            </p>
          </CardContent>
        </Card>
      )}

      <footer className="text-center mt-8 text-xs text-muted-foreground">
        Powered by{" "}
        <a
          href="https://thrivingcommunitiesforall.com"
          className="underline"
          target="_blank"
          rel="noopener"
        >
          TCAF — Thriving Communities for All
        </a>
      </footer>
    </div>
  );
}
