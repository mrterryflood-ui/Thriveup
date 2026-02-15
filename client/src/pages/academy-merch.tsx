import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import AcademyWizard from "@/components/academy-wizard";
import { WIZARD_STEPS } from "@/lib/wizard-data";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ShoppingBag,
  Package,
  DollarSign,
  Truck,
  CheckCircle,
  Clock,
  Tag,
  Gift,
  Heart,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AcademyMerchItem, AcademyMerchOrder } from "@shared/schema";

const PLACEHOLDER_ITEMS = [
  { name: "T-Shirts", price: "25.00", category: "Apparel", description: "Academy branded t-shirts in various sizes" },
  { name: "Hoodies", price: "45.00", category: "Apparel", description: "Warm hoodies with academy logo" },
  { name: "Caps", price: "20.00", category: "Accessories", description: "Adjustable caps with embroidered logo" },
  { name: "Tote Bags", price: "15.00", category: "Accessories", description: "Durable tote bags for everyday use" },
  { name: "Water Bottles", price: "18.00", category: "Accessories", description: "Reusable water bottles with academy branding" },
  { name: "Notebooks", price: "12.00", category: "Stationery", description: "Lined notebooks for learning and notes" },
  { name: "Stickers Pack", price: "8.00", category: "Stationery", description: "Pack of academy-themed stickers" },
  { name: "Wristbands", price: "5.00", category: "Accessories", description: "Silicone wristbands showing your support" },
];

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; className: string }> = {
  pending: { label: "Pending", variant: "secondary", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" },
  processing: { label: "Processing", variant: "secondary", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  completed: { label: "Completed", variant: "secondary", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
  shipped: { label: "Shipped", variant: "secondary", className: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300" },
};

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  processing: Package,
  completed: CheckCircle,
  shipped: Truck,
};

const FUNDRAISING_GOAL = 10000;

export default function AcademyMerchPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<AcademyMerchItem | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);

  const { data: merchItems, isLoading: itemsLoading } = useQuery<AcademyMerchItem[]>({
    queryKey: ["/api/academy/merch"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<AcademyMerchOrder[]>({
    queryKey: ["/api/academy/merch/orders"],
    enabled: !!user,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: { itemId: string; quantity: number; totalPrice: string; userName: string }) => {
      return apiRequest("POST", "/api/academy/merch/orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/academy/merch/orders"] });
      setSelectedItem(null);
      setOrderQuantity(1);
      toast({ title: "Order placed", description: "Your order has been submitted successfully." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to place order. Please try again.", variant: "destructive" });
    },
  });

  const totalRaised = orders
    ? orders.filter((o) => o.status === "completed").reduce((sum, o) => sum + parseFloat(o.totalPrice), 0)
    : 0;
  const totalOrders = orders?.length || 0;
  const progressPercent = Math.min((totalRaised / FUNDRAISING_GOAL) * 100, 100);

  const hasItems = merchItems && merchItems.length > 0;

  function handleOrder(item: AcademyMerchItem) {
    setSelectedItem(item);
    setOrderQuantity(1);
  }

  function submitOrder() {
    if (!selectedItem) return;
    const total = (parseFloat(selectedItem.price) * orderQuantity).toFixed(2);
    createOrderMutation.mutate({
      itemId: selectedItem.id,
      quantity: orderQuantity,
      totalPrice: total,
      userName: user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Student" : "Student",
    });
  }

  if (itemsLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-5 w-96" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto" data-testid="page-academy-merch">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1 flex items-center gap-3 flex-wrap" data-testid="text-merch-title">
          <ShoppingBag className="h-8 w-8 text-primary shrink-0" />
          Print Shop & Merchandise
        </h1>
        <p className="text-muted-foreground" data-testid="text-merch-subtitle">
          Real merchandise, real fundraising - Partnership with UBO
        </p>
      </div>

      <Card className="p-6 mb-8 bg-gradient-to-br from-primary/5 to-accent/5" data-testid="card-mission-statement">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="rounded-md p-2.5 bg-primary/10 shrink-0">
            <Heart className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-lg font-semibold mb-2" data-testid="text-mission-title">
              Every purchase supports our students' college dreams
            </h2>
            <p className="text-sm text-muted-foreground mb-1" data-testid="text-mission-partner">
              In partnership with United Black Outreach (UBO)
            </p>
            <p className="text-sm font-medium text-primary" data-testid="text-mission-proceeds">
              100% of proceeds go directly to student college tuition funds
            </p>
          </div>
        </div>
      </Card>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Tag className="h-5 w-5 text-primary" />
          {hasItems ? "Merchandise Catalog" : "Coming Soon"}
        </h2>

        {hasItems ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="grid-merch-items">
            {merchItems.map((item) => (
              <Card key={item.id} className="p-4 flex flex-col" data-testid={`card-merch-item-${item.id}`}>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <Badge variant="outline" data-testid={`badge-category-${item.id}`}>
                    {item.category}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={item.inStock
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                    }
                    data-testid={`badge-stock-${item.id}`}
                  >
                    {item.inStock ? "In Stock" : "Out of Stock"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h3 className="font-semibold text-sm" data-testid={`text-item-name-${item.id}`}>
                    {item.name}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3 flex-1" data-testid={`text-item-desc-${item.id}`}>
                  {item.description}
                </p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-lg font-bold" data-testid={`text-item-price-${item.id}`}>
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                  {item.inStock && (
                    <Button
                      size="sm"
                      onClick={() => handleOrder(item)}
                      data-testid={`button-order-${item.id}`}
                    >
                      <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                      Order
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="grid-coming-soon">
            {PLACEHOLDER_ITEMS.map((item) => (
              <Card key={item.name} className="p-4" data-testid={`card-placeholder-${item.name.toLowerCase().replace(/\s+/g, "-")}`}>
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <Badge variant="outline">{item.category}</Badge>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-muted-foreground shrink-0" />
                  <h3 className="font-semibold text-sm">{item.name}</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-3">{item.description}</p>
                <span className="text-lg font-bold">${item.price}</span>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!selectedItem} onOpenChange={(open) => { if (!open) setSelectedItem(null); }}>
        <DialogContent data-testid="dialog-order-form">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Place Order
            </DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Item</label>
                <Input
                  value={selectedItem.name}
                  readOnly
                  data-testid="input-order-item"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                <Input
                  type="number"
                  min={1}
                  value={orderQuantity}
                  onChange={(e) => setOrderQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  data-testid="input-order-quantity"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Total Price</label>
                <Input
                  value={`$${(parseFloat(selectedItem.price) * orderQuantity).toFixed(2)}`}
                  readOnly
                  data-testid="input-order-total"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Student Name</label>
                <Input
                  value={user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Student" : "Student"}
                  readOnly
                  data-testid="input-order-student"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={submitOrder}
              disabled={createOrderMutation.isPending}
              data-testid="button-place-order"
            >
              {createOrderMutation.isPending ? "Placing..." : "Place Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {user && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            My Orders
          </h2>
          <Card className="p-0 overflow-hidden" data-testid="card-my-orders">
            {ordersLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : orders && orders.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                    const StatusIcon = STATUS_ICONS[order.status] || Clock;
                    const merchItem = merchItems?.find((m) => m.id === order.itemId);
                    return (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell className="font-medium" data-testid={`text-order-item-${order.id}`}>
                          {merchItem?.name || order.itemId}
                        </TableCell>
                        <TableCell data-testid={`text-order-qty-${order.id}`}>{order.quantity}</TableCell>
                        <TableCell data-testid={`text-order-total-${order.id}`}>
                          ${parseFloat(order.totalPrice).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusConf.variant}
                            className={statusConf.className}
                            data-testid={`badge-order-status-${order.id}`}
                          >
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConf.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm" data-testid={`text-order-date-${order.id}`}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center">
                <ShoppingBag className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No orders yet. Browse the catalog above to place your first order.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      <Card className="p-6 mb-8" data-testid="card-fundraising-progress">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Fundraising Progress
        </h2>
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">$10,000 for College Tuition Fund</span>
          <span className="font-medium" data-testid="text-raised-amount">
            ${totalRaised.toFixed(2)} raised
          </span>
        </div>
        <Progress value={progressPercent} className="h-3 mb-4" data-testid="progress-fundraising" />
        <div className="flex items-center justify-between gap-4 flex-wrap text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4 shrink-0" />
            <span data-testid="text-total-orders">{totalOrders} orders placed</span>
          </div>
          <p className="text-muted-foreground italic" data-testid="text-fundraising-message">
            Together we can make college dreams come true
          </p>
        </div>
      </Card>

      <Card className="p-6" data-testid="card-footer-contact">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground" data-testid="text-contact-email">
              Questions? Contact mr.terryflood@gmail.com
            </span>
          </div>
          <span className="text-sm text-muted-foreground" data-testid="text-footer-partner">
            Merchandise produced in partnership with UBO
          </span>
        </div>
      </Card>
      <AcademyWizard wizardType="merch" steps={WIZARD_STEPS["merch"]} />
    </div>
  );
}
