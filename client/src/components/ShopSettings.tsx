import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createShopProfile, updateShopProfile } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ShopSettingsProps {
  shopProfile?: any;
  onSuccess?: () => void;
}

export function ShopSettings({ shopProfile, onSuccess }: ShopSettingsProps) {
  const isEdit = !!shopProfile;
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    shopName: shopProfile?.shopName || "",
    shopCode: shopProfile?.shopCode || "",
    description: shopProfile?.description || "",
    category: shopProfile?.category || "",
    address: shopProfile?.address || "",
    phone: shopProfile?.phone || "",
    currency: shopProfile?.currency || "INR",
    currencySymbol: shopProfile?.currencySymbol || "₹",
    pointsPerUnit: shopProfile?.pointsPerUnit || 1,
    discountPercentage: shopProfile?.discountPercentage || 10,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit) {
        return updateShopProfile(shopProfile.id, data);
      }
      return createShopProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-profiles'] });
      toast({
        title: "Success!",
        description: isEdit ? "Shop settings updated" : "Shop profile created",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save shop settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="shopName">Shop Name *</Label>
          <Input
            id="shopName"
            value={formData.shopName}
            onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="shopCode">Shop Code *</Label>
          <Input
            id="shopCode"
            value={formData.shopCode}
            onChange={(e) => setFormData({ ...formData, shopCode: e.target.value })}
            placeholder="e.g., FRUITBOX2025"
            required
            disabled={isEdit}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Unique code for your shop (cannot be changed later)
          </p>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of your shop"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., Grocery, Fashion, Electronics"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rewards Settings</CardTitle>
          <CardDescription>Configure how customers earn points</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                placeholder="INR, USD, EUR, etc."
                required
              />
            </div>
            <div>
              <Label htmlFor="currencySymbol">Currency Symbol</Label>
              <Input
                id="currencySymbol"
                value={formData.currencySymbol}
                onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                placeholder="₹, $, €, etc."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pointsPerUnit">Points per Currency Unit</Label>
              <Input
                id="pointsPerUnit"
                type="number"
                min="1"
                value={formData.pointsPerUnit}
                onChange={(e) => setFormData({ ...formData, pointsPerUnit: parseInt(e.target.value) })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Points customers earn for every unit of currency spent
              </p>
            </div>
            <div>
              <Label htmlFor="discountPercentage">Referral Discount (%)</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="0"
                max="100"
                value={formData.discountPercentage}
                onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Discount customers get when using referral codes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? "Saving..." : isEdit ? "Update Settings" : "Create Shop Profile"}
      </Button>
    </form>
  );
}