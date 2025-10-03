import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Store, Plus, Check, Tag, Gift } from "lucide-react";
import { getShopProfiles, createCustomerCoupon, getCampaigns } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShopSearchProps {
  customerId: string;
  existingShopIds: string[];
}

export function ShopSearch({ customerId, existingShopIds }: ShopSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: shops = [] } = useQuery({
    queryKey: ['/api/shop-profiles'],
    queryFn: getShopProfiles,
  });

  const createCouponMutation = useMutation({
    mutationFn: async (shopProfileId: string) => {
      if (!customerId) {
        throw new Error("Customer ID is missing. Please log in again.");
      }
      if (!shopProfileId) {
        throw new Error("Shop ID is missing.");
      }

      console.log("Registering coupon:", { customerId, shopProfileId });

      const response = await fetch("/api/customer-coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          shopProfileId,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error("Registration error response:", error);
        throw new Error(error.error || "Failed to register as affiliate");
      }
      return response.json();
    },
    onSuccess: (newCoupon) => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-coupons', customerId] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers', customerId, 'shops'] });
      toast({
        title: "Registered as Affiliate!",
        description: `Your unique referral code: ${newCoupon.referralCode}. Share it to earn rewards!`,
        duration: 8000,
      });
    },
    onError: (error: any) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register as affiliate",
        variant: "destructive",
      });
    },
  });

  const filteredShops = shops.filter(shop =>
    shop.shopName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shop.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search shops by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filteredShops.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No shops found</p>
            </CardContent>
          </Card>
        ) : (
          filteredShops.map((shop) => {
            const hasCoupon = existingShopIds.includes(shop.id);
            const isExpanded = expandedShopId === shop.id;

            return (
              <ShopCard 
                key={shop.id} 
                shop={shop} 
                hasCoupon={hasCoupon}
                isExpanded={isExpanded}
                onToggleExpand={() => setExpandedShopId(isExpanded ? null : shop.id)}
                onRegister={() => createCouponMutation.mutate(shop.id)}
                isPending={createCouponMutation.isPending}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

function ShopCard({ 
  shop, 
  hasCoupon, 
  isExpanded, 
  onToggleExpand, 
  onRegister,
  isPending 
}: { 
  shop: any; 
  hasCoupon: boolean; 
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRegister: () => void;
  isPending: boolean;
}) {
  const { data: campaigns = [] } = useQuery({
    queryKey: ['/api/campaigns', shop.id],
    queryFn: () => getCampaigns(shop.id),
    enabled: isExpanded,
  });

  const activeCampaigns = campaigns.filter((c: any) => c.isActive);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{shop.shopName}</CardTitle>
            {shop.description && (
              <CardDescription className="mt-1">{shop.description}</CardDescription>
            )}
            <div className="flex items-center gap-2 mt-2">
              {shop.category && (
                <Badge variant="secondary" className="text-xs">
                  {shop.category}
                </Badge>
              )}
              {shop.address && (
                <span className="text-xs text-muted-foreground">{shop.address}</span>
              )}
            </div>
            {shop.phone && (
              <p className="text-xs text-muted-foreground mt-1">📞 {shop.phone}</p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Points/₹</p>
              <p className="font-bold text-green-600">{shop.pointsPerDollar}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Discount</p>
              <p className="font-bold text-blue-600">{shop.discountPercentage}%</p>
            </div>
          </div>
          {hasCoupon ? (
            <Button variant="outline" disabled>
              <Check className="h-4 w-4 mr-2" />
              Registered
            </Button>
          ) : (
            <Button 
              onClick={onRegister}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Register as Affiliate
            </Button>
          )}
        </div>

        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full"
          onClick={onToggleExpand}
        >
          <Tag className="h-4 w-4 mr-2" />
          {isExpanded ? 'Hide' : 'View'} Campaigns & Offers
        </Button>

        {isExpanded && (
          <div className="space-y-2 pt-2 border-t">
            {activeCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">
                No active campaigns at the moment
              </p>
            ) : (
              activeCampaigns.map((campaign: any) => (
                <Card key={campaign.id} className="bg-muted/50">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm">{campaign.name}</h4>
                        {campaign.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {campaign.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="default" className="shrink-0">
                        <Gift className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">Points/₹</p>
                        <p className="font-bold text-green-600">{campaign.pointsPerDollar}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Min Purchase</p>
                        <p className="font-bold">₹{campaign.minPurchaseAmount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Discount</p>
                        <p className="font-bold text-blue-600">{campaign.discountPercentage}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}