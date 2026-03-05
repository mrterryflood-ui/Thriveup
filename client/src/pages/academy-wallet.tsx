import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import AcademyWizard from "@/components/academy-wizard";
import { WIZARD_STEPS } from "@/lib/wizard-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  BarChart3,
  Send,
} from "lucide-react";

interface WalletData {
  balance: string;
  totalEarned: string;
  totalInvested: string;
  campusContributed: string;
}

interface Transaction {
  id: string;
  walletId: string;
  type: string;
  amount: string;
  description: string;
  category: string;
  createdAt: string | null;
}

function formatMoney(value: number): string {
  return `$${Math.abs(value).toFixed(2)}`;
}

function FundCampusSection({ campusContributed }: { campusContributed: string }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");

  const fundMutation = useMutation({
    mutationFn: async (fundAmount: number) => {
      await apiRequest("POST", "/api/academy/campus/fund", { amount: fundAmount });
    },
    onSuccess: () => {
      toast({ title: "Campus Funded", description: `You contributed ${formatMoney(Number(amount))} to your campus!` });
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/academy/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/campus"] });
    },
    onError: (error: Error) => {
      toast({ title: "Funding Failed", description: error.message, variant: "destructive" });
    },
  });

  const handleFund = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount greater than 0.", variant: "destructive" });
      return;
    }
    fundMutation.mutate(parsed);
  };

  return (
    <Card className="p-6" data-testid="section-fund-campus">
      <h3 className="font-semibold mb-3 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        Fund My Campus
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Current campus funding: <span className="font-medium" data-testid="text-campus-funding">{formatMoney(parseFloat(campusContributed) || 0)}</span>
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[150px]">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="pl-9"
            min="0"
            step="0.01"
            data-testid="input-fund-amount"
          />
        </div>
        <Button
          onClick={handleFund}
          disabled={fundMutation.isPending}
          data-testid="button-fund-campus"
        >
          <Send className="mr-2 h-4 w-4" />
          {fundMutation.isPending ? "Funding..." : "Fund"}
        </Button>
      </div>
    </Card>
  );
}

export default function AcademyWalletPage() {
  useEffect(() => { document.title = 'Wallet | AI Mastery Academy'; }, []);
  const [showFundSection, setShowFundSection] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ["/api/academy/wallet"],
  });

  const { data: transactions, isLoading: transactionsLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/academy/transactions"],
  });

  if (walletLoading || transactionsLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <Skeleton className="h-10 w-64 mb-1" />
        <Skeleton className="h-5 w-80 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-12 mt-4" />
        <Skeleton className="h-64 mt-4" />
      </div>
    );
  }

  if (!wallet) return null;

  const sortedTransactions = transactions
    ? [...transactions].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    : [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3" data-testid="text-wallet-title">
          <Wallet className="h-8 w-8 text-primary" />
          My Virtual Wallet
        </h1>
        <p className="text-muted-foreground" data-testid="text-wallet-subtitle">
          Track your earnings and investments
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5 border-primary/20" data-testid="card-balance">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Current Balance</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold" data-testid="text-balance">{formatMoney(parseFloat(wallet.balance) || 0)}</p>
        </Card>

        <Card className="p-5" data-testid="card-total-earned">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Total Earned</span>
            <div className="rounded-md p-1.5 bg-blue-100 dark:bg-blue-900/30">
              <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-earned">{formatMoney(parseFloat(wallet.totalEarned) || 0)}</p>
        </Card>

        <Card className="p-5" data-testid="card-total-invested">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Total Invested</span>
            <div className="rounded-md p-1.5 bg-rose-100 dark:bg-rose-900/30">
              <TrendingUp className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-invested">{formatMoney(parseFloat(wallet.totalInvested) || 0)}</p>
        </Card>

        <Card className="p-5" data-testid="card-campus-contributed">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Campus Contributed</span>
            <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
              <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-campus-contributed">{formatMoney(parseFloat(wallet.campusContributed) || 0)}</p>
        </Card>
      </div>

      <div className="flex items-center gap-3 mb-8 flex-wrap">
        <Link href="/academy/stocks">
          <Button variant="outline" data-testid="button-go-stocks">
            <BarChart3 className="mr-2 h-4 w-4" />
            Go to Stock Market
          </Button>
        </Link>
        <Button
          variant={showFundSection ? "default" : "outline"}
          onClick={() => setShowFundSection(!showFundSection)}
          data-testid="button-toggle-fund"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Fund My Campus
        </Button>
        <Link href="/academy/merch">
          <Button variant="outline" data-testid="button-view-merch">
            <ShoppingBag className="mr-2 h-4 w-4" />
            View Print Shop
          </Button>
        </Link>
      </div>

      {showFundSection && (
        <div className="mb-8">
          <FundCampusSection campusContributed={wallet.campusContributed} />
        </div>
      )}

      <Card className="p-6" data-testid="section-transactions">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Transaction History
        </h2>
        {sortedTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-transactions">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Date</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Type</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Amount</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Description</th>
                  <th className="pb-3 font-medium text-muted-foreground">Category</th>
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((tx) => {
                  const txAmount = parseFloat(tx.amount) || 0;
                  const isEarning = txAmount > 0;
                  return (
                    <tr key={tx.id} className="border-b last:border-0" data-testid={`row-transaction-${tx.id}`}>
                      <td className="py-3 pr-4 whitespace-nowrap text-muted-foreground">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          {isEarning ? (
                            <ArrowUpRight className="h-4 w-4 text-emerald-500 shrink-0" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4 text-red-500 shrink-0" />
                          )}
                          <span>{tx.type}</span>
                        </div>
                      </td>
                      <td className={`py-3 pr-4 font-medium whitespace-nowrap ${isEarning ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {isEarning ? "+" : "-"}{formatMoney(txAmount)}
                      </td>
                      <td className="py-3 pr-4">{tx.description}</td>
                      <td className="py-3">
                        <Badge variant="secondary" data-testid={`badge-category-${tx.id}`}>{tx.category}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Wallet className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No transactions yet. Start earning to see your history!</p>
          </div>
        )}
      </Card>
      <AcademyWizard wizardType="wallet" steps={WIZARD_STEPS["wallet"]} />
    </div>
  );
}
