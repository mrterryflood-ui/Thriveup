import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { RiskDecisionDialog } from "@/components/risk-decision-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { ErrorRetry } from "@/components/error-retry";
import {
  Store,
  ShoppingCart,
  Plus,
  Tag,
  DollarSign,
  ArrowUpDown,
  User,
  Clock,
  Activity,
  Package,
  Handshake,
  TrendingUp,
  Filter,
  Shield,
  Flag,
  Lightbulb,
} from "lucide-react";

interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemName: string;
  description: string;
  category: string;
  price: string;
  quantity: number;
  status: string;
  createdAt: string;
}

interface Trade {
  id: string;
  listingId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  quantity: number;
  totalPrice: string;
  status: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  userId: string;
  userName: string;
  activityType: string;
  title: string;
  description: string;
  metadata: any;
  powerCategory: string;
  pointsEarned: number;
  createdAt: string;
}

interface WalletData {
  balance: string;
}

const listingSchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  price: z.string().refine(v => !isNaN(Number(v)) && Number(v) > 0, "Price must be positive"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
});

type ListingFormValues = z.infer<typeof listingSchema>;

const CATEGORIES = ["All", "Service", "Product", "Skill", "Tutoring"];

const BUSINESS_WISDOM = [
  { tip: "The best businesses solve real problems. Before you list something, ask: who needs this and why? That is how every successful business starts.", source: "Business Foundations" },
  { tip: "Your reputation is worth more than any single sale. One dishonest deal can destroy years of trust. Always deliver what you promise.", source: "Business Ethics" },
  { tip: "Pricing too low hurts everyone. It devalues your work and makes it harder for others to sell fairly. Know your worth.", source: "Fair Pricing" },
  { tip: "If someone offers you something that sounds too good to be true, it probably is. Scammers prey on excitement and urgency.", source: "Scam Awareness" },
  { tip: "Great entrepreneurs do not just sell things. They build relationships. A happy customer tells 3 friends. An unhappy one tells 10.", source: "Customer Service" },
  { tip: "Keep records of every transaction. An audit trail protects you if there is ever a dispute. Good records are a sign of a serious business.", source: "Financial Records" },
  { tip: "Oprah Winfrey said: 'Do what you love and the money will follow.' But she also worked harder than anyone around her. Passion plus effort equals success.", source: "Oprah Winfrey" },
  { tip: "A pyramid scheme asks you to pay money to join and recruit others. A real business makes money by providing value to customers. Know the difference.", source: "Fraud Prevention" },
];

function getCategoryColor(category: string) {
  switch (category.toLowerCase()) {
    case "service": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    case "product": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "skill": return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300";
    case "tutoring": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
    default: return "";
  }
}

function getActivityIcon(type: string) {
  switch (type) {
    case "marketplace_list": return <Package className="h-4 w-4 text-white" />;
    case "marketplace_buy": return <ShoppingCart className="h-4 w-4 text-white" />;
    case "scenario_start": return <Activity className="h-4 w-4 text-white" />;
    case "scenario_complete": return <TrendingUp className="h-4 w-4 text-white" />;
    default: return <Activity className="h-4 w-4 text-white" />;
  }
}

function getActivityGradient(type: string) {
  switch (type) {
    case "marketplace_list": return "from-blue-400 to-blue-600";
    case "marketplace_buy": return "from-emerald-400 to-emerald-600";
    case "scenario_start": return "from-violet-400 to-violet-600";
    case "scenario_complete": return "from-amber-400 to-amber-600";
    default: return "from-rose-400 to-rose-600";
  }
}

export default function AcademyMarketplacePage() {
  useEffect(() => { document.title = 'Marketplace | AI Mastery Academy'; }, []);

  const { toast } = useToast();
  const { user } = useAuth();
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [reportingId, setReportingId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [businessTipIndex, setBusinessTipIndex] = useState(() => Math.floor(Math.random() * BUSINESS_WISDOM.length));
  const [riskDialogOpen, setRiskDialogOpen] = useState(false);
  const [pendingBuyId, setPendingBuyId] = useState<string | null>(null);
  const [pendingBuyListing, setPendingBuyListing] = useState<any>(null);

  const { data: listings, isLoading: listingsLoading, error: listingsError, refetch: refetchListings } = useQuery<Listing[]>({
    queryKey: ["/api/academy/marketplace"],
  });

  const { data: myListings, isLoading: myListingsLoading } = useQuery<Listing[]>({
    queryKey: ["/api/academy/marketplace/my-listings"],
  });

  const { data: trades } = useQuery<Trade[]>({
    queryKey: ["/api/academy/marketplace/trades"],
  });

  const { data: activityFeed } = useQuery<ActivityItem[]>({
    queryKey: ["/api/academy/activity"],
  });

  const { data: wallet } = useQuery<WalletData>({
    queryKey: ["/api/academy/wallet"],
  });

  const walletBalance = parseFloat(wallet?.balance ?? "0") || 0;

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      itemName: "",
      description: "",
      category: "",
      price: "",
      quantity: 1,
    },
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: ListingFormValues) => {
      const res = await apiRequest("POST", "/api/academy/marketplace", {
        ...data,
        price: Number(data.price),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/marketplace/my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/wallet"] });
      form.reset();
      toast({ title: "Listed!", description: "Your item is now on the marketplace" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const buyMutation = useMutation({
    mutationFn: async (listingId: string) => {
      const res = await apiRequest("POST", `/api/academy/marketplace/${listingId}/buy`, { quantity: 1 });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/marketplace"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/marketplace/my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/marketplace/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/activity"] });
      queryClient.invalidateQueries({ queryKey: ["/api/academy/wallet"] });
      toast({ title: "Purchased!", description: "Item bought successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Purchase Failed", description: error.message, variant: "destructive" });
    },
  });

  const reportMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await apiRequest("POST", `/api/academy/marketplace/${id}/report`, { reason, details: reason });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Report Submitted", description: "Thank you for helping keep our community safe. A teacher will review this." });
      setReportingId(null);
      setReportReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Could not submit report. Please try again.", variant: "destructive" });
    },
  });

  const filteredListings = (listings ?? []).filter(l => {
    if (categoryFilter === "All") return true;
    return l.category.toLowerCase() === categoryFilter.toLowerCase();
  });

  const onSubmit = (values: ListingFormValues) => {
    createListingMutation.mutate(values);
  };

  if (listingsLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-40 w-full rounded-md" />
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (listingsError) {
    return <div className="p-6"><ErrorRetry message="Failed to load marketplace listings. Please try again." onRetry={refetchListings} /></div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Panther Marketplace"
        description="Buy, sell, and trade with your classmates in our peer-to-peer economy"
        breadcrumbs={[{label:"Academy",href:"/academy"},{label:"Marketplace"}]}
      />
      <div
        className="rounded-md bg-gradient-to-r from-rose-900 to-red-950 dark:from-rose-950 dark:to-background p-8 mb-8"
        data-testid="section-hero"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="rounded-md p-2.5 bg-white/10">
            <Store className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white" data-testid="text-marketplace-title">
            Panther Marketplace
          </h1>
        </div>
        <p className="text-rose-100 text-lg mb-4">
          Buy, sell, and trade with your classmates in our peer-to-peer economy
        </p>
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-300" />
          <span className="text-white font-semibold text-lg" data-testid="text-hero-balance">
            Balance: ${walletBalance.toFixed(2)}
          </span>
        </div>
      </div>

      <Card className="p-4 mb-6 border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10" data-testid="card-community-guidelines">
        <div className="flex items-start gap-3">
          <div className="rounded-md p-1.5 bg-amber-100 dark:bg-amber-900/30 shrink-0 mt-0.5">
            <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold mb-1">Panther Community Guidelines</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our marketplace is a safe space for learning and growing together. Be respectful, 
              use kind language, and treat every Panther the way you want to be treated. 
              All listings are monitored by teachers. If you see something that does not belong, 
              use the report button to let a teacher know.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-4 mb-6 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800" data-testid="card-business-wisdom">
        <div className="flex items-start gap-3">
          <div className="rounded-md p-1.5 bg-emerald-100 dark:bg-emerald-900/30 shrink-0 mt-0.5">
            <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Business Wisdom</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBusinessTipIndex((prev) => (prev + 1) % BUSINESS_WISDOM.length)}
                className="text-xs h-auto py-1 px-2 text-emerald-700 dark:text-emerald-400"
                data-testid="button-next-business-tip"
              >
                Next Tip
              </Button>
            </div>
            <p className="text-sm" data-testid="text-business-tip">{BUSINESS_WISDOM[businessTipIndex].tip}</p>
            <div className="flex items-center justify-between gap-2 mt-2 flex-wrap">
              <p className="text-xs text-muted-foreground" data-testid="text-business-source">-- {BUSINESS_WISDOM[businessTipIndex].source}</p>
              <Link href="/academy/financial-literacy" data-testid="link-financial-literacy">
                <Button variant="ghost" size="sm" className="text-xs h-auto py-1 px-2" data-testid="link-financial-literacy-marketplace">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="browse" data-testid="tabs-marketplace">
        <TabsList className="mb-6" data-testid="tabs-list">
          <TabsTrigger value="browse" data-testid="tab-browse">
            <ShoppingCart className="h-4 w-4 mr-1.5" />
            Browse
          </TabsTrigger>
          <TabsTrigger value="my-listings" data-testid="tab-my-listings">
            <Package className="h-4 w-4 mr-1.5" />
            My Listings
          </TabsTrigger>
          <TabsTrigger value="activity" data-testid="tab-activity">
            <Activity className="h-4 w-4 mr-1.5" />
            Activity Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="flex items-center gap-2 mb-6 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {CATEGORIES.map(cat => (
              <Button
                key={cat}
                size="sm"
                variant={categoryFilter === cat ? "default" : "outline"}
                onClick={() => setCategoryFilter(cat)}
                data-testid={`button-filter-${cat.toLowerCase()}`}
                className="toggle-elevate"
              >
                {cat}
              </Button>
            ))}
          </div>

          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map(listing => {
                const price = parseFloat(listing.price) || 0;
                const isOwn = user?.id === listing.sellerId;
                const cantAfford = walletBalance < price;

                return (
                  <Card key={listing.id} className="p-5" data-testid={`card-listing-${listing.id}`}>
                    <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                      <h3 className="font-semibold text-base" data-testid={`text-listing-name-${listing.id}`}>
                        {listing.itemName}
                      </h3>
                      <Badge
                        variant="secondary"
                        className={getCategoryColor(listing.category)}
                        data-testid={`badge-category-${listing.id}`}
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {listing.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2" data-testid={`text-listing-desc-${listing.id}`}>
                      {listing.description}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground" data-testid={`text-seller-${listing.id}`}>
                        {listing.sellerName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-xl font-bold font-mono" data-testid={`text-price-${listing.id}`}>
                        ${price.toFixed(2)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground" data-testid={`text-qty-${listing.id}`}>
                          Qty: {listing.quantity}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => { setPendingBuyId(listing.id); setPendingBuyListing(listing); setRiskDialogOpen(true); }}
                          disabled={isOwn || cantAfford || buyMutation.isPending}
                          data-testid={`button-buy-${listing.id}`}
                        >
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                          {isOwn ? "Your Item" : cantAfford ? "No Funds" : "Buy Now"}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setReportingId(reportingId === listing.id ? null : listing.id);
                            setReportReason("");
                          }}
                          data-testid={`button-report-${listing.id}`}
                          aria-label="Report listing"
                        >
                          <Flag className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {reportingId === listing.id && (
                      <Card className="p-3 mt-3 border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-900/10" data-testid={`card-report-form-${listing.id}`}>
                        <p className="text-xs font-semibold mb-2">Report this listing</p>
                        <Input
                          placeholder="Why are you reporting this?"
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="mb-2"
                          data-testid={`input-report-reason-${listing.id}`}
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => reportMutation.mutate({ id: listing.id, reason: reportReason })}
                            disabled={!reportReason.trim() || reportMutation.isPending}
                            data-testid={`button-submit-report-${listing.id}`}
                          >
                            {reportMutation.isPending ? "Submitting..." : "Submit Report"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => { setReportingId(null); setReportReason(""); }}
                            data-testid={`button-cancel-report-${listing.id}`}
                          >
                            Cancel
                          </Button>
                        </div>
                      </Card>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center" data-testid="card-no-listings">
              <Store className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-marketplace-title">
                {categoryFilter !== "All" ? `No ${categoryFilter} Listings` : "The Marketplace is Empty"}
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                {categoryFilter !== "All"
                  ? `There are no ${categoryFilter.toLowerCase()} listings right now. Try browsing all categories or be the first to list a ${categoryFilter.toLowerCase()}.`
                  : "Be the first entrepreneur to list something. Offer a service, share a skill, or sell a product to your classmates."}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                {categoryFilter !== "All" && (
                  <Button
                    variant="outline"
                    onClick={() => setCategoryFilter("All")}
                    data-testid="button-clear-filter"
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    View All Categories
                  </Button>
                )}
                <Button
                  onClick={() => {
                    const tabTrigger = document.querySelector('[data-testid="tab-my-listings"]') as HTMLButtonElement;
                    if (tabTrigger) tabTrigger.click();
                  }}
                  data-testid="button-create-first-listing"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create a Listing
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="my-listings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Create Listing
              </h2>
              <Card className="p-6" data-testid="card-create-listing">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="itemName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="What are you selling?"
                              {...field}
                              data-testid="input-item-name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your item or service..."
                              className="resize-none"
                              {...field}
                              data-testid="input-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="service">Service</SelectItem>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="skill">Skill</SelectItem>
                              <SelectItem value="tutoring">Tutoring</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                {...field}
                                data-testid="input-price"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                                data-testid="input-quantity"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createListingMutation.isPending}
                      data-testid="button-create-listing"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {createListingMutation.isPending ? "Creating..." : "List Item"}
                    </Button>
                  </form>
                </Form>
              </Card>
            </div>

            <div>
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> Your Listings
              </h2>
              {myListingsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : (myListings ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(myListings ?? []).map(listing => {
                    const price = parseFloat(listing.price) || 0;
                    return (
                      <Card key={listing.id} className="p-4" data-testid={`card-my-listing-${listing.id}`}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium" data-testid={`text-my-listing-name-${listing.id}`}>
                              {listing.itemName}
                            </h4>
                            <p className="text-sm text-muted-foreground truncate">{listing.description}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-mono font-bold">${price.toFixed(2)}</p>
                            <Badge variant="secondary" className="mt-1">
                              Qty: {listing.quantity}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge
                            variant="secondary"
                            className={getCategoryColor(listing.category)}
                          >
                            {listing.category}
                          </Badge>
                          <Badge variant={listing.status === "active" ? "default" : "secondary"}>
                            {listing.status}
                          </Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-6 text-center" data-testid="card-no-my-listings">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <h4 className="font-semibold mb-1" data-testid="text-empty-my-listings-title">No Listings Yet</h4>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Use the form above to create your first listing and start earning in the Panther economy.
                  </p>
                </Card>
              )}

              <h2 className="font-semibold text-lg mt-8 mb-4 flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" /> Trade History
              </h2>
              {(trades ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(trades ?? []).map(trade => {
                    const totalPrice = parseFloat(trade.totalPrice) || 0;
                    const isBuyer = user?.id === trade.buyerId;
                    return (
                      <Card key={trade.id} className="p-4" data-testid={`card-trade-${trade.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-gradient-to-br ${isBuyer ? "from-emerald-400 to-emerald-600" : "from-amber-400 to-amber-600"}`}>
                            {isBuyer ? <ShoppingCart className="h-4 w-4 text-white" /> : <DollarSign className="h-4 w-4 text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" data-testid={`text-trade-desc-${trade.id}`}>
                              {isBuyer ? `Bought from ${trade.sellerName}` : `Sold to ${trade.buyerName}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(trade.createdAt).toLocaleDateString()} - Qty: {trade.quantity}
                            </p>
                          </div>
                          <span className={`font-mono font-bold ${isBuyer ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`} data-testid={`text-trade-price-${trade.id}`}>
                            {isBuyer ? "-" : "+"}${totalPrice.toFixed(2)}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-6 text-center" data-testid="card-no-trades">
                  <Handshake className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
                  <h4 className="font-semibold mb-1" data-testid="text-empty-trades-title">No Trades Yet</h4>
                  <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                    Your purchase and sale history will appear here once you start trading with classmates.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Live Commerce Feed</h2>
          </div>
          {(activityFeed ?? []).length > 0 ? (
            <div className="space-y-3">
              {(activityFeed ?? []).map(item => (
                <Card key={item.id} className="p-4" data-testid={`card-activity-${item.id}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-gradient-to-br ${getActivityGradient(item.activityType)}`}>
                      {getActivityIcon(item.activityType)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium" data-testid={`text-activity-user-${item.id}`}>
                          {item.userName}
                        </span>
                        <Badge variant="secondary">
                          {item.activityType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-sm" data-testid={`text-activity-title-${item.id}`}>
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {item.pointsEarned > 0 && (
                        <Badge variant="secondary" data-testid={`badge-points-${item.id}`}>
                          +{item.pointsEarned} pts
                        </Badge>
                      )}
                      <p className="text-xs text-muted-foreground mt-1" data-testid={`text-activity-time-${item.id}`}>
                        <Clock className="h-3 w-3 inline mr-1" />
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center" data-testid="card-no-activity">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2" data-testid="text-empty-activity-title">No Activity Yet</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                The live commerce feed will light up as Panthers start buying, selling, and trading. Be the first to make a move!
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  const tabTrigger = document.querySelector('[data-testid="tab-browse"]') as HTMLButtonElement;
                  if (tabTrigger) tabTrigger.click();
                }}
                data-testid="button-browse-from-activity"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Browse the Marketplace
              </Button>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      <RiskDecisionDialog
        open={riskDialogOpen}
        onOpenChange={setRiskDialogOpen}
        riskLevel="low"
        featureArea="marketplace"
        actionType="purchase"
        warningMessage={pendingBuyListing ? `You're about to spend ${pendingBuyListing.price} credits on "${pendingBuyListing.title}." Before you buy, ask yourself: Is this something I need, or something I want? Do I still have enough saved for unexpected expenses?` : "Think carefully before purchasing."}
        financialLiteracyModule="rainy-day-fund"
        metadata={{ listingId: pendingBuyId, title: pendingBuyListing?.title, price: pendingBuyListing?.price }}
        onProceed={() => { if (pendingBuyId) buyMutation.mutate(pendingBuyId); setRiskDialogOpen(false); setPendingBuyId(null); setPendingBuyListing(null); }}
        onCancel={() => { setRiskDialogOpen(false); setPendingBuyId(null); setPendingBuyListing(null); }}
      />
    </div>
  );
}
