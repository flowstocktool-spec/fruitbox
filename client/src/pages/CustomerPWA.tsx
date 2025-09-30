import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, History, User, Receipt } from "lucide-react";
import { PointsDashboard } from "@/components/PointsDashboard";
import { CouponDisplay } from "@/components/CouponDisplay";
import { TransactionItem } from "@/components/TransactionItem";
import { ShareSheet } from "@/components/ShareSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BillUpload } from "@/components/BillUpload";
import { getCustomerByCode, getCampaign, getTransactions } from "@/lib/api";

export default function CustomerPWA() {
  const { code } = useParams<{ code?: string }>();
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Use code from URL params, fallback to demo code
  const customerCode = code || "SARAH2024";

  const { data: customer, isLoading: customerLoading, isError: customerError } = useQuery({
    queryKey: ['/api/customers/code', customerCode],
    queryFn: () => getCustomerByCode(customerCode),
  });

  const { data: campaign } = useQuery({
    queryKey: ['/api/campaigns', customer?.campaignId],
    queryFn: () => getCampaign(customer!.campaignId),
    enabled: !!customer,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', customer?.id],
    queryFn: () => getTransactions(customer!.id),
    enabled: !!customer,
  });

  const referralCount = transactions.filter(t => t.type === 'referral' && t.status === 'approved').length;
  const monthlyReferrals = transactions.filter(t => {
    if (t.type !== 'referral' || t.status !== 'approved') return false;
    const date = new Date(t.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (customerError || !customer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="font-heading">Customer Not Found</CardTitle>
            <CardDescription>
              This referral code doesn't exist. Please check the code and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading campaign...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-br from-chart-2/20 to-chart-4/20 border-b sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold font-heading" data-testid="text-customer-name">
                {customer.name}
              </h1>
              <p className="text-sm text-muted-foreground">{campaign.name}</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4" data-testid="tabs-customer-navigation">
            <TabsTrigger value="rewards" data-testid="tab-rewards">
              <Gift className="h-4 w-4 mr-1" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="upload" data-testid="tab-upload">
              <Receipt className="h-4 w-4 mr-1" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="coupon" data-testid="tab-coupon">
              <User className="h-4 w-4 mr-1" />
              Coupon
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rewards" className="space-y-6">
            <PointsDashboard
              totalPoints={customer.totalPoints}
              redeemedPoints={customer.redeemedPoints}
              pointsToNextReward={2000}
            />

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">How It Works</CardTitle>
                <CardDescription>Earn points and unlock rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-chart-2/20 flex items-center justify-center text-chart-2 font-semibold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Share Your Code</p>
                    <p className="text-sm text-muted-foreground">
                      Friends get {campaign.discountPercentage}% off their first purchase
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-chart-2/20 flex items-center justify-center text-chart-2 font-semibold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">They Purchase</p>
                    <p className="text-sm text-muted-foreground">
                      Earn {campaign.pointsPerDollar} points for every $1 they spend
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-chart-2/20 flex items-center justify-center text-chart-2 font-semibold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Redeem Rewards</p>
                    <p className="text-sm text-muted-foreground">
                      Use your points for discounts and exclusive offers
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <BillUpload
              customerId={customer.id}
              campaignId={customer.campaignId}
              pointsPerDollar={campaign.pointsPerDollar}
              minPurchaseAmount={campaign.minPurchaseAmount}
            />
          </TabsContent>

          <TabsContent value="coupon" className="space-y-4">
            <CouponDisplay
              campaign={campaign}
              customer={customer}
              onShare={() => setShowShareSheet(true)}
            />

            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-base">Referral Stats</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Referrals</p>
                  <p className="text-2xl font-bold font-heading" data-testid="text-total-referrals">
                    {referralCount}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold font-heading" data-testid="text-monthly-referrals">
                    {monthlyReferrals}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Transaction History</CardTitle>
                <CardDescription>Your recent activity and points</CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No transactions yet</p>
                ) : (
                  <div className="space-y-1">
                    {transactions.map((txn) => (
                      <TransactionItem key={txn.id} transaction={txn} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <ShareSheet
        open={showShareSheet}
        onOpenChange={setShowShareSheet}
        referralCode={customer.referralCode}
        campaignName={campaign.name}
        discountPercentage={campaign.discountPercentage}
      />
    </div>
  );
}
