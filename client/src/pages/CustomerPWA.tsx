
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, History, User, Receipt, UserPlus, Plus, Store } from "lucide-react";
import { PointsDashboard } from "@/components/PointsDashboard";
import { CouponDisplay } from "@/components/CouponDisplay";
import { TransactionItem } from "@/components/TransactionItem";
import { ShareSheet } from "@/components/ShareSheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BillUpload } from "@/components/BillUpload";
import { getCustomerByCode, getCampaign, getTransactions, createCustomer, generateReferralCode, getCustomerCoupons, createCustomerCoupon } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CustomerPWA() {
  const { code } = useParams<{ code?: string }>();
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showCouponCreation, setShowCouponCreation] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<any>(null);
  const [registrationData, setRegistrationData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const [couponData, setCouponData] = useState({
    shopName: "",
    shopId: ""
  });
  const { toast } = useToast();

  // Get customer code from URL or localStorage
  const getCustomerCode = () => {
    if (code) return code;
    const storedCode = localStorage.getItem('customerCode');
    return storedCode;
  };

  const customerCode = getCustomerCode();

  // Customer query
  const { data: customer, isLoading: customerLoading, isError: customerError } = useQuery({
    queryKey: ['/api/customers/code', customerCode],
    queryFn: () => getCustomerByCode(customerCode!),
    enabled: !!customerCode,
    retry: false,
  });

  // Customer coupons query
  const { data: coupons = [], refetch: refetchCoupons } = useQuery({
    queryKey: ['/api/customer-coupons', customer?.id],
    queryFn: () => getCustomerCoupons(customer!.id),
    enabled: !!customer,
  });

  // Transactions for selected coupon
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', customer?.id, selectedCoupon?.id],
    queryFn: () => getTransactions(customer!.id, selectedCoupon?.id),
    enabled: !!customer && !!selectedCoupon,
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const newCode = await generateReferralCode();
      return createCustomer({
        ...data,
        referralCode: newCode,
        totalPoints: 0,
        redeemedPoints: 0,
      });
    },
    onSuccess: (newCustomer) => {
      localStorage.setItem('customerCode', newCustomer.referralCode);
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

  const createCouponMutation = useMutation({
    mutationFn: (data: any) => createCustomerCoupon(data),
    onSuccess: () => {
      setShowCouponCreation(false);
      setCouponData({ shopName: "", shopId: "" });
      refetchCoupons();
      toast({
        title: "Success!",
        description: "New coupon created for the shop.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create coupon. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!customerCode || customerError) {
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

  const handleCouponCreation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponData.shopName) {
      toast({
        title: "Error",
        description: "Please enter shop name.",
        variant: "destructive",
      });
      return;
    }
    createCouponMutation.mutate({
      customerId: customer!.id,
      shopName: couponData.shopName,
      shopId: couponData.shopId || null,
    });
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
              Join the referral program and start earning points!
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

  const totalPoints = coupons.reduce((sum, coupon) => sum + coupon.totalPoints, 0);
  const totalRedeemed = coupons.reduce((sum, coupon) => sum + coupon.redeemedPoints, 0);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-br from-chart-2/20 to-chart-4/20 border-b sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold font-heading">
                {customer?.name}
              </h1>
              <p className="text-sm text-muted-foreground">Referral Rewards</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="coupons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="coupons">
              <Gift className="h-4 w-4 mr-1" />
              Coupons
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Receipt className="h-4 w-4 mr-1" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="share">
              <User className="h-4 w-4 mr-1" />
              Share
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coupons" className="space-y-6">
            <PointsDashboard
              totalPoints={totalPoints}
              redeemedPoints={totalRedeemed}
              pointsToNextReward={2000}
            />

            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">My Shop Coupons</h3>
              <Button onClick={() => setShowCouponCreation(true)} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Shop
              </Button>
            </div>

            {coupons.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No shop coupons yet</p>
                  <Button onClick={() => setShowCouponCreation(true)}>
                    Create Your First Coupon
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {coupons.map((coupon) => (
                  <Card key={coupon.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{coupon.shopName}</h4>
                        <span className="text-sm text-muted-foreground">
                          Code: {coupon.referralCode}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Points Earned</p>
                          <p className="font-bold text-green-600">{coupon.totalPoints}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Redeemed</p>
                          <p className="font-bold text-blue-600">{coupon.redeemedPoints}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Remaining</p>
                          <p className="font-bold text-purple-600">{coupon.totalPoints - coupon.redeemedPoints}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {showCouponCreation && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Create Shop Coupon</CardTitle>
                    <CardDescription>Add a new shop to start earning points</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCouponCreation} className="space-y-4">
                      <div>
                        <Label htmlFor="shopName">Shop Name *</Label>
                        <Input
                          id="shopName"
                          value={couponData.shopName}
                          onChange={(e) => setCouponData({ ...couponData, shopName: e.target.value })}
                          placeholder="Enter shop name"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="shopId">Shop ID (Optional)</Label>
                        <Input
                          id="shopId"
                          value={couponData.shopId}
                          onChange={(e) => setCouponData({ ...couponData, shopId: e.target.value })}
                          placeholder="Enter shop ID if known"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1" disabled={createCouponMutation.isPending}>
                          {createCouponMutation.isPending ? "Creating..." : "Create Coupon"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setShowCouponCreation(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            {selectedCoupon ? (
              <BillUpload
                customerId={customer!.id}
                couponId={selectedCoupon.id}
                pointsPerDollar={1}
                minPurchaseAmount={0}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a coupon first to upload bills</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            {coupons.length > 0 ? (
              <div className="space-y-4">
                {coupons.map((coupon) => (
                  <CouponDisplay
                    key={coupon.id}
                    coupon={{
                      name: coupon.shopName,
                      couponColor: "#2563eb",
                      couponTextColor: "#ffffff",
                      pointsPerDollar: 1,
                      discountPercentage: 10,
                    }}
                    customer={{ ...customer!, referralCode: coupon.referralCode }}
                    onShare={() => setShowShareSheet(true)}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">Create a shop coupon to start sharing</p>
                </CardContent>
              </Card>
            )}
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
        referralCode={customer?.referralCode || ""}
        campaignName="Referral Rewards"
        discountPercentage={10}
      />
    </div>
  );
}
