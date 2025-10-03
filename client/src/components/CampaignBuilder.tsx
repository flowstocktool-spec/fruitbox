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

const campaignSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  pointsPerDollar: z.number().min(1, "Must be at least 1 point per dollar"),
  minPurchaseAmount: z.number().min(0, "Cannot be negative"),
  discountPercentage: z.number().min(1).max(100, "Must be between 1-100%"),
  couponColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface CampaignBuilderProps {
  onSubmit?: (data: CampaignFormData) => void;
  defaultValues?: Partial<CampaignFormData>;
}

export function CampaignBuilder({ onSubmit, defaultValues }: CampaignBuilderProps) {
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: "",
      description: "",
      pointsPerDollar: 1,
      minPurchaseAmount: 0,
      discountPercentage: 10,
      couponColor: "#7c3aed",
      ...defaultValues,
    },
  });

  const handleSubmit = (data: CampaignFormData) => {
    console.log("Campaign created:", data);
    onSubmit?.(data);
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="pointsPerDollar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Points per $1</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-points-per-dollar"
                      />
                    </FormControl>
                    <FormDescription>Reward points rate</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minPurchaseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min. Purchase ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-min-purchase"
                      />
                    </FormControl>
                    <FormDescription>Minimum to earn</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountPercentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Discount (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        data-testid="input-discount-percentage"
                      />
                    </FormControl>
                    <FormDescription>Friend's discount</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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

            <Button type="submit" className="w-full" data-testid="button-create-campaign">
              Create Campaign
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
