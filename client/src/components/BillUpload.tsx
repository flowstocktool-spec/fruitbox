import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera } from "lucide-react";
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

export function BillUpload({ customerId, couponId, pointRules, minPurchaseAmount, discountPercentage = 10, referralCode, shopName, onSuccess }: BillUploadProps) {
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

  const uploadMutation = useMutation({
    mutationFn: (data: any) => createTransaction(data, selectedFile),
    onSuccess: () => {
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setAffiliateCode("");
      setAffiliateDetails(null);
      setPointsToRedeem(0);
      setShowRedemption(false);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
      toast({
        title: "Bill uploaded successfully!",
        description: affiliateCode
          ? `Your bill is submitted with referral code ${affiliateCode}. You'll get ${discountPercentage}% welcome discount on approval!`
          : "Your bill is pending approval.",
      });
      onSuccess?.();
    },
    onError: () => {
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

    try {
      // First, create the purchase transaction
      const formData = new FormData();
      formData.append("customerId", customerId);
      formData.append("campaignId", couponId || "");
      formData.append("couponId", couponId || "");
      formData.append("type", "purchase");
      formData.append("amount", purchaseAmount.toString());
      formData.append("status", "pending");
      formData.append("referralCode", affiliateCode || "");

      if (selectedFile) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
        });
        formData.append("billImageUrl", base64);
      }

      // Calculate points based on amount and point rules
      let earnedPoints = 0;
      if (pointRules && pointRules.length > 0) {
        for (const rule of pointRules) {
          if (purchaseAmount >= rule.minAmount && purchaseAmount <= rule.maxAmount) {
            earnedPoints = rule.points;
            break;
          }
        }
      }

      formData.append("points", earnedPoints.toString());
      formData.append("shopName", shopName || "");

      const response = await fetch("/api/transactions", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to submit transaction");

      // If points are being redeemed, create redemption transaction
      if (pointsToRedeem > 0) {
        const redemptionFormData = new FormData();
        redemptionFormData.append("customerId", customerId);
        redemptionFormData.append("campaignId", couponId || "");
        redemptionFormData.append("couponId", couponId || "");
        redemptionFormData.append("type", "redemption");
        redemptionFormData.append("amount", purchaseAmount.toString());
        redemptionFormData.append("points", (-pointsToRedeem).toString()); // Negative for redemption
        redemptionFormData.append("status", "pending");
        redemptionFormData.append("referralCode", "");
        redemptionFormData.append("shopName", shopName || "");

        const redemptionResponse = await fetch("/api/transactions", {
          method: "POST",
          body: redemptionFormData,
          credentials: "include",
        });

        if (!redemptionResponse.ok) throw new Error("Failed to submit redemption");
      }

      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });

      setAmount("");
      setReferralCode("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setPointsToRedeem(0);
      setShowRedemption(false);
      setAffiliateCode("");
      setAffiliateDetails(null);

      const redemptionMessage = pointsToRedeem > 0
        ? ` ${pointsToRedeem} points will be redeemed once approved.`
        : '';

      toast({
        title: "Success!",
        description: `Bill uploaded successfully! You'll earn ${earnedPoints} points once approved.${redemptionMessage}`,
      });
    } catch (error) {
      console.error("Error submitting bill:", error);
      toast({
        title: "Error",
        description: "Failed to upload bill. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculatedDiscount = (pointsToRedeem / 100) * (discountPercentage || 10);
  const finalAmount = Math.max(0, parseFloat(form.getValues('amount').toString() || '0') - calculatedDiscount);
  const remainingPoints = Math.max(0, (customerQuery.data?.totalPoints || 0) - (customerQuery.data?.redeemedPoints || 0) - pointsToRedeem);

  return (
    <Card data-testid="card-bill-upload">
      <CardHeader>
        <CardTitle className="font-heading">Upload Purchase Bill</CardTitle>
        <CardDescription>Submit your bill with a referral code for discount</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="space-y-3">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">📋 Campaign Benefits</h3>
                  <div className="space-y-2 text-sm">
                    <div className="bg-white dark:bg-blue-900/20 rounded p-2">
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        💝 Your welcome discount: <span className="font-bold">{discountPercentage}% OFF</span>
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-300">
                        📦 Minimum purchase: <span className="font-bold">${minPurchaseAmount}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Upload a Bill</h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Enter the referral code you received from a friend</li>
                    <li>Take a photo or select your purchase bill (clear, original photo only)</li>
                    <li>Enter the purchase amount (must match your bill)</li>
                    <li>Submit for approval</li>
                    <li>On approval, you get the welcome discount and your friend earns points!</li>
                  </ol>
                  <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      ⚠️ <strong>Important:</strong> Upload only original, clear bills from the shop. Duplicate or fake bills will be rejected and may result in account suspension.
                    </p>
                  </div>
                </div>
              </div>

            {!referralCode && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Referral Code from Friend (Required for Discount)</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter referral code"
                    value={affiliateCode}
                    onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                    data-testid="input-affiliate-code"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fetchAffiliateDetails(affiliateCode)}
                    disabled={loadingAffiliate || !affiliateCode.trim()}
                    data-testid="button-verify-code"
                  >
                    {loadingAffiliate ? "Verifying..." : "Verify"}
                  </Button>
                </div>
                {affiliateDetails && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                    <p className="text-sm text-green-800">
                      ✓ Using <strong>{affiliateDetails.name}</strong>'s referral code
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      You'll get {discountPercentage}% welcome discount! They'll earn points when your purchase is approved.
                    </p>
                  </div>
                )}
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
                          const calculatedDiscount = (pointsToRedeem / 100) * (discountPercentage || 10);
                          const finalAmount = Math.max(0, amountValue - calculatedDiscount);
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

            <div className="space-y-4">
              <label className="text-sm font-medium">Bill Image (Optional)</label>
              <div className="flex flex-col gap-4">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('bill-file')?.click()}
                    className="flex-1"
                    data-testid="button-upload-bill"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('bill-camera') as HTMLInputElement;
                      input?.click();
                    }}
                    className="flex-1"
                    data-testid="button-camera-bill"
                  >
                    <Camera className="h-4 w-4 mr-2" />
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
                  <div className="mt-4">
                    <img
                      src={previewUrl}
                      alt="Bill preview"
                      className="w-full h-48 object-cover rounded-lg border"
                      data-testid="img-bill-preview"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-base font-semibold">Redeem Points for Discount</Label>
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
                <div className="space-y-4 p-4 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-lg border">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Your Available Points</span>
                      <span className="font-bold text-green-600">
                        {(customerQuery.data?.totalPoints || 0 - (customerQuery.data?.redeemedPoints || 0)).toLocaleString()}
                      </span>
                    </div>

                    <Label htmlFor="pointsToRedeem">Points to Redeem</Label>
                    <Input
                      id="pointsToRedeem"
                      type="number"
                      min="0"
                      max={(customerQuery.data?.totalPoints || 0) - (customerQuery.data?.redeemedPoints || 0)}
                      value={pointsToRedeem}
                      onChange={(e) => setPointsToRedeem(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="Enter points to redeem"
                    />

                    {pointsToRedeem > 0 && (
                      <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded border-2 border-green-300 dark:border-green-700">
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Original Amount:</span>
                            <span className="font-medium">${form.getValues('amount').toString() || '0'}</span>
                          </div>
                          <div className="flex justify-between text-green-600 dark:text-green-400">
                            <span>Discount (approx):</span>
                            <span className="font-medium">-${calculatedDiscount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-lg border-t pt-1">
                            <span>Final Amount:</span>
                            <span className="text-blue-600 dark:text-blue-400">
                              ${finalAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground border-t pt-1">
                            <span>Remaining Points:</span>
                            <span className="font-medium">
                              {remainingPoints.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={uploadMutation.isPending || customerQuery.isLoading}
              data-testid="button-submit-bill"
            >
              {uploadMutation.isPending ? "Uploading..." : "Submit Bill"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}