import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Store, MapPin, Phone, Tag, TrendingUp } from "lucide-react";
import { getCustomerShops, getCustomerCouponByCode } from "@/lib/api"; // Assuming getCustomerCouponByCode is available
import { useToast } from "@/hooks/use-toast";

interface MyShopsProps {
  customerId: string;
}

export function MyShops({ customerId }: MyShopsProps) {
  const { toast } = useToast();
  const { data: shops = [], isLoading, isError, error } = useQuery({
    queryKey: ['/api/customers', customerId, 'shops'],
    queryFn: () => getCustomerShops(customerId),
    enabled: !!customerId,
  });

  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const { data: customerCoupons = [] } = useQuery({
    queryKey: ['/api/customer-coupons', customerId],
    queryFn: () => getCustomerCoupons(customerId),
    enabled: !!customerId,
  });

  // Find the coupon for the selected shop
  const coupon = selectedShopId 
    ? customerCoupons.find((c: any) => c.shopProfileId === selectedShopId)
    : null;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Loading your shops...</p>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    console.error("Error loading shops:", error);
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Store className="h-12 w-12 mx-auto text-destructive mb-3" />
          <p className="text-muted-foreground">Failed to load shops</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error ? error.message : "Please try again later"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filter out any invalid shop data
  const validShops = shops.filter((shop: any) => shop && shop.id && shop.shopName);

  if (validShops.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No shops yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Add coupons from shops to see them here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {validShops.map((shop: any) => (
        <Card key={shop.id} className="hover:shadow-md transition-shadow" data-testid={`shop-card-${shop.id}`}>
          <CardHeader>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{shop.shopName}</p>
                    <p className="text-xs text-muted-foreground">{shop.shopCode}</p>
                  </div>
                </div>
              </div>
              {coupon && shop.id === selectedShopId && (
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-2">
                  <p className="text-xs text-muted-foreground mb-1">Your Referral Code for this shop:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono font-bold text-blue-900 dark:text-blue-100">
                      {coupon.referralCode}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.referralCode);
                        toast({
                          title: "Copied!",
                          description: "Referral code copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Points/₹</p>
                <p className="font-bold text-green-600" data-testid={`shop-points-${shop.id}`}>{shop.pointsPerDollar}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Discount</p>
                <p className="font-bold text-blue-600" data-testid={`shop-discount-${shop.id}`}>{shop.discountPercentage}%</p>
              </div>
            </div>

            <Dialog onOpenChange={(isOpen) => {
              if (isOpen) {
                setSelectedShopId(shop.id);
              } else {
                setSelectedShopId(null);
              }
            }}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid={`button-view-profile-${shop.id}`}
                >
                  <Store className="h-4 w-4 mr-2" />
                  View Shop Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" data-testid={`shop-profile-dialog-${shop.id}`}>
                <DialogHeader>
                  <DialogTitle className="text-xl">{shop.shopName}</DialogTitle>
                  <DialogDescription>
                    {shop.category && `${shop.category} • `}Shop Code: {shop.shopCode}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  {shop.description && (
                    <div>
                      <h4 className="text-sm font-medium mb-1">About</h4>
                      <p className="text-sm text-muted-foreground">{shop.description}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                          <p className="text-xs text-muted-foreground">Points/₹</p>
                        </div>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{shop.pointsPerDollar}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <p className="text-xs text-muted-foreground">Discount</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{shop.discountPercentage}%</p>
                      </CardContent>
                    </Card>
                  </div>

                  {shop.address && (
                    <div className="flex gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Address</h4>
                        <p className="text-sm text-muted-foreground">{shop.address}</p>
                      </div>
                    </div>
                  )}

                  {shop.phone && (
                    <div className="flex gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium">Phone</h4>
                        <p className="text-sm text-muted-foreground">{shop.phone}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm font-medium">Status</span>
                    <Badge variant={shop.isActive ? "default" : "secondary"}>
                      {shop.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}