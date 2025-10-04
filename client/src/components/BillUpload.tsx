
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera } from "lucide-react";
import { createTransaction } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
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
  const { toast } = useToast();

  const form = useForm<BillUploadData>({
    resolver: zodResolver(billUploadSchema),
    defaultValues: {
      amount: 0,
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (data: any) => createTransaction(data, selectedFile),
    onSuccess: () => {
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      setAffiliateCode("");
      setAffiliateDetails(null);
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
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

  const handleSubmit = (data: BillUploadData) => {
    if (data.amount < minPurchaseAmount) {
      toast({
        title: "Minimum purchase not met",
        description: `Minimum purchase amount is $${minPurchaseAmount}`,
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      customerId,
      campaignId: couponId,
      amount: data.amount,
      points: calculatePointsFromRules(data.amount, pointRules),
      status: 'pending',
      type: 'purchase',
      referralCode: affiliateCode || null,
      shopName: shopName,
    });
  };

  return (
    <Card data-testid="card-bill-upload">
      <CardHeader>
        <CardTitle className="font-heading">Upload Purchase Bill</CardTitle>
        <CardDescription>Submit your bill with a referral code for discount</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                      onChange={(e) => field.onChange(Number(e.target.value))}
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

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm text-muted-foreground">
                <strong>Original Amount:</strong> ${(form.watch('amount') || 0).toFixed(2)}
              </p>
              {affiliateDetails && discountPercentage > 0 && form.watch('amount') > 0 && (
                <>
                  <p className="text-sm font-medium text-green-600">
                    <strong>Welcome Discount ({discountPercentage}%):</strong> -${((form.watch('amount') || 0) * discountPercentage / 100).toFixed(2)}
                  </p>
                  <p className="text-sm font-semibold text-primary">
                    <strong>You Pay:</strong> ${((form.watch('amount') || 0) * (1 - discountPercentage / 100)).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Referrer ({affiliateDetails.name}) earns:</strong> {Math.floor((form.watch('amount') || 0) * pointsPerDollar * 0.1)} points
                  </p>
                </>
              )}
              {!affiliateDetails && (
                <p className="text-sm text-orange-600">
                  Enter a valid referral code to get {discountPercentage}% welcome discount!
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={uploadMutation.isPending}
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
