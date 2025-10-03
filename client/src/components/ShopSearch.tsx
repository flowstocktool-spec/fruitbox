
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Store, Plus, Check } from "lucide-react";
import { getShopProfiles, createCustomerCoupon } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
    mutationFn: (shopProfileId: string) => createCustomerCoupon({
      customerId,
      shopProfileId,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-coupons'] });
      toast({
        title: "Success!",
        description: "Coupon added! You can now shop and earn points.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add coupon",
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
            return (
              <Card key={shop.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{shop.shopName}</CardTitle>
                      {shop.description && (
                        <CardDescription className="mt-1">{shop.description}</CardDescription>
                      )}
                      {shop.category && (
                        <p className="text-xs text-muted-foreground mt-1">Category: {shop.category}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
                        Added
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => createCouponMutation.mutate(shop.id)}
                        disabled={createCouponMutation.isPending}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Coupon
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
