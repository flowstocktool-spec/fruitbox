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

interface BillUploadProps {
  customerId: string;
  couponId: string | null;
  pointsPerDollar: number;
  minPurchaseAmount: number;
  referralCode?: string;
  shopName?: string;
}

export function BillUpload({ customerId, couponId, pointsPerDollar, minPurchaseAmount, referralCode, shopName }: BillUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/customer-coupons'] });
      toast({
        title: "Bill uploaded successfully!",
        description: referralCode
          ? `Your bill is submitted using referral code ${referralCode}. Pending approval.`
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
      points: Math.floor(data.amount * pointsPerDollar),
      status: 'pending',
      type: 'purchase',
      referralCode: referralCode,
      shopName: shopName,
    });
  };

  return (
    <Card data-testid="card-bill-upload">
      <CardHeader>
        <CardTitle className="font-heading">Upload Purchase Bill</CardTitle>
        <CardDescription>Submit your bill for points approval</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Points to earn:</strong> {Math.floor((form.watch('amount') || 0) * pointsPerDollar)} points
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Minimum purchase:</strong> ${minPurchaseAmount}
              </p>
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