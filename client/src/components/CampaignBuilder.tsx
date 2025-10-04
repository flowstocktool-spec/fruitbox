import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Palette } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShopProfile } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const campaignSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  spendAmount: z.number().min(1, "Must be at least 1"),
  earnPoints: z.number().min(1, "Must be at least 1 point"),
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

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      spendAmount: 100,
      earnPoints: 5,
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
    mutationFn: async (data: CampaignFormData) => {
      return await apiRequest("POST", "/api/campaigns", {
        ...data,
        description: data.description || null,
        storeId,
        couponTextColor: "#ffffff",
        isActive: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
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
    createCampaignMutation.mutate(data);
  };

  return (
    <Card data-testid="card-campaign-builder">
      <CardHeader>
        <CardTitle className="font-heading">Create New Campaign</CardTitle>
        <CardDescription>Set up your referral campaign with custom rewards</CardDescription>
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
                <h3 className="text-sm font-semibold mb-3">Points Earning Rules</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="spendAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer Spends ({shopProfile?.currencySymbol || '$'})</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-spend-amount"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="earnPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Earns Points</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-earn-points"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Example: Spend {shopProfile?.currencySymbol || '$'}{form.watch("spendAmount")} = Earn {form.watch("earnPoints")} points
                </p>
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
      </CardContent>
    </Card>
  );
}