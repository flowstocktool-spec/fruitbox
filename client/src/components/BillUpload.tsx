import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, Gift } from "lucide-react";
import { createTransaction } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const billUploadSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  billImage: z.any().optional(),
});

type BillUploadData = z.infer<typeof billUploadSchema>;

interface PointRule {
  minAmount: number;
  maxAmount: number;
  points: number;
}

interface BillUploadProps {
  customerId: string;
  couponId: string | null;
  campaignId?: string;
  pointRules: PointRule[];
  minPurchaseAmount: number;
  discountPercentage?: number;
  referralCode?: string;
  shopName?: string;
  onSuccess?: () => void;
}

function calculatePointsFromRules(amount: number, pointRules: PointRule[]): number {
  for (const rule of pointRules) {
    if (amount >= rule.minAmount && amount <= rule.maxAmount) {
      return rule.points;
    }
  }
  return 0;
}

export function BillUpload({ customerId, couponId, campaignId, pointRules, minPurchaseAmount, referralCode, shopName, onSuccess }: BillUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [affiliateCode, setAffiliateCode] = useState(referralCode || "");
  const [affiliateDetails, setAffiliateDetails] = useState<any>(null);
  const [loadingAffiliate, setLoadingAffiliate] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [showRedemption, setShowRedemption] = useState(false);
  const { toast } = useToast();

  const form = useForm<BillUploadData>({
    resolver: zodResolver(billUploadSchema),
    defaultValues: {
      amount: 0,
    },
  });

  // Fetch customer data to get current points
  const customerQuery = useQuery({
    queryKey: ['/api/customers', customerId],
    queryFn: async () => {
      const response = await fetch(`/api/customers/${customerId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch customer');
      return response.json();
    },
    enabled: !!customerId,
  });

  // Fetch campaign data for redemption rules
  const campaignQuery = useQuery({
    queryKey: ['/api/campaigns', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      const response = await fetch(`/api/campaigns/${campaignId}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch campaign');
      return response.json();
    },
    enabled: !!campaignId,
  });


  const uploadMutation = useMutation({
    mutationFn: async (data: BillUploadData) => {
      // Validate couponId is present
      if (!couponId) {
        throw new Error("Coupon ID is required. Please make sure you're registered at this shop.");
      }

      // Convert file to base64 if exists
      let billImageUrl = undefined;
      if (selectedFile) {
        const reader = new FileReader();
        billImageUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      // Calculate points based on amount and point rules
      let earnedPoints = 0;
      if (pointRules && pointRules.length > 0) {
        for (const rule of pointRules) {
          if (data.amount >= rule.minAmount && data.amount <= rule.maxAmount) {
            earnedPoints = rule.points;
            break;
          }
        }
      }

      // Calculate discount based on campaign's redemption rules
      const campaign = campaignQuery.data;
      const pointsRedemptionValue = campaign?.pointsRedemptionValue || 100;
      const pointsRedemptionDiscount = campaign?.pointsRedemptionDiscount || 10;

      // Calculate how many redemption units the customer is using
      const redemptionUnits = Math.floor(pointsToRedeem / pointsRedemptionValue);
      const discountPercentage = redemptionUnits * pointsRedemptionDiscount;
      const billAmount = parseFloat(data.amount.toString());
      const calculatedDiscount = (billAmount * discountPercentage) / 100;

      // Calculate net points (earned points minus redeemed points)
      const netPoints = showRedemption && pointsToRedeem > 0
        ? earnedPoints - pointsToRedeem
        : earnedPoints;

      const transactionData = {
        customerId,
        couponId: couponId,
        campaignId: campaignId || undefined,
        type: "purchase" as const,
        amount: data.amount,
        points: netPoints, // This will be negative if redemption > earned
        status: "pending" as const,
        billImageUrl,
        referralCode: affiliateCode || undefined,
        shopName: shopName || "",
      };

      console.log("Creating transaction with data:", transactionData);

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to upload bill");
      }

      return response.json();
    },
    onSuccess: (response) => {
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setAffiliateCode("");
      setAffiliateDetails(null);
      setPointsToRedeem(0);
      setShowRedemption(false);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });

      const earnedPoints = response.points || 0;

      toast({
        title: "Bill uploaded successfully!",
        description: affiliateCode
          ? `Your bill is submitted with referral code ${affiliateCode}. You'll earn ${earnedPoints} points and get ${discountPercentage}% welcome discount on approval!`
          : `Your bill is pending approval. You'll earn ${earnedPoints} points once approved.`,
      });
      // Force refresh customer data
      customerQuery.refetch();
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const fetchAffiliateDetails = async (code: string) => {
    if (!code.trim()) {
      setAffiliateDetails(null);
      return;
    }

    setLoadingAffiliate(true);
    try {
      // First try to find as a customer coupon (shop-specific code)
      const couponResponse = await fetch(`/api/customer-coupons/code/${code}`);
      if (couponResponse.ok) {
        const coupon = await couponResponse.json();
        // Fetch the customer details
        const customerResponse = await fetch(`/api/customers/${coupon.customerId}`);
        if (customerResponse.ok) {
          const customer = await customerResponse.json();
          setAffiliateDetails(customer);
          toast({
            title: "Referral Code Valid!",
            description: `You'll use ${customer.name}'s referral code and get ${discountPercentage}% welcome discount!`,
          });
          return;
        }
      }

      // Fallback to checking main customer referral code
      const response = await fetch(`/api/customers/code/${code}`);
      if (response.ok) {
        const customer = await response.json();
        setAffiliateDetails(customer);
        toast({
          title: "Referral Code Valid!",
          description: `You'll use ${customer.name}'s referral code and get ${discountPercentage}% welcome discount!`,
        });
      } else {
        setAffiliateDetails(null);
        toast({
          title: "Invalid Code",
          description: "The referral code you entered is not valid.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setAffiliateDetails(null);
      toast({
        title: "Error",
        description: "Failed to verify referral code.",
        variant: "destructive",
      });
    } finally {
      setLoadingAffiliate(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (data: BillUploadData) => {
    if (data.amount < minPurchaseAmount) {
      toast({
        title: "Minimum purchase not met",
        description: `Minimum purchase amount is $${minPurchaseAmount}`,
        variant: "destructive",
      });
      return;
    }

    const purchaseAmount = parseFloat(data.amount.toString());

    // Validate points redemption if requested
    if (pointsToRedeem > 0) {
      const availablePoints = (customerQuery.data?.totalPoints || 0) - (customerQuery.data?.redeemedPoints || 0);

      if (pointsToRedeem > availablePoints) {
        toast({
          title: "Error",
          description: `You only have ${availablePoints} points available`,
          variant: "destructive",
        });
        return;
      }
    }

    uploadMutation.mutate(data);
  };

  // Calculate discount based on campaign's redemption rules
  const campaign = campaignQuery.data;
  const pointsRedemptionValue = campaign?.pointsRedemptionValue || 100;
  const pointsRedemptionDiscount = campaign?.pointsRedemptionDiscount || 10;

  // Calculate how many redemption units the customer is using
  const redemptionUnits = Math.floor(pointsToRedeem / pointsRedemptionValue);
  const discountPercentage = redemptionUnits * pointsRedemptionDiscount;
  const billAmount = parseFloat(form.getValues('amount')?.toString() || '0');
  const calculatedDiscount = (billAmount * discountPercentage) / 100;
  const remainingPoints = Math.max(0, (customerQuery.data?.totalPoints || 0) - (customerQuery.data?.redeemedPoints || 0) - pointsToRedeem);


  return (
    <Card data-testid="card-bill-upload" className="border-card-border">
      <CardHeader className="space-y-1">
        <CardTitle className="font-heading text-2xl">Upload Bill</CardTitle>
        <CardDescription className="text-base">Submit your purchase for verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Campaign Benefits Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Campaign Benefits</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-md p-3 border border-card-border">
                  <p className="text-xs text-muted-foreground mb-1">Welcome Discount</p>
                  <p className="text-lg font-bold text-primary">{discountPercentage}% OFF</p>
                </div>
                <div className="bg-card rounded-md p-3 border border-card-border">
                  <p className="text-xs text-muted-foreground mb-1">Min. Purchase</p>
                  <p className="text-lg font-bold text-foreground">${minPurchaseAmount}</p>
                </div>
              </div>
            </div>

            {/* Referral Code Section */}
            {!referralCode && (
              <div className="border border-card-border bg-accent/50 rounded-lg p-4 space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Have a Referral Code?</h3>
                  <p className="text-sm text-muted-foreground">
                    Enter a friend's code to get your welcome discount
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter code"
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                      data-testid="input-affiliate-code"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fetchAffiliateDetails(affiliateCode)}
                      disabled={loadingAffiliate || !affiliateCode.trim()}
                      data-testid="button-verify-code"
                    >
                      {loadingAffiliate ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                  {affiliateDetails && (
                    <div className="bg-chart-2/10 border border-chart-2/30 rounded-md p-3">
                      <p className="text-sm font-medium text-foreground">
                        ✓ Referred by {affiliateDetails.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {discountPercentage}% discount will be applied on approval
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purchase Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => {
                        field.onChange(Number(e.target.value));
                        // Update preview amount when amount changes
                        const amountValue = parseFloat(e.target.value);
                        if (!isNaN(amountValue)) {
                          // Recalculate discount and final amount when amount changes
                          const redemptionUnits = Math.floor(pointsToRedeem / pointsRedemptionValue);
                          const currentDiscountPercentage = redemptionUnits * pointsRedemptionDiscount;
                          const currentCalculatedDiscount = (amountValue * currentDiscountPercentage) / 100;
                          const currentFinalAmount = Math.max(0, amountValue - currentCalculatedDiscount);
                          // This is a bit of a hack to trigger a re-render for the preview amount
                          // A more robust solution would involve lifting state or using a state management library
                          setPointsToRedeem(pointsToRedeem); // No change, but forces re-render
                        }
                      }}
                      data-testid="input-bill-amount"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <div className="space-y-3">
              <Label className="text-base">Bill Image (Optional)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('bill-file')?.click()}
                  className="h-auto py-4"
                  data-testid="button-upload-bill"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Choose File
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById('bill-camera') as HTMLInputElement;
                    input?.click();
                  }}
                  className="h-auto py-4"
                  data-testid="button-camera-bill"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Take Photo
                </Button>
              </div>

              <input
                id="bill-file"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <input
                id="bill-camera"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />

              {previewUrl && (
                <div className="border border-card-border rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Bill preview"
                    className="w-full h-48 object-cover"
                    data-testid="img-bill-preview"
                  />
                </div>
              )}
            </div>

            {/* Points Redemption Section */}
            <div className="border-t border-border pt-6">
              <div className="border border-card-border bg-accent/30 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Redeem Points</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRedemption(!showRedemption)}
                  >
                    {showRedemption ? "Hide" : "Show"}
                  </Button>
                </div>

                {showRedemption && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-card rounded-md border border-card-border">
                      <span className="text-sm text-muted-foreground">Available Points</span>
                      <span className="text-lg font-bold text-primary">
                        {((customerQuery.data?.totalPoints || 0) - (customerQuery.data?.redeemedPoints || 0)).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pointsToRedeem">Points to Use</Label>
                      <Input
                        id="pointsToRedeem"
                        type="number"
                        min="0"
                        max={(customerQuery.data?.totalPoints || 0) - (customerQuery.data?.redeemedPoints || 0)}
                        value={pointsToRedeem}
                        onChange={(e) => setPointsToRedeem(Math.max(0, parseInt(e.target.value) || 0))}
                        placeholder="Enter points"
                      />
                    </div>

                    {pointsToRedeem > 0 && (
                      <div className="p-4 bg-card rounded-md border border-card-border space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Bill Amount</span>
                          <span className="font-medium">${form.getValues('amount').toString() || '0'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Discount</span>
                          <span className="font-medium text-chart-2">-${calculatedDiscount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                          <span>Final Amount</span>
                          <span className="text-primary">${Math.max(0, billAmount - calculatedDiscount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-2">
                          <span>Points After</span>
                          <span>{remainingPoints.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={uploadMutation.isPending || customerQuery.isLoading || campaignQuery.isLoading}
              data-testid="button-submit-bill"
            >
              {uploadMutation.isPending ? "Uploading..." : "Submit Bill for Approval"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}