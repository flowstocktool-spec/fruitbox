
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, History, User, Receipt, UserPlus } from "lucide-react";
import { PointsDashboard } from "@/components/PointsDashboard";
import { CouponDisplay } from "@/components/CouponDisplay";
import { TransactionItem } from "@/components/TransactionItem";
import { ShareSheet } from "@/components/ShareSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BillUpload } from "@/components/BillUpload";
import { getCustomerByCode, getCampaign, getTransactions, createCustomer, generateReferralCode } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CustomerPWA() {
  const { code } = useParams<{ code?: string }>();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const { toast } = useToast();

  // Use code from URL params, fallback to check localStorage or demo code
  const getCustomerCode = () => {
    if (code) return code;
    const storedCode = localStorage.getItem('customerReferralCode');
    return storedCode || "SARAH2024";
  };

  const customerCode = getCustomerCode();

  const { data: customer, isLoading: customerLoading, isError: customerError } = useQuery({
    queryKey: ['/api/customers/code', customerCode],
    queryFn: () => getCustomerByCode(customerCode),
    retry: false,
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

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const newCode = await generateReferralCode();
      return createCustomer({
        ...data,
        referralCode: newCode,
        campaignId: "3671d408-c8ae-4386-9793-fed02be9bb35", // Default to demo campaign
        totalPoints: 0,
        redeemedPoints: 0,
      });
    },
    onSuccess: (newCustomer) => {
      localStorage.setItem('customerReferralCode', newCustomer.referralCode);
      queryClient.invalidateQueries({ queryKey: ['/api/customers/code'] });
      setShowRegistration(false);
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Show registration if customer not found and not using demo code
    if (customerError && customerCode !== "SARAH2024") {
      setShowRegistration(true);
    }
  }, [customerError, customerCode]);

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationData.name || !registrationData.phone) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createCustomerMutation.mutate(registrationData);
  };

  if (customerLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (showRegistration || (customerError && !customer)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-heading text-center">Create Your Account</CardTitle>
            <CardDescription className="text-center">
              Join our referral program and start earning points!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegistration} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={registrationData.name}
                  onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={registrationData.phone}
                  onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={registrationData.email}
                  onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={createCustomerMutation.isPending}
              >
                {createCustomerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
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

  const referralCount = transactions.filter(t => t.type === 'referral' && t.status === 'approved').length;
  const monthlyReferrals = transactions.filter(t => {
    if (t.type !== 'referral' || t.status !== 'approved') return false;
    const date = new Date(t.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

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
