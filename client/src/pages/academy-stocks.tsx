import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AcademyWizard from "@/components/academy-wizard";
import { WIZARD_STEPS } from "@/lib/wizard-data";
import { RiskDecisionDialog } from "@/components/risk-decision-dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  ShoppingCart,
  Users,
  Activity,
  Play,
  ArrowUpDown,
  Briefcase,
  Bot,
  User,
  Lightbulb,
} from "lucide-react";
import { Link } from "wouter";

interface Stock {
  id: string;
  symbol: string;
  name: string;
  sector: string;
  currentPrice: string;
  previousPrice: string;
  changePercent: string;
  priceHistory?: number[];
}

interface RawPortfolioItem {
  id: string;
  userId: string;
  stockId: string;
  shares: number;
  avgBuyPrice: string;
  createdAt: string | null;
}

interface CommunityPortfolioItem {
  id: string;
  stockId: string;
  shares: number;
  avgBuyPrice: string;
  strategy: string;
}

interface WalletData {
  balance: string;
}

const INVESTING_WISDOM = [
  { tip: "Warren Buffett bought his first stock at age 11. He says the best time to plant a tree was 20 years ago. The second best time is now.", source: "Warren Buffett" },
  { tip: "The stock market is a device for transferring money from the impatient to the patient. Real investing means holding through ups AND downs.", source: "Warren Buffett" },
  { tip: "Never put all your eggs in one basket. Spreading your investments across different stocks reduces your risk if one drops.", source: "Diversification Principle" },
  { tip: "A stock dropping 10% is not a reason to panic. Even the best companies have bad days. Look at the long-term trend, not today's price.", source: "Long-Term Investing" },
  { tip: "Before you buy a stock, ask: What does this company actually DO? If you cannot explain it simply, you do not understand it well enough to invest.", source: "Peter Lynch" },
  { tip: "Day trading is gambling in disguise. 90% of day traders lose money. Real wealth comes from buying good companies and holding them for years.", source: "Market Research" },
  { tip: "If someone promises guaranteed returns, walk away. No investment is guaranteed. The higher the promised return, the higher the risk of losing everything.", source: "Scam Prevention" },
  { tip: "Compound interest is the eighth wonder of the world. A penny doubled every day for 30 days becomes over $5 million. Time is your greatest asset.", source: "Albert Einstein" },
];

export default function AcademyStocksPage() {
  useEffect(() => { document.title = 'Stock Market | AI Mastery Academy'; }, []);
  const { toast } = useToast();
  const [tradingStock, setTradingStock] = useState<Stock | null>(null);
  const [tradeAction, setTradeAction] = useState<"buy" | "sell">("buy");
  const [tradeShares, setTradeShares] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStockForChart, setSelectedStockForChart] = useState<Stock | null>(null);
  const [wisdomIndex, setWisdomIndex] = useState(() => Math.floor(Math.random() * INVESTING_WISDOM.length));
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [pendingTrade, setPendingTrade] = useState<{stockId: string; action: "buy" | "sell"; shares: number} | null>(null);

  const { data: stocks, isLoading: stocksLoading } = useQuery<Stock[]>({
    queryKey: ["/api/academy/stocks"],
  });

  const { data: rawPortfolio, isLoading: portfolioLoading } = useQuery<RawPortfolioItem[]>({
    queryKey: ["/api/academy/portfolio"],
  });

  const { data: communityItems } = useQuery<CommunityPortfolioItem[]>({
    queryKey: ["/api/academy/community-portfolio"],
  });

  const { data: wallet } = useQuery<WalletData>({
    queryKey: ["/api/academy/wallet"],
  });

  const tradeMutation = useMutation({
    mutationFn: async (data: { stockId: string; action: "buy" | "sell"; shares: number }) => {
      const res = await apiRequest("POST", "/api/academy/stocks/trade", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/community-portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/wallet"] });
      setDialogOpen(false);
      setTradeShares(1);
      toast({
        title: "Trade Executed",
        description: `Successfully ${tradeAction === "buy" ? "bought" : "sold"} ${tradeShares} share(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Trade Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/academy/stocks/simulate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/stocks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/community-portfolio"] });
      toast({
        title: "Market Simulated",
        description: "Prices have been updated for a new trading day.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Simulation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openTradeDialog = (stock: Stock, action: "buy" | "sell") => {
    setTradingStock(stock);
    setTradeAction(action);
    setTradeShares(1);
    setDialogOpen(true);
  };

  const portfolio = (rawPortfolio && stocks) ? rawPortfolio.map(item => {
    const stock = stocks.find(s => s.id === item.stockId);
    const currentPrice = stock ? parseFloat(stock.currentPrice) || 0 : 0;
    const avgBuy = parseFloat(item.avgBuyPrice) || 0;
    const currentValue = currentPrice * item.shares;
    const costBasis = avgBuy * item.shares;
    const gainLoss = currentValue - costBasis;
    const gainLossPercent = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0;
    return {
      ...item,
      symbol: stock?.symbol || "???",
      name: stock?.name || "Unknown",
      currentPrice,
      avgBuyPriceNum: avgBuy,
      currentValue,
      gainLoss,
      gainLossPercent,
    };
  }).filter(item => item.shares > 0) : [];

  const communityStats = (() => {
    if (!communityItems || !stocks) return { totalValue: 0, stockCount: 0, performancePercent: 0 };
    let totalValue = 0;
    let totalCost = 0;
    for (const item of communityItems) {
      const stock = stocks.find(s => s.id === item.stockId);
      if (stock) {
        const currentPrice = parseFloat(stock.currentPrice) || 0;
        const avgBuy = parseFloat(item.avgBuyPrice) || 0;
        totalValue += currentPrice * item.shares;
        totalCost += avgBuy * item.shares;
      }
    }
    const performancePercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
    return { totalValue, stockCount: communityItems.length, performancePercent };
  })();

  const determineRiskLevel = (): "low" | "moderate" | "high" => {
    if (!tradingStock || !wallet) return "moderate";
    const totalCost = parseFloat(tradingStock.currentPrice) * tradeShares;
    const balance = parseFloat(wallet.balance) || 0;
    if (totalCost > balance * 0.5) return "high";
    if (totalCost > balance * 0.25) return "moderate";
    return "low";
  };

  const getTradeWarning = (): string => {
    if (!tradingStock || !wallet) return "Make sure you've thought this through.";
    const totalCost = parseFloat(tradingStock.currentPrice) * tradeShares;
    const balance = parseFloat(wallet.balance) || 0;
    if (tradeAction === "buy") {
      if (totalCost > balance * 0.5) return `This trade costs $${totalCost.toFixed(2)}, which is more than half your wallet balance of $${balance.toFixed(2)}. Putting most of your money into one stock is very risky. If the price drops, you could lose a lot.`;
      if (totalCost > balance * 0.25) return `This trade costs $${totalCost.toFixed(2)}, which is a significant chunk of your $${balance.toFixed(2)} balance. Consider whether you'd want some of that money available for other opportunities.`;
      return `You're about to spend $${totalCost.toFixed(2)} on ${tradeShares} share(s) of ${tradingStock.name}. Stock prices go up and down — make sure this is money you're okay with having tied up.`;
    }
    return `You're about to sell ${tradeShares} share(s) of ${tradingStock.name}. Remember, selling stocks held less than a year means higher capital gains taxes on any profit.`;
  };

  const totalMarketValue = stocks?.reduce((sum, s) => sum + (parseFloat(s.currentPrice) || 0) * 1000, 0) ?? 0;
  const portfolioValue = portfolio.reduce((sum, p) => sum + p.currentValue, 0);
  const walletBalance = parseFloat(wallet?.balance ?? "0") || 0;

  if (stocksLoading || portfolioLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-12 w-64 mb-2" />
        <Skeleton className="h-6 w-96 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64 mt-4" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1" data-testid="text-stock-market-title">
          Virtual Stock Market
        </h1>
        <p className="text-muted-foreground" data-testid="text-stock-market-subtitle">
          Learn investing in a safe environment - simulated money only
        </p>
      </div>

      <Card className="p-4 mb-6 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800" data-testid="card-investing-wisdom">
        <div className="flex items-start gap-3">
          <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30 shrink-0 mt-0.5">
            <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Investor Wisdom</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setWisdomIndex((prev) => (prev + 1) % INVESTING_WISDOM.length)}
                className="text-xs h-auto py-1 px-2 text-amber-700 dark:text-amber-400"
                data-testid="button-next-wisdom"
              >
                Next Tip
              </Button>
            </div>
            <p className="text-sm" data-testid="text-wisdom-tip">{INVESTING_WISDOM[wisdomIndex].tip}</p>
            <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
              <p className="text-xs text-muted-foreground" data-testid="text-wisdom-source">-- {INVESTING_WISDOM[wisdomIndex].source}</p>
              <Link href="/academy/financial-literacy">
                <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" data-testid="link-financial-literacy">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Total Market Value</span>
            <div className="rounded-md p-1.5 bg-blue-100 dark:bg-blue-900/30">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-total-market-value">
            ${totalMarketValue.toLocaleString()}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Your Portfolio Value</span>
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <Briefcase className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-portfolio-value">
            ${portfolioValue.toLocaleString()}
          </p>
          {wallet && (
            <p className="text-xs text-muted-foreground mt-1" data-testid="text-wallet-balance">
              Cash: ${walletBalance.toLocaleString()}
            </p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Community Portfolio</span>
            <div className="rounded-md p-1.5 bg-rose-100 dark:bg-rose-900/30">
              <Users className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
          <p className="text-2xl font-bold" data-testid="text-community-value">
            ${communityStats.totalValue.toLocaleString()}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3 gap-1">
            <span className="text-sm text-muted-foreground">Market Status</span>
            <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30">
              <Activity className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <Badge variant="secondary" className="mb-2" data-testid="badge-market-status">Open</Badge>
          <div>
            <Button
              size="sm"
              onClick={() => simulateMutation.mutate()}
              disabled={simulateMutation.isPending}
              data-testid="button-simulate-day"
            >
              <Play className="h-3.5 w-3.5 mr-1" />
              {simulateMutation.isPending ? "Simulating..." : "Simulate Day"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="p-6 mb-8">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <ArrowUpDown className="h-5 w-5 text-primary" /> Stock Ticker
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="table-stock-ticker">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Symbol</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Name</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground">Sector</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Price</th>
                <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Change</th>
                <th className="pb-3 font-medium text-muted-foreground text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {stocks?.map((stock) => {
                const changePercent = parseFloat(stock.changePercent) || 0;
                const currentPrice = parseFloat(stock.currentPrice) || 0;
                const isPositive = changePercent >= 0;
                return (
                  <tr
                    key={stock.id}
                    className="border-b last:border-b-0 hover-elevate"
                    data-testid={`row-stock-${stock.id}`}
                  >
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => setSelectedStockForChart(stock)}
                        className="font-mono font-bold text-primary cursor-pointer bg-transparent border-none p-0"
                        data-testid={`button-chart-${stock.id}`}
                      >
                        {stock.symbol}
                      </button>
                    </td>
                    <td className="py-3 pr-4">{stock.name}</td>
                    <td className="py-3 pr-4">
                      <Badge variant="outline" data-testid={`badge-sector-${stock.id}`}>{stock.sector}</Badge>
                    </td>
                    <td className="py-3 pr-4 text-right font-mono font-medium">
                      ${currentPrice.toFixed(2)}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span
                        className={`flex items-center justify-end gap-1 font-mono font-medium ${
                          isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        }`}
                        data-testid={`text-change-${stock.id}`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3.5 w-3.5" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5" />
                        )}
                        {isPositive ? "+" : ""}
                        {changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        size="sm"
                        onClick={() => openTradeDialog(stock, "buy")}
                        data-testid={`button-buy-${stock.id}`}
                      >
                        <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                        Buy
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent data-testid="dialog-trading-panel">
          <DialogHeader>
            <DialogTitle>
              {tradeAction === "buy" ? "Buy" : "Sell"} {tradingStock?.name}
            </DialogTitle>
          </DialogHeader>
          {tradingStock && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Current Price</span>
                <span className="font-mono font-bold text-lg" data-testid="text-trade-price">
                  ${(parseFloat(tradingStock.currentPrice) || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={tradeAction === "buy" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTradeAction("buy")}
                  data-testid="button-toggle-buy"
                >
                  Buy
                </Button>
                <Button
                  variant={tradeAction === "sell" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTradeAction("sell")}
                  data-testid="button-toggle-sell"
                >
                  Sell
                </Button>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1.5 block">Number of Shares</label>
                <Input
                  type="number"
                  min={1}
                  value={tradeShares}
                  onChange={(e) => setTradeShares(Math.max(1, parseInt(e.target.value) || 1))}
                  data-testid="input-trade-shares"
                />
              </div>

              <div className="flex items-center justify-between gap-2 p-3 rounded-md bg-muted/50 flex-wrap">
                <span className="text-sm font-medium">Total Cost</span>
                <span className="font-mono font-bold text-lg" data-testid="text-trade-total">
                  ${((parseFloat(tradingStock.currentPrice) || 0) * tradeShares).toFixed(2)}
                </span>
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setPendingTrade({
                    stockId: tradingStock.id,
                    action: tradeAction,
                    shares: tradeShares,
                  });
                  setRiskDialogOpen(true);
                }}
                disabled={tradeMutation.isPending}
                data-testid="button-confirm-trade"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                {tradeMutation.isPending
                  ? "Processing..."
                  : `Confirm ${tradeAction === "buy" ? "Purchase" : "Sale"}`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {portfolio.length > 0 && (
        <Card className="p-6 mb-8">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" /> Your Portfolio
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="table-portfolio">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 pr-4 font-medium text-muted-foreground">Stock</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Shares</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Avg Buy Price</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Current Value</th>
                  <th className="pb-3 pr-4 font-medium text-muted-foreground text-right">Gain/Loss</th>
                  <th className="pb-3 font-medium text-muted-foreground text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map((item) => {
                  const isGain = item.gainLoss >= 0;
                  return (
                    <tr
                      key={item.id}
                      className="border-b last:border-b-0"
                      data-testid={`row-portfolio-${item.id}`}
                    >
                      <td className="py-3 pr-4">
                        <div>
                          <span className="font-mono font-bold">{item.symbol}</span>
                          <span className="text-muted-foreground ml-2">{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-right font-mono" data-testid={`text-shares-${item.id}`}>
                        {item.shares}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono">
                        ${item.avgBuyPriceNum.toFixed(2)}
                      </td>
                      <td className="py-3 pr-4 text-right font-mono font-medium">
                        ${item.currentValue.toFixed(2)}
                      </td>
                      <td className="py-3 pr-4 text-right">
                        <span
                          className={`font-mono font-medium ${
                            isGain ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}
                          data-testid={`text-gainloss-${item.id}`}
                        >
                          {isGain ? "+" : ""}${item.gainLoss.toFixed(2)} ({isGain ? "+" : ""}
                          {item.gainLossPercent.toFixed(1)}%)
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const stock = stocks?.find((s) => s.id === item.stockId);
                            if (stock) openTradeDialog(stock, "sell");
                          }}
                          data-testid={`button-sell-${item.id}`}
                        >
                          Sell
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-md p-1.5 bg-rose-100 dark:bg-rose-900/30">
              <Bot className="h-5 w-5 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="font-semibold">AI Bot Portfolio</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="font-mono font-bold" data-testid="text-community-total">
                ${communityStats.totalValue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Number of Stocks</span>
              <span className="font-mono font-bold" data-testid="text-community-stocks">
                {communityStats.stockCount}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Performance</span>
              <span
                className={`font-mono font-bold ${
                  communityStats.performancePercent >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
                data-testid="text-community-performance"
              >
                {communityStats.performancePercent >= 0 ? "+" : ""}
                {communityStats.performancePercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30">
              <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-semibold">Your Portfolio</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Total Value</span>
              <span className="font-mono font-bold" data-testid="text-your-total">
                ${portfolioValue.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Number of Stocks</span>
              <span className="font-mono font-bold" data-testid="text-your-stocks">
                {portfolio.length}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Performance</span>
              <span
                className={`font-mono font-bold ${
                  portfolio.length > 0
                    ? portfolio.reduce((s, p) => s + p.gainLoss, 0) >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                    : ""
                }`}
                data-testid="text-your-performance"
              >
                {portfolio.length > 0
                  ? (() => {
                      const totalGain = portfolio.reduce((s, p) => s + p.gainLoss, 0);
                      const totalCost = portfolio.reduce((s, p) => s + p.avgBuyPriceNum * p.shares, 0);
                      const pct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
                      return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
                    })()
                  : "0.0%"}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 mb-8 bg-muted/30">
        <p className="text-sm text-muted-foreground text-center" data-testid="text-collaboration-message">
          The community bot trades based on collective data. See how teamwork compares to going solo!
        </p>
      </Card>

      {selectedStockForChart && selectedStockForChart.priceHistory && selectedStockForChart.priceHistory.length > 0 && (
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
            <h2 className="font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Price History - {selectedStockForChart.symbol}
            </h2>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedStockForChart(null)}
              data-testid="button-close-chart"
            >
              Close
            </Button>
          </div>
          <PriceHistoryChart
            prices={selectedStockForChart.priceHistory}
            symbol={selectedStockForChart.symbol}
          />
        </Card>
      )}
      <RiskDecisionDialog
        open={riskDialogOpen}
        onOpenChange={setRiskDialogOpen}
        riskLevel={determineRiskLevel()}
        featureArea="stocks"
        actionType={tradeAction === "buy" ? "buy_stock" : "sell_stock"}
        warningMessage={getTradeWarning()}
        financialLiteracyModule={tradeAction === "sell" ? "patience-pays" : "rainy-day-fund"}
        metadata={{ stockId: tradingStock?.id, stockName: tradingStock?.name, shares: tradeShares, totalCost: tradingStock ? (parseFloat(tradingStock.currentPrice) * tradeShares).toFixed(2) : "0" }}
        onProceed={() => { if (pendingTrade) tradeMutation.mutate(pendingTrade); setRiskDialogOpen(false); }}
        onCancel={() => { setRiskDialogOpen(false); setPendingTrade(null); }}
      />
      <AcademyWizard wizardType="stocks" steps={WIZARD_STEPS["stocks"]} />
    </div>
  );
}

function PriceHistoryChart({ prices, symbol }: { prices: number[]; symbol: string }) {
  const parsedPrices = prices.map(p => typeof p === "string" ? parseFloat(p) || 0 : p);
  const maxPrice = Math.max(...parsedPrices);
  const minPrice = Math.min(...parsedPrices);
  const range = maxPrice - minPrice || 1;

  return (
    <div data-testid="chart-price-history">
      <div className="flex items-end gap-1.5 h-40">
        {parsedPrices.map((price, index) => {
          const heightPercent = ((price - minPrice) / range) * 80 + 20;
          const isLast = index === parsedPrices.length - 1;
          const prevPrice = index > 0 ? parsedPrices[index - 1] : price;
          const isUp = price >= prevPrice;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center justify-end h-full"
              data-testid={`bar-price-${index}`}
            >
              <span className="text-[10px] text-muted-foreground mb-1 font-mono">
                ${price.toFixed(0)}
              </span>
              <div
                className={`w-full rounded-t-sm transition-all ${
                  isUp
                    ? "bg-emerald-500 dark:bg-emerald-400"
                    : "bg-red-500 dark:bg-red-400"
                } ${isLast ? "opacity-100" : "opacity-70"}`}
                style={{ height: `${heightPercent}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-2 gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">
          Low: ${minPrice.toFixed(2)}
        </span>
        <span className="text-xs text-muted-foreground">
          High: ${maxPrice.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
