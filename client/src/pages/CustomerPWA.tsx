import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Gift, History, User, Receipt, UserPlus, Share2, LogOut, Store } from "lucide-react";
import { PointsDashboard } from "@/components/PointsDashboard";
import { TransactionItem } from "@/components/TransactionItem";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BillUpload } from "@/components/BillUpload";
import { MyShops } from "@/components/MyShops";
import { ShopSearch } from "@/components/ShopSearch";
import { CouponShareSheet } from "@/components/CouponShareSheet";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { getTransactions, createCustomer, generateReferralCode, getCustomerCoupons, getCustomer, getCustomerShops, createSharedCoupon } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function CustomerPWA() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [selectedCouponForShare, setSelectedCouponForShare] = useState<any>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isCreatingShareToken, setIsCreatingShareToken] = useState(false);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [activeCoupon, setActiveCoupon] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("upload"); // State to manage active tab

  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });

  const [registrationData, setRegistrationData] = useState({
    name: "",
    phone: "",
    email: "",
    username: "",
    password: ""
  });

  const { toast } = useToast();
  const setLocation = useLocation()[1];

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/customers/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Logout failed');
      }
      return response.json();
    },
    onSuccess: () => {
      setCustomer(null);
      setIsLoggedIn(false);
      toast({
        title: "Logged out",
        description: "You've been successfully logged out.",
      });
    },
  });

  // Check if user is already logged in via session
  useEffect(() => {
    fetch('/api/customers/me', {
      credentials: "include",
    })
      .then(res => {
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        return res.json();
      })
      .then(data => {
        setCustomer(data);
        setIsLoggedIn(true);
      })
      .catch(() => {
        setCustomer(null);
        setIsLoggedIn(false);
      });
  }, []);

  // Customer query
  const customerId = customer?.id;
  const { data: customerData, isLoading: isLoadingCustomer, error: customerError } = useQuery({
    queryKey: ['/api/customers', customerId],
    queryFn: () => getCustomer(customerId ?? ''),
    enabled: !!customerId,
  });

  // If customer not found, redirect to login
  if (customerError && !isLoadingCustomer) {
    setLocation('/');
    return null;
  }

  // Transactions query
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', customer?.id],
    queryFn: () => getTransactions(customer?.id ?? '', undefined),
    enabled: !!customer,
    refetchInterval: 5000, // Auto-refresh every 5 seconds to get updated points
  });

  // Refetch customer data when transactions change
  useEffect(() => {
    if (customer?.id) {
      queryClient.invalidateQueries({ queryKey: ['/api/customers', customer.id] });
    }
  }, [transactions, customer?.id]);


  // Customer coupons query
  const { data: customerCoupons = [] } = useQuery({
    queryKey: ['/api/customer-coupons', customer?.id],
    queryFn: () => getCustomerCoupons(customer?.id ?? ''),
    enabled: !!customer,
  });

  // Customer shops query
  const { data: customerShops = [] } = useQuery({
    queryKey: ['/api/customers', customer?.id, 'shops'],
    queryFn: () => getCustomerShops(customer?.id ?? ''),
    enabled: !!customer,
  });

  // Automatically select first shop and coupon when data loads
  useEffect(() => {
    if (customerCoupons.length > 0 && customerShops.length > 0) {
      // Auto-select first coupon if none selected
      if (!activeCoupon) {
        const firstCoupon = customerCoupons[0];
        setActiveCoupon(firstCoupon);

        // Find the corresponding shop
        const shop = customerShops.find((s: any) => s.id === firstCoupon.shopProfileId);
        if (shop) {
          setSelectedShop(shop);
        }
      }
      // If coupon is selected but shop is not, find the shop
      else if (!selectedShop && activeCoupon) {
        const shop = customerShops.find((s: any) => s.id === activeCoupon.shopProfileId);
        if (shop) {
          setSelectedShop(shop);
        }
      }
    }
  }, [customerCoupons, customerShops, activeCoupon, selectedShop]);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await fetch('/api/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setCustomer(data);
      setIsLoggedIn(true);
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const newCode = await generateReferralCode();
      return createCustomer({
        ...data,
        campaignId: null,
        referralCode: newCode,
        totalPoints: 0,
        redeemedPoints: 0,
      });
    },
    onSuccess: (newCustomer) => {
      setCustomer(newCustomer);
      setIsLoggedIn(true);
      setShowRegistration(false);
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create account. Username might already exist.",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({
        title: "Error",
        description: "Please enter username and password.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationData.name || !registrationData.phone || !registrationData.username || !registrationData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    createCustomerMutation.mutate(registrationData);
  };

  const handleLogout = () => {
    localStorage.removeItem('customerId');
    setCustomer(null);
    setIsLoggedIn(false);
    setShowLogin(true);
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
  };

  if (!isLoggedIn) {
    if (showRegistration) {
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
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={registrationData.username}
                    onChange={(e) => setRegistrationData({ ...registrationData, username: e.target.value })}
                    placeholder="Choose a username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={registrationData.password}
                    onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
                    placeholder="Choose a password"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createCustomerMutation.isPending}
                >
                  {createCustomerMutation.isPending ? "Creating Account..." : "Create Account"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowRegistration(false)}
                >
                  Back to Login
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <User className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-heading text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center">
              Login to access your referral rewards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Login"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowRegistration(true)}
              >
                Create New Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPoints = customerData?.totalPoints || customer?.totalPoints || 0;
  const totalRedeemed = customerData?.redeemedPoints || customer?.redeemedPoints || 0;

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
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="upload" value={activeTab} onValueChange={(value) => setActiveTab(value as string)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" data-testid="tab-upload">
              <Receipt className="h-4 w-4 mr-1" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="shops" data-testid="tab-shops">
              <Store className="h-4 w-4 mr-1" />
              Shops
            </TabsTrigger>
            <TabsTrigger value="share" data-testid="tab-share">
              <User className="h-4 w-4 mr-1" />
              Share
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <PointsDashboard
              totalPoints={totalPoints}
              redeemedPoints={totalRedeemed}
              pointsToNextReward={2000}
            />

            <div className="space-y-4">
              {customerCoupons.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-sm">Select Shop</CardTitle>
                    <CardDescription>Choose which shop you're uploading a bill for</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {customerCoupons.map((coupon: any) => {
                        const shop = customerShops.find((s: any) => s.id === coupon.shopProfileId);
                        if (!shop) return null;

                        return (
                          <Button
                            key={coupon.id}
                            variant={activeCoupon?.id === coupon.id ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => {
                              setActiveCoupon(coupon);
                              setSelectedShop(shop);
                            }}
                          >
                            <Store className="h-4 w-4 mr-2" />
                            {shop.shopName}
                            {activeCoupon?.id === coupon.id && " ✓"}
                          </Button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                  <Gift className="h-4 w-4" />
                  💡 Understanding Your Points
                </h3>
                <div className="text-sm text-purple-800 dark:text-purple-200 space-y-2">
                  <div className="flex justify-between items-center bg-white dark:bg-purple-900/30 rounded p-2">
                    <span className="font-medium">Total Earned:</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{totalPoints.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-purple-900/30 rounded p-2">
                    <span className="font-medium">Already Used:</span>
                    <span className="font-bold text-red-600 dark:text-red-400">-{totalRedeemed.toLocaleString()} pts</span>
                  </div>
                  <div className="flex justify-between items-center bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded p-2 border-2 border-green-300 dark:border-green-700">
                    <span className="font-bold">Available to Use:</span>
                    <span className="font-bold text-lg text-green-700 dark:text-green-300">{(totalPoints - totalRedeemed).toLocaleString()} pts</span>
                  </div>
                  <p className="text-xs mt-2 italic">
                    ℹ️ Available points = Total Earned - Already Used. You can redeem available points for discounts on your next purchase!
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Upload a Bill</h3>
                <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                  <li>Enter the referral code you received from a friend</li>
                  <li>Take a photo or select your purchase bill (clear, original photo only)</li>
                  <li>Enter the purchase amount (must match your bill)</li>
                  <li>Submit for approval</li>
                  <li>On approval, you get a welcome discount and your friend earns points!</li>
                </ol>
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    ⚠️ <strong>Important:</strong> Upload only original, clear bills from the shop. Duplicate or fake bills will be rejected and may result in account suspension.
                  </p>
                </div>
              </div>

              {customerCoupons.length === 0 ? (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium text-muted-foreground mb-2">No Shops Registered</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    You need to register as an affiliate at a shop first before uploading bills
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const tabsList = document.querySelector('[data-testid="tab-shops"]') as HTMLElement;
                      if (tabsList) tabsList.click();
                    }}
                  >
                    Go to Shops Tab
                  </Button>
                </div>
              ) : !selectedShop || !activeCoupon ? (
                <div className="text-center py-8 bg-muted/50 rounded-lg">
                  <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium text-muted-foreground mb-2">Select a Shop</p>
                  <p className="text-sm text-muted-foreground">
                    Please select a shop above to upload your bill
                  </p>
                </div>
              ) : (
                <BillUpload
                  customerId={customer.id}
                  couponId={activeCoupon?.id || null}
                  campaignId={selectedShop?.campaigns?.[0]?.id || ""}
                  pointRules={selectedShop?.campaigns?.[0]?.pointRules || [{ minAmount: 0, maxAmount: 999999, points: 10 }]}
                  minPurchaseAmount={selectedShop?.campaigns?.[0]?.minPurchaseAmount || 0}
                  discountPercentage={selectedShop?.campaigns?.[0]?.referralDiscountPercentage || 10}
                  shopName={selectedShop?.shopName}
                  onSuccess={() => {
                    setActiveTab("history");
                    queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="shops" className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                <Store className="h-4 w-4" />
                Become a Shop Affiliate
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                Register as an affiliate for any shop to get your unique referral code!
              </p>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                <li>Each shop gives you a unique referral code</li>
                <li>Share your code with friends and family</li>
                <li>Earn {customer.totalPoints > 0 ? '10%' : 'bonus'} points when they make purchases</li>
                <li>Track all your affiliate shops in one place</li>
              </ul>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Find & Register</CardTitle>
                <CardDescription>Search for shops and become an affiliate</CardDescription>
              </CardHeader>
              <CardContent>
                <ShopSearch
                  customerId={customer.id}
                  existingShopIds={customerCoupons.map((c: any) => c.shopProfileId)}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">My Affiliate Shops</CardTitle>
                <CardDescription>Shops where you're registered as an affiliate</CardDescription>
              </CardHeader>
              <CardContent>
                <MyShops customerId={customer.id} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">My Affiliate Coupons</CardTitle>
                <CardDescription>Your unique referral codes for each shop</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                    <Gift className="h-4 w-4" />
                    How Referrals Work
                  </h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-2 list-decimal list-inside">
                    <li>Each shop gives you a unique coupon code below</li>
                    <li>Share the code or QR link with friends</li>
                    <li>They get a discount on their first purchase (varies by shop)</li>
                    <li>You earn points based on their purchase amount (see each shop's point rules)</li>
                    <li>Redeem your accumulated points for discounts on future purchases</li>
                  </ol>
                </div>

                {customerCoupons.length === 0 ? (
                  <div className="text-center py-8 bg-muted/50 rounded-lg">
                    <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="font-medium text-muted-foreground mb-2">No Affiliate Coupons Yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Register as an affiliate at any shop to get your unique coupon code
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const tabsList = document.querySelector('[data-testid="tab-shops"]') as HTMLElement;
                        if (tabsList) tabsList.click();
                      }}
                    >
                      Go to Shops Tab
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerCoupons.map((coupon: any) => {
                      const shop = customerShops.find((s: any) => s.id === coupon.shopProfileId);
                      if (!shop) return null;

                      return (
                        <Card key={coupon.id} className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-secondary/5" data-testid={`share-coupon-${shop.id}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Store className="h-5 w-5 text-primary" />
                                <div>
                                  <p className="font-bold text-lg">{shop.shopName}</p>
                                  <p className="text-xs text-muted-foreground">{shop.shopCode}</p>
                                </div>
                              </div>
                              <Badge variant="default" className="bg-green-600">{shop.discountPercentage}% Off</Badge>
                            </div>

                            <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-primary/50 rounded-lg p-4 mb-3">
                              <div className="text-center mb-2">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                  Your Unique Coupon Code
                                </p>
                                <code className="text-2xl font-mono font-bold text-primary tracking-wider block my-2">
                                  {coupon.referralCode}
                                </code>
                                <div className="flex gap-2 justify-center mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      navigator.clipboard.writeText(coupon.referralCode);
                                      toast({
                                        title: "✅ Copied!",
                                        description: "Referral code copied to clipboard",
                                      });
                                    }}
                                  >
                                    📋 Copy Code
                                  </Button>
                                </div>
                              </div>
                              <div className="text-center text-xs text-muted-foreground mt-3 pt-3 border-t">
                                <p>💰 Earn {shop.pointsPerDollar || 1} pts per {shop.currencySymbol || '$'}1 spent</p>
                                <p className="mt-1">Points: {coupon.totalPoints || 0} | Redeemed: {coupon.redeemedPoints || 0}</p>
                              </div>
                            </div>

                            <Button
                              className="w-full"
                              onClick={async () => {
                                if (!coupon) {
                                  toast({
                                    title: "Error",
                                    description: "No coupon found for this shop",
                                    variant: "destructive",
                                  });
                                  return;
                                }

                                setSelectedCouponForShare({ shop, coupon });
                                setShareSheetOpen(true);
                                setIsCreatingShareToken(true);

                                try {
                                  const sharedCoupon = await createSharedCoupon({
                                    couponId: coupon.id,
                                    sharedByCustomerId: customer.id,
                                  });
                                  setShareToken(sharedCoupon.shareToken);
                                } catch (error) {
                                  toast({
                                    title: "Error",
                                    description: "Failed to create share link",
                                    variant: "destructive",
                                  });
                                  setShareSheetOpen(false);
                                } finally {
                                  setIsCreatingShareToken(false);
                                }
                              }}
                              data-testid={`button-share-${shop.id}`}
                            >
                              <Share2 className="h-4 w-4 mr-2" />
                              Share this Coupon
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
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

      <CouponShareSheet
        open={shareSheetOpen}
        onOpenChange={(open) => {
          setShareSheetOpen(open);
          if (!open) {
            setShareToken(null);
            setSelectedCouponForShare(null);
          }
        }}
        shareToken={shareToken}
        shopName={selectedCouponForShare?.shop?.shopName || ''}
        loading={isCreatingShareToken}
      />

      <PWAInstallPrompt />
    </div>
  );
}