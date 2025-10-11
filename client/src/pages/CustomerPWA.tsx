import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Gift, History, User, Receipt, UserPlus, Share2, LogOut, Store, Award } from "lucide-react";
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
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showLogin, setShowLogin] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [selectedCouponForShare, setSelectedCouponForShare] = useState<any>(null);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [isCreatingShareToken, setIsCreatingShareToken] = useState(false);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [activeCoupon, setActiveCoupon] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("points");

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

  const [resetData, setResetData] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
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
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/customers/me', {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setCustomer(data);
          setIsLoggedIn(true);
          setIsCheckingAuth(false);
        } else {
          setCustomer(null);
          setIsLoggedIn(false);
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setCustomer(null);
        setIsLoggedIn(false);
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Customer query
  const customerId = customer?.id;
  const { data: customerData, isLoading: isLoadingCustomer, error: customerError, refetch } = useQuery({
    queryKey: ['/api/customers', customerId],
    queryFn: () => getCustomer(customerId ?? ''),
    enabled: !!customerId,
  });

  if (customerError && !isLoadingCustomer) {
    setLocation('/');
    return null;
  }

  const { data: customerCoupons = [] } = useQuery({
    queryKey: ['/api/customer-coupons', customerId],
    queryFn: () => getCustomerCoupons(customerId),
    enabled: !!customerId,
  });

  const { data: customerShops = [] } = useQuery({
    queryKey: ['/api/customers/shops', customerId],
    queryFn: () => getCustomerShops(customerId),
    enabled: !!customerId,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', customerId],
    queryFn: () => getTransactions(customerId),
    enabled: !!customerId,
  });

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
        description: `Logged in as ${data.name}`,
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

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ username, newPassword }: { username: string; newPassword: string }) => {
      const resetCustomerPassword = async (username: string, newPassword: string) => {
        const response = await fetch('/api/customers/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, newPassword }),
          credentials: 'include',
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Password reset failed');
        }
        return response.json();
      };
      return resetCustomerPassword(username, newPassword);
    },
    onSuccess: () => {
      setShowPasswordReset(false);
      toast({
        title: "Password Reset Successful",
        description: "You can now login with your new password.",
      });
      setResetData({ username: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: async (data) => {
      setCustomer(data);
      setIsLoggedIn(true);
      setShowRegistration(false);
      
      toast({
        title: "Account created!",
        description: `Welcome ${data.name}! Your account has been created successfully.`,
      });
      
      await queryClient.invalidateQueries({ queryKey: ['/api/customers'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({
        title: "Missing information",
        description: "Please enter username and password.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationData.name || !registrationData.phone || !registrationData.username || !registrationData.password) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const referralCode = await generateReferralCode();
    createCustomerMutation.mutate({
      ...registrationData,
      referralCode: referralCode,
    });
  };

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetData.newPassword !== resetData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate({ username: resetData.username, newPassword: resetData.newPassword });
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Password reset form
  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="font-heading">Reset Password</CardTitle>
            <CardDescription>
              Enter your username and new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <Label htmlFor="reset-username">Username</Label>
                <Input
                  id="reset-username"
                  data-testid="input-reset-username"
                  value={resetData.username}
                  onChange={(e) => setResetData({ ...resetData, username: e.target.value })}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reset-new-password">New Password</Label>
                <Input
                  id="reset-new-password"
                  data-testid="input-reset-new-password"
                  type="password"
                  value={resetData.newPassword}
                  onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
                <Input
                  id="reset-confirm-password"
                  data-testid="input-reset-confirm-password"
                  type="password"
                  value={resetData.confirmPassword}
                  onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <Button
                type="submit"
                data-testid="button-reset-password"
                className="w-full"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowPasswordReset(false);
                  setResetData({ username: "", newPassword: "", confirmPassword: "" });
                }}
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Registration form
  if (showRegistration) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="font-heading">Create Account</CardTitle>
            <CardDescription>
              Join the referral rewards program
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="reg-name">Full Name</Label>
                <Input
                  id="reg-name"
                  data-testid="input-name"
                  value={registrationData.name}
                  onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reg-phone">Phone Number</Label>
                <Input
                  id="reg-phone"
                  data-testid="input-phone"
                  value={registrationData.phone}
                  onChange={(e) => setRegistrationData({ ...registrationData, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reg-email">Email (optional)</Label>
                <Input
                  id="reg-email"
                  data-testid="input-email"
                  type="email"
                  value={registrationData.email}
                  onChange={(e) => setRegistrationData({ ...registrationData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <Label htmlFor="reg-username">Username</Label>
                <Input
                  id="reg-username"
                  data-testid="input-username"
                  value={registrationData.username}
                  onChange={(e) => setRegistrationData({ ...registrationData, username: e.target.value })}
                  placeholder="Choose a username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reg-password">Password</Label>
                <Input
                  id="reg-password"
                  data-testid="input-password"
                  type="password"
                  value={registrationData.password}
                  onChange={(e) => setRegistrationData({ ...registrationData, password: e.target.value })}
                  placeholder="Choose a password"
                  required
                />
              </div>
              <Button
                type="submit"
                data-testid="button-register"
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

  // Login form
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Award className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-heading text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center">
            Login to your rewards account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                data-testid="input-login-username"
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
                data-testid="input-login-password"
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button
              type="submit"
              data-testid="button-login"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Logging in..." : "Login"}
            </Button>
            <div className="flex justify-between items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowRegistration(true)}
                data-testid="button-show-register"
              >
                Create Account
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setShowPasswordReset(true)}
                data-testid="button-forgot-password"
              >
                Forgot Password?
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    );
  }

  // Main dashboard
  const totalPoints = customerData?.totalPoints || customer?.totalPoints || 0;
  const totalRedeemed = customerData?.redeemedPoints || customer?.redeemedPoints || 0;
  const availablePoints = totalPoints - totalRedeemed;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-to-br from-chart-2/20 to-chart-4/20 border-b sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold font-heading" data-testid="text-customer-name">
                {customer?.name}
              </h1>
              <p className="text-sm text-muted-foreground">Rewards Member</p>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="points" value={activeTab} onValueChange={(value) => setActiveTab(value as string)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="points" data-testid="tab-points">
              <Award className="h-4 w-4 mr-1" />
              Points
            </TabsTrigger>
            <TabsTrigger value="upload" data-testid="tab-upload">
              <Receipt className="h-4 w-4 mr-1" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="shops" data-testid="tab-shops">
              <Store className="h-4 w-4 mr-1" />
              Shops
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">
              <History className="h-4 w-4 mr-1" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Points Tab */}
          <TabsContent value="points" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Your Points</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <div className="text-5xl font-bold text-primary mb-2" data-testid="text-available-points">
                    {availablePoints.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Available Points</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-total-earned">
                      {totalPoints.toLocaleString()}
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">Total Earned</p>
                  </div>
                  <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400" data-testid="text-total-redeemed">
                      {totalRedeemed.toLocaleString()}
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-1">Redeemed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Your Referral Code
                </CardTitle>
                <CardDescription>Share this code to earn points when friends shop</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-6 bg-primary/10 border-2 border-primary/30 rounded-lg text-center">
                  <code className="text-3xl font-mono font-bold text-primary" data-testid="text-referral-code">
                    {customer?.referralCode}
                  </code>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-4">
            {customerCoupons.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Store className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Shops Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Register at a shop first to start earning points
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("shops")}
                    data-testid="button-go-to-shops"
                  >
                    Browse Shops
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading text-sm">Select Shop</CardTitle>
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
                            data-testid={`button-select-shop-${shop.id}`}
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

                {selectedShop && activeCoupon && (
                  <BillUpload
                    customerId={customerId!}
                    couponId={activeCoupon.id}
                    campaignId={selectedShop.campaigns?.[0]?.id || ''}
                    pointRules={selectedShop.campaigns?.[0]?.pointRules || [{ minAmount: 0, maxAmount: 999999, points: 10 }]}
                    minPurchaseAmount={selectedShop.campaigns?.[0]?.minPurchaseAmount || 0}
                    shopName={selectedShop.shopName}
                    onSuccess={() => {
                      queryClient.invalidateQueries({ queryKey: ['/api/customers', customerId] });
                      queryClient.invalidateQueries({ queryKey: ['/api/transactions', customerId] });
                      setActiveTab("history");
                    }}
                  />
                )}

                {!selectedShop && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <p className="text-sm text-muted-foreground">Select a shop above to upload a bill</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* Shops Tab */}
          <TabsContent value="shops" className="space-y-4">
            <MyShops customerId={customerId!} />
            <ShopSearch 
              customerId={customerId!} 
              existingShopIds={customerCoupons.map((c: any) => c.shopProfileId)}
            />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
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
