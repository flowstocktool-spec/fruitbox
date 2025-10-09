import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette, Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShopProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PointRule {
  minAmount: number;
  maxAmount: number;
  points: number;
}

const pointRuleSchema = z.object({
  minAmount: z.number().min(0),
  maxAmount: z.number().min(0),
  points: z.number().min(0),
});

const campaignSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  minPurchaseAmount: z.number().min(0, "Cannot be negative"),
  referralDiscountPercentage: z.number().min(1).max(100, "Must be between 1-100%"),
  pointsRedemptionValue: z.number().min(1, "Must be at least 1 point"),
  pointsRedemptionDiscount: z.number().min(1).max(100, "Must be between 1-100%"),
  termsAndConditions: z.string().optional(),
  couponColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignBuilderProps {
  onSubmit?: (data: CampaignFormData) => void;
  defaultValues?: Partial<CampaignFormData>;
  storeId: string;
}

export function CampaignBuilder({ onSubmit, defaultValues, storeId }: CampaignBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pointRules, setPointRules] = useState<PointRule[]>([
    { minAmount: 0, maxAmount: 100, points: 10 },
    { minAmount: 100, maxAmount: 200, points: 20 },
    { minAmount: 200, maxAmount: 500, points: 50 },
  ]);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      minPurchaseAmount: 0,
      referralDiscountPercentage: 10,
      pointsRedemptionValue: 100,
      pointsRedemptionDiscount: 10,
      termsAndConditions: "",
      couponColor: "#7c3aed",
      ...defaultValues,
    },
  });

  const { data: shopProfile } = useQuery({
    queryKey: ["shop-profile", storeId],
    queryFn: () => getShopProfile(storeId),
    enabled: !!storeId,
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: CampaignFormData & { pointRules: PointRule[] }) => {
      return await apiRequest("POST", "/api/campaigns", {
        ...data,
        description: data.description || null,
        storeId,
        couponTextColor: "#ffffff",
        isActive: true,
        pointRules: data.pointRules,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns", { storeId }] });
      form.reset();
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully",
      });
      onSubmit?.({} as CampaignFormData);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: CampaignFormData) => {
    createCampaignMutation.mutate({ ...data, pointRules });
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
    <Card data-testid="card-campaign-builder">
      <CardHeader>
        <CardTitle className="font-heading">Setup Your Points System</CardTitle>
        <CardDescription>Configure how customers earn and redeem points</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Summer Rewards Program" {...field} data-testid="input-campaign-name" />
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
                      placeholder="Describe your campaign..."
                      {...field}
                      data-testid="input-campaign-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Points Earning Rules</h3>
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
                          <Label htmlFor={`minAmount-${index}`} className="text-xs">Min Amount ({shopProfile?.currencySymbol || '$'})</Label>
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
                          <Label htmlFor={`maxAmount-${index}`} className="text-xs">Max Amount ({shopProfile?.currencySymbol || '$'})</Label>
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
                        Spend {shopProfile?.currencySymbol || '$'}{rule.minAmount} to {shopProfile?.currencySymbol || '$'}{rule.maxAmount} → Earn {rule.points} points
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <FormField
                control={form.control}
                name="minPurchaseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min. Purchase Amount ({shopProfile?.currencySymbol || '$'})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-min-purchase"
                      />
                    </FormControl>
                    <FormDescription>Minimum amount to qualify for earning points</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Referral Benefits</h3>
              <FormField
                control={form.control}
                name="referralDiscountPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Customer Discount (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-referral-discount"
                      />
                    </FormControl>
                    <FormDescription>Discount for customers using a referral code</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Points Redemption Rules</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pointsRedemptionValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Required</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-redemption-points"
                        />
                      </FormControl>
                      <FormDescription>How many points to redeem</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pointsRedemptionDiscount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Redemption Discount (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-redemption-discount"
                        />
                      </FormControl>
                      <FormDescription>Discount % for those points</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Example: {form.watch("pointsRedemptionValue")} points = {form.watch("pointsRedemptionDiscount")}% off
              </p>
            </div>

            <FormField
              control={form.control}
              name="termsAndConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Terms & Conditions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter terms and conditions for this campaign..."
                      {...field}
                      data-testid="input-terms"
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>Optional: Add any specific rules or conditions</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="couponColor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Coupon Color</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        {...field}
                        className="w-20 h-10 p-1 cursor-pointer"
                        data-testid="input-coupon-color"
                      />
                      <Input
                        {...field}
                        placeholder="#7c3aed"
                        className="flex-1"
                      />
                    </div>
                  </FormControl>
                  <FormDescription>Choose your brand color</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              data-testid="button-create-campaign"
              disabled={createCampaignMutation.isPending}
            >
              {createCampaignMutation.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}