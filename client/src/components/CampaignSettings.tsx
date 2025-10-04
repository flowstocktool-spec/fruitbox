import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import type { Campaign } from "@shared/schema";

interface CampaignSettingsProps {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CampaignSettings({ campaign, open, onOpenChange }: CampaignSettingsProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description || "",
    spendAmount: (campaign as any).spendAmount || 100,
    earnPoints: (campaign as any).earnPoints || 5,
    minPurchaseAmount: campaign.minPurchaseAmount,
    referralDiscountPercentage: (campaign as any).referralDiscountPercentage || 10,
    pointsRedemptionValue: (campaign as any).pointsRedemptionValue || 100,
    pointsRedemptionDiscount: (campaign as any).pointsRedemptionDiscount || 10,
    termsAndConditions: (campaign as any).termsAndConditions || "",
    isActive: campaign.isActive,
    couponColor: campaign.couponColor,
    couponTextColor: campaign.couponTextColor,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update campaign");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Success",
        description: "Campaign updated successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete campaign");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Campaign Settings</DialogTitle>
          <DialogDescription>
            Update your campaign details and settings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-4">
            <div className="border-t pt-4">
              <Label className="text-sm font-semibold">Points Earning Rules</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="spendAmount">Customer Spends</Label>
                  <Input
                    id="spendAmount"
                    type="number"
                    min="1"
                    value={formData.spendAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, spendAmount: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="earnPoints">Earns Points</Label>
                  <Input
                    id="earnPoints"
                    type="number"
                    min="1"
                    value={formData.earnPoints}
                    onChange={(e) =>
                      setFormData({ ...formData, earnPoints: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Example: Spend ${formData.spendAmount} = Earn {formData.earnPoints} points
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minPurchaseAmount">Min. Purchase Amount</Label>
              <Input
                id="minPurchaseAmount"
                type="number"
                min="0"
                value={formData.minPurchaseAmount}
                onChange={(e) =>
                  setFormData({ ...formData, minPurchaseAmount: parseInt(e.target.value) })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="referralDiscountPercentage">New Customer Referral Discount %</Label>
            <Input
              id="referralDiscountPercentage"
              type="number"
              min="0"
              max="100"
              value={formData.referralDiscountPercentage}
              onChange={(e) =>
                setFormData({ ...formData, referralDiscountPercentage: parseInt(e.target.value) })
              }
              required
            />
          </div>

          <div className="border-t pt-4">
            <Label className="text-sm font-semibold">Points Redemption Rules</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="pointsRedemptionValue">Points Required</Label>
                <Input
                  id="pointsRedemptionValue"
                  type="number"
                  min="1"
                  value={formData.pointsRedemptionValue}
                  onChange={(e) =>
                    setFormData({ ...formData, pointsRedemptionValue: parseInt(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pointsRedemptionDiscount">Discount %</Label>
                <Input
                  id="pointsRedemptionDiscount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.pointsRedemptionDiscount}
                  onChange={(e) =>
                    setFormData({ ...formData, pointsRedemptionDiscount: parseInt(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formData.pointsRedemptionValue} points = {formData.pointsRedemptionDiscount}% off
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
            <Textarea
              id="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={(e) =>
                setFormData({ ...formData, termsAndConditions: e.target.value })
              }
              rows={4}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="couponColor">Coupon Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.couponColor}
                onChange={(e) => setFormData({ ...formData, couponColor: e.target.value })}
                className="w-20 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.couponColor}
                onChange={(e) => setFormData({ ...formData, couponColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="couponTextColor">Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={formData.couponTextColor}
                onChange={(e) => setFormData({ ...formData, couponTextColor: e.target.value })}
                className="w-20 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.couponTextColor}
                onChange={(e) => setFormData({ ...formData, couponTextColor: e.target.value })}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="isActive">Campaign Status</Label>
            <p className="text-sm text-muted-foreground">
              {formData.isActive ? "Campaign is active" : "Campaign is inactive"}
            </p>
          </div>
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            className="flex-1"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              if (confirm("Are you sure you want to delete this campaign?")) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
);
}