import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, Tag, TrendingUp } from "lucide-react";
import { getCustomerShops, getCustomerCoupons } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BillUpload } from "@/components/BillUpload"; // Assuming BillUpload is imported from here
import { useQueryClient } from "@tanstack/react-query";

interface MyShopsProps {
  customerId: string;
}

export function MyShops({ customerId }: MyShopsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: shops = [], isLoading, isError, error } = useQuery({
    queryKey: ['/api/customers', customerId, 'shops'],
    queryFn: () => getCustomerShops(customerId),
    enabled: !!customerId,
  });

  const { data: customerCoupons = [] } = useQuery({
    queryKey: ['/api/customer-coupons', customerId],
    queryFn: () => getCustomerCoupons(customerId),
    enabled: !!customerId,
  });

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
      {validShops.map((shop: any) => {
        const shopCoupon = customerCoupons.find((c: any) => c.shopProfileId === shop.id);

        return (
          <Card key={shop.id} className="hover:shadow-md transition-shadow" data-testid={`shop-card-${shop.id}`}>
            <CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{shop.shopName}</p>
                      <p className="text-xs text-muted-foreground">{shop.shopCode}</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Affiliate</Badge>
                </div>

                {!shopCoupon && (
                  <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      No referral code found. Please try registering again.
                    </p>
                  </div>
                )}

                {shopCoupon && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-2 border-green-300 dark:border-green-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <p className="text-sm font-semibold text-green-900 dark:text-green-100">Your Affiliate Code</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <code className="text-xl font-mono font-bold text-green-700 dark:text-green-300 tracking-wider bg-white dark:bg-gray-800 px-3 py-2 rounded">
                        {shopCoupon.referralCode}
                      </code>
                      <Button
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          navigator.clipboard.writeText(shopCoupon.referralCode);
                          toast({
                            title: "Copied!",
                            description: "Referral code copied to clipboard",
                          });
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                      📢 Share your coupon to earn points and avail these offers
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>
          <CardContent className="space-y-3">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Campaign Details
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Points Earning Rules:</p>
                  {shop.campaigns && shop.campaigns.length > 0 && shop.campaigns[0].pointRules && shop.campaigns[0].pointRules.length > 0 ? (
                    shop.campaigns[0].pointRules.map((rule: any, index: number) => (
                      <div key={index} className="flex justify-between items-center bg-white dark:bg-purple-800/30 rounded px-2 py-1 mb-1">
                        <span className="text-xs text-purple-800 dark:text-purple-200">
                          Spend {shop.currencySymbol || '$'}{rule.minAmount} - {shop.currencySymbol || '$'}{rule.maxAmount}
                        </span>
                        <span className="font-bold text-xs text-purple-900 dark:text-purple-100">
                          Earn {rule.points} pts
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-between items-center bg-white dark:bg-purple-800/30 rounded px-2 py-1 mb-1">
                      <span className="text-xs text-purple-800 dark:text-purple-200">
                        No earning rules configured
                      </span>
                      <span className="font-bold text-xs text-purple-900 dark:text-purple-100">
                        0 pts
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center bg-white dark:bg-purple-800/30 rounded px-2 py-1">
                  <span className="text-sm text-purple-800 dark:text-purple-200">New customer gets</span>
                  <span className="font-bold text-purple-900 dark:text-purple-100" data-testid={`shop-discount-${shop.id}`}>
                    {shop.campaigns?.[0]?.referralDiscountPercentage ?? 0}% OFF
                  </span>
                </div>
                <div className="flex justify-between items-center bg-white dark:bg-purple-800/30 rounded px-2 py-1">
                  <span className="text-sm text-purple-800 dark:text-purple-200">Min. purchase</span>
                  <span className="font-bold text-purple-900 dark:text-purple-100">
                    {shop.currencySymbol || '$'}{shop.campaigns?.[0]?.minPurchaseAmount ?? 0}
                  </span>
                </div>
                <div className="border-t border-purple-300 dark:border-purple-600 pt-2">
                  <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">Redeem Points:</p>
                  <div className="flex justify-between items-center bg-white dark:bg-purple-800/30 rounded px-2 py-1">
                    <span className="text-xs text-purple-800 dark:text-purple-200">
                      {shop.campaigns?.[0]?.pointsRedemptionValue ?? 100} points
                    </span>
                    <span className="font-bold text-xs text-purple-900 dark:text-purple-100">
                      = {shop.campaigns?.[0]?.pointsRedemptionDiscount ?? 10}% discount
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}