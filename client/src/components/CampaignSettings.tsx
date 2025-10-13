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
import { Trash2, Plus } from "lucide-react";
import type { Campaign } from "@shared/schema";

interface CampaignSettingsProps {
  campaign: Campaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PointRule {
  minAmount: number;
  maxAmount: number;
  points: number;
}

export function CampaignSettings({ campaign, open, onOpenChange }: CampaignSettingsProps) {
  const { toast } = useToast();
  const [pointRules, setPointRules] = useState<PointRule[]>(
    (campaign as any).pointRules || [{ minAmount: 0, maxAmount: 999999, points: 10 }]
  );
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description || "",
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
    mutationFn: async (data: typeof formData & { pointRules: PointRule[] }) => {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update campaign");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", { storeId: campaign.storeId }] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", { storeId: campaign.storeId }] });
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
    updateMutation.mutate({ ...formData, pointRules });
  };

  const addPointRule = () => {
    const lastRule = pointRules[pointRules.length - 1];
    const newMinAmount = lastRule ? lastRule.maxAmount : 0;
    setPointRules([...pointRules, { minAmount: newMinAmount, maxAmount: newMinAmount + 100, points: 10 }]);
  };

  const removePointRule = (index: number) => {
    if (pointRules.length > 1) {
      setPointRules(pointRules.filter((_, i) => i !== index));
    }
  };

  const updatePointRule = (index: number, field: keyof PointRule, value: number) => {
    const newRules = [...pointRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setPointRules(newRules);
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
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Points Earning Rules</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={addPointRule}
                  data-testid="button-add-point-rule"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Range
                </Button>
              </div>

              <div className="space-y-3">
                {pointRules.map((rule, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor={`minAmount-${index}`} className="text-xs">Min Amount</Label>
                        <Input
                          id={`minAmount-${index}`}
                          type="number"
                          min="0"
                          value={rule.minAmount}
                          onChange={(e) => updatePointRule(index, 'minAmount', parseInt(e.target.value) || 0)}
                          required
                          data-testid={`input-min-amount-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`maxAmount-${index}`} className="text-xs">Max Amount</Label>
                        <Input
                          id={`maxAmount-${index}`}
                          type="number"
                          min="0"
                          value={rule.maxAmount}
                          onChange={(e) => updatePointRule(index, 'maxAmount', parseInt(e.target.value) || 0)}
                          required
                          data-testid={`input-max-amount-${index}`}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`points-${index}`} className="text-xs">Points Earned</Label>
                        <Input
                          id={`points-${index}`}
                          type="number"
                          min="0"
                          value={rule.points}
                          onChange={(e) => updatePointRule(index, 'points', parseInt(e.target.value) || 0)}
                          required
                          data-testid={`input-points-${index}`}
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePointRule(index)}
                          disabled={pointRules.length === 1}
                          className="w-full"
                          data-testid={`button-remove-rule-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Spend ${rule.minAmount} to ${rule.maxAmount} → Earn {rule.points} points
                    </p>
                  </div>
                ))}
              </div>
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
                data-testid="input-min-purchase"
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
          
          <div className="space-y-2">
            <Label htmlFor="termsAndConditions">Special Offers & Terms</Label>
            <Textarea
              id="termsAndConditions"
              value={formData.termsAndConditions || ''}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              placeholder="e.g., Christmas Special: Buy 1 Get 1 Free on selected items"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Add special promotions or terms & conditions
            </p>
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