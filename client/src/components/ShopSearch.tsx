import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Store, Plus, Check, ExternalLink } from "lucide-react";
import { getShopProfiles, createCustomerCoupon } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { setLocation } from "wouter";

interface ShopSearchProps {
  customerId: string;
  existingShopIds: string[];
}

export function ShopSearch({ customerId, existingShopIds }: ShopSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
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
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        console.error("Registration error response:", error);
        throw new Error(error.error || "Failed to register as affiliate");
      }
      return response.json();
    },
    onSuccess: (newCoupon) => {
      // Invalidate all related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ['/api/customer-coupons', customerId] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers', customerId, 'shops'] });
      queryClient.invalidateQueries({ queryKey: ['/api/shop-profiles'] });

      toast({
        title: "✅ Successfully Registered!",
        description: `You're now an affiliate! Check the "Share" tab to see your coupon code: ${newCoupon.referralCode}`,
        duration: 10000,
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

  // Separate shops into available and registered
  const availableShops = filteredShops.filter(shop => !existingShopIds.includes(shop.id));
  const registeredShops = filteredShops.filter(shop => existingShopIds.includes(shop.id));

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
        {/* Available Shops First */}
        {availableShops.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-muted-foreground px-1">Available Shops</h3>
            {availableShops.map((shop) => (
              <ShopCard 
                key={shop.id} 
                shop={shop} 
                hasCoupon={false}
                onRegister={() => createCouponMutation.mutate(shop.id)}
                isPending={createCouponMutation.isPending}
                setLocation={setLocation}
              />
            ))}
          </>
        )}

        {/* Registered Shops Second */}
        {registeredShops.length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-muted-foreground px-1 mt-6">Registered Shops</h3>
            {registeredShops.map((shop) => (
              <ShopCard 
                key={shop.id} 
                shop={shop} 
                hasCoupon={true}
                onRegister={() => {}}
                isPending={false}
                setLocation={setLocation}
              />
            ))}
          </>
        )}

        {/* No shops found */}
        {filteredShops.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No shops found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function ShopCard({ 
  shop, 
  hasCoupon, 
  onRegister,
  isPending,
  setLocation
}: { 
  shop: any; 
  hasCoupon: boolean; 
  onRegister: () => void;
  isPending: boolean;
  setLocation: (path: string) => void;
}) {
  const isAlreadyJoined = hasCoupon; // Assuming hasCoupon implies already joined for this context

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
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{shop.shopName}</p>
              <p className="text-xs text-muted-foreground">{shop.shopCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(`/shop/${shop.shopCode}`)}
              data-testid={`button-view-shop-${shop.id}`}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View
            </Button>
            {isAlreadyJoined ? (
              <Badge variant="secondary" className="gap-1">
                <Check className="h-3 w-3" />
                Registered
              </Badge>
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
        </div>
      </CardContent>
    </Card>
  );
}