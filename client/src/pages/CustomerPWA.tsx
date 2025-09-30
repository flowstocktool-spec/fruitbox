import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, History, User } from "lucide-react";
import { PointsDashboard } from "@/components/PointsDashboard";
import { CouponDisplay } from "@/components/CouponDisplay";
import { TransactionItem } from "@/components/TransactionItem";
import { ShareSheet } from "@/components/ShareSheet";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function CustomerPWA() {
  const [showShareSheet, setShowShareSheet] = useState(false);

  const campaign = {
    id: "1",
    storeId: "store-1",
    name: "Summer Rewards",
    description: "Earn points on every purchase!",
    pointsPerDollar: 5,
    minPurchaseAmount: 25,
    discountPercentage: 10,
    couponColor: "#7c3aed",
    couponTextColor: "#ffffff",
    isActive: true,
    createdAt: new Date(),
  };

  const customer = {
    id: "cust-1",
    campaignId: "1",
    name: "Alex Rivera",
    phone: "+1234567890",
    referralCode: "ALEX2024",
    totalPoints: 2750,
    redeemedPoints: 1500,
    createdAt: new Date(),
  };

  const transactions = [
    {
      id: "1",
      customerId: "c1",
      campaignId: "camp1",
      type: "purchase",
      amount: 150,
      points: 750,
      status: "approved",
      billImageUrl: null,
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      customerId: "c1",
      campaignId: "camp1",
      type: "referral",
      amount: 0,
      points: 500,
      status: "approved",
      billImageUrl: null,
      createdAt: new Date("2024-01-12"),
    },
    {
      id: "3",
      customerId: "c1",
      campaignId: "camp1",
      type: "purchase",
      amount: 85,
      points: 425,
      status: "pending",
      billImageUrl: null,
      createdAt: new Date("2024-01-14"),
    },
    {
      id: "4",
      customerId: "c1",
      campaignId: "camp1",
      type: "redemption",
      amount: 0,
      points: 1000,
      status: "approved",
      billImageUrl: null,
      createdAt: new Date("2024-01-10"),
    },
    {
      id: "5",
      customerId: "c1",
      campaignId: "camp1",
      type: "referral",
      amount: 0,
      points: 500,
      status: "approved",
      billImageUrl: null,
      createdAt: new Date("2024-01-08"),
    },
  ];

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
          <TabsList className="grid w-full grid-cols-3" data-testid="tabs-customer-navigation">
            <TabsTrigger value="rewards" data-testid="tab-rewards">
              <Gift className="h-4 w-4 mr-2" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="coupon" data-testid="tab-coupon">
              <User className="h-4 w-4 mr-2" />
              My Coupon
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-2" />
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
                  <p className="text-2xl font-bold font-heading" data-testid="text-total-referrals">12</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold font-heading" data-testid="text-monthly-referrals">3</p>
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
                <div className="space-y-1">
                  {transactions.map((txn) => (
                    <TransactionItem key={txn.id} transaction={txn} />
                  ))}
                </div>
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
