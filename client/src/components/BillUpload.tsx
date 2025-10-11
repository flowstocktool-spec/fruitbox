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

// Utility function to compress image
const compressImage = async (file: File, maxWidth = 1024, quality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with compression
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

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

  // Get campaign redemption settings
  const campaign = campaignQuery.data;
  const pointsRedemptionValue = campaign?.pointsRedemptionValue || 0;
  const pointsRedemptionDiscount = campaign?.pointsRedemptionDiscount || 0;
  const referralDiscountPercentage = campaign?.referralDiscountPercentage || 0;

  const uploadMutation = useMutation({
    mutationFn: async (data: BillUploadData) => {
      // Validate couponId is present
      if (!couponId) {
        throw new Error("Coupon ID is required. Please make sure you're registered at this shop.");
      }

      // Compress and convert file to base64 if exists
      let billImageUrl = undefined;
      if (selectedFile) {
        try {
          // Compress image to max 1024px width and 70% quality
          billImageUrl = await compressImage(selectedFile, 1024, 0.7);
          console.log('Original file size:', (selectedFile.size / 1024).toFixed(2), 'KB');
          console.log('Compressed size:', (billImageUrl.length / 1024).toFixed(2), 'KB');
        } catch (error) {
          console.error('Image compression failed:', error);
          toast({
            title: "Image compression failed",
            description: "Please try a different image",
            variant: "destructive",
          });
          throw error;
        }
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

      const transactionData = {
        customerId,
        couponId: couponId,
        campaignId: campaignId || undefined,
        type: "purchase" as const,
        amount: data.amount,
        status: "pending" as const,
        billImageUrl,
        referralCode: affiliateCode || undefined,
        pointsRedeemed: pointsToRedeem || 0,
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
        const errorData = await response.json().catch(() => ({ error: "Failed to upload bill" }));
        throw new Error(errorData.error || "Failed to upload bill");
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

      // Show appropriate message based on discount type
      let description = "Your bill is pending approval.";

      if (response.discountType === "referral") {
        description = `Referral code applied! You'll get ${response.discountAmount}% off and earn points on approval.`;
      } else if (response.discountType === "points" && response.pointsRedeemed > 0) {
        description = `${response.pointsRedeemed} points redeemed for $${response.discountAmount} discount! You'll earn points from this purchase too.`;
      } else if (response.points > 0) {
        description = `You'll earn ${response.points} points once approved.`;
      }

      toast({
        title: "Bill uploaded successfully!",
        description,
      });
      // Force refresh customer data
      customerQuery.refetch();
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Please try again.",
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
            description: `You'll use ${customer.name}'s referral code and get ${referralDiscountPercentage}% welcome discount!`,
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
          description: `You'll use ${customer.name}'s referral code and get ${referralDiscountPercentage}% welcome discount!`,
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

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size and show warning if very large
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 5) {
        toast({
          title: "Large image detected",
          description: `Image is ${fileSizeMB.toFixed(1)}MB. It will be compressed for upload.`,
        });
      }

      setSelectedFile(file);
      
      // Create compressed preview
      try {
        const compressedUrl = await compressImage(file, 800, 0.8);
        setPreviewUrl(compressedUrl);
      } catch (error) {
        // Fallback to original if compression fails
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      }
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

  // Calculate points redemption discount (proportional based on shop's settings)
  const billAmount = parseFloat(form.getValues('amount')?.toString() || '0');
  let pointsDiscountPercentage = 0;
  let pointsCalculatedDiscount = 0;

  if (pointsRedemptionValue > 0 && pointsRedemptionDiscount > 0) {
    // Proportional: if shop sets 100 points = 10% off, then 50 points = 5% off
    pointsDiscountPercentage = (pointsToRedeem / pointsRedemptionValue) * pointsRedemptionDiscount;
    pointsCalculatedDiscount = (billAmount * pointsDiscountPercentage) / 100;
  }

  const remainingPoints = Math.max(0, (customerQuery.data?.totalPoints || 0) - (customerQuery.data?.redeemedPoints || 0) - pointsToRedeem);

  // Calculate referral/welcome discount (only if referral code is verified)
  const welcomeDiscountAmount = affiliateDetails && affiliateCode ? (billAmount * referralDiscountPercentage) / 100 : 0;


  return (
    <Card data-testid="card-bill-upload" className="border-card-border">
      <CardHeader className="space-y-1">
        <CardTitle className="font-heading text-2xl">Upload Bill</CardTitle>
        <CardDescription className="text-base">Submit your purchase for verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Explanation Banner */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-2">📋 How to Submit Your Bill</h3>

                <div className="space-y-2">
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded p-2">
                    <p className="font-semibold text-blue-900 dark:text-blue-100 text-sm mb-1">🎁 NEW CUSTOMER? Use Referral Code</p>
                    <p className="text-xs text-blue-800 dark:text-blue-200">
                      If this is your first purchase, enter a friend's referral code above to get a welcome discount. Your friend will also earn points!
                    </p>
                  </div>

                  <div className="bg-purple-100 dark:bg-purple-900/30 rounded p-2">
                    <p className="font-semibold text-purple-900 dark:text-purple-100 text-sm mb-1">💎 EXISTING CUSTOMER? Redeem Points</p>
                    <p className="text-xs text-purple-800 dark:text-purple-200">
                      Already have points? Use the "Redeem Your Points" section below to get a discount on this purchase.
                    </p>
                  </div>
                </div>

                <ol className="text-sm text-gray-800 dark:text-gray-200 space-y-1 list-decimal list-inside mt-3">
                  <li>Enter purchase amount (must match your bill)</li>
                  <li>Upload clear photo of original bill</li>
                  <li>Apply referral code OR redeem points (if applicable)</li>
                  <li>Submit for approval</li>
                </ol>

                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>Important:</strong> Upload only original, clear bills from the shop. Duplicate or fake bills will be rejected and may result in account suspension.
                  </p>
                </div>
              </div>

            {/* Submission Type Selection */}
            {!referralCode && !affiliateDetails && !showRedemption && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-4">Choose how to submit your bill:</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto py-6 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => {
                      // Show referral code input
                      const section = document.getElementById('referral-section');
                      if (section) section.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    <Gift className="h-6 w-6 text-primary" />
                    <div className="text-center">
                      <p className="font-semibold">New Customer</p>
                      <p className="text-xs text-muted-foreground">Use friend's referral code</p>
                    </div>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto py-6 flex flex-col gap-2 border-2 hover:border-primary hover:bg-primary/5"
                    onClick={() => setShowRedemption(true)}
                  >
                    <Gift className="h-6 w-6 text-chart-2" />
                    <div className="text-center">
                      <p className="font-semibold">Existing Customer</p>
                      <p className="text-xs text-muted-foreground">Redeem your points</p>
                    </div>
                  </Button>
                </div>
              </div>
            )}

            {/* Referral Code Section - Only show if not using referral code prop and not redeeming points */}
            {!referralCode && !showRedemption && !affiliateDetails && (
              <div id="referral-section" className="border border-card-border bg-accent/50 rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">New Customer - Use Referral Code</h3>
                    <p className="text-sm text-muted-foreground">
                      Enter a friend's code to get {referralDiscountPercentage}% welcome discount
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Enter friend's code"
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
                </div>
              </div>
            )}

            {/* Show verified referral details */}
            {affiliateDetails && !showRedemption && (
              <div className="bg-chart-2/10 border border-chart-2/30 rounded-md p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      ✓ Referred by {affiliateDetails.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {referralDiscountPercentage}% welcome discount will be applied on approval
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setAffiliateCode("");
                      setAffiliateDetails(null);
                    }}
                  >
                    Clear
                  </Button>
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
                        // Trigger re-render to update calculated amounts
                        setPointsToRedeem(pointsToRedeem); // No change, but forces re-render
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

            {/* Points Redemption Section - Only show if selected and NOT using referral code */}
            {!affiliateDetails && showRedemption && (
            <div className="border-t border-border pt-6">
              <div className="border border-card-border bg-accent/30 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-chart-2" />
                    <h3 className="font-semibold text-foreground">Existing Customer - Redeem Points</h3>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowRedemption(false);
                      setPointsToRedeem(0);
                    }}
                  >
                    Cancel
                  </Button>
                </div>

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
                        <span className="text-muted-foreground">Points Discount ({pointsDiscountPercentage.toFixed(1)}%)</span>
                        <span className="font-medium text-chart-2">-${pointsCalculatedDiscount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t border-border pt-2">
                        <span>Final Amount</span>
                        <span className="text-primary">${Math.max(0, billAmount - pointsCalculatedDiscount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-2">
                        <span>Points After</span>
                        <span>{remainingPoints.toLocaleString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            )}

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