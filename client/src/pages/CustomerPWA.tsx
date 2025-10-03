
import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, History, User, Receipt, UserPlus, Plus, Store, Share2, LogOut } from "lucide-react";
import { PointsDashboard } from "@/components/PointsDashboard";
import { TransactionItem } from "@/components/TransactionItem";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BillUpload } from "@/components/BillUpload";
import { ShopSearch } from "@/components/ShopSearch";
import { getTransactions, createCustomer, generateReferralCode, getCustomerCoupons, getShopProfile, loginCustomer } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CustomerPWA() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showShopSearch, setShowShopSearch] = useState(false);
  
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

  // Check if user is already logged in
  useEffect(() => {
    const customerId = localStorage.getItem('customerId');
    if (customerId) {
      // Auto-login if we have a stored customer ID
      fetch(`/api/customers/${customerId}`)
        .then(res => res.json())
        .then(data => {
          setCustomer(data);
          setIsLoggedIn(true);
        })
        .catch(() => {
          localStorage.removeItem('customerId');
        });
    }
  }, []);

  // Customer coupons query
  const { data: coupons = [], refetch: refetchCoupons } = useQuery({
    queryKey: ['/api/customer-coupons', customer?.id],
    queryFn: () => getCustomerCoupons(customer?.id ?? ''),
    enabled: !!customer,
  });

  // Transactions query
  const { data: transactions = [] } = useQuery({
    queryKey: ['/api/transactions', customer?.id],
    queryFn: () => getTransactions(customer?.id ?? '', undefined),
    enabled: !!customer,
  });

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => 
      loginCustomer(username, password),
    onSuccess: (data) => {
      setCustomer(data);
      setIsLoggedIn(true);
      localStorage.setItem('customerId', data.id);
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
      localStorage.setItem('customerId', newCustomer.id);
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

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">My Shop Coupons</h3>
                <Button onClick={() => setShowShopSearch(true)} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Find Shops
                </Button>
              </div>

              {coupons.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-6">
                    <Store className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-3">No shop coupons yet</p>
                    <Button onClick={() => setShowShopSearch(true)} size="sm">
                      Find Shops to Get Coupons
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {coupons.map((coupon) => {
                    const { data: shop } = useQuery({
                      queryKey: ['/api/shop-profiles', coupon.shopProfileId],
                      queryFn: () => getShopProfile(coupon.shopProfileId),
                    });
                    
                    return (
                      <Card key={coupon.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">{shop?.shopName || 'Loading...'}</h4>
                            <span className="text-xs text-muted-foreground bg-green-100 px-2 py-1 rounded">
                              My Coupon
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm mb-3">
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
                          <div className="text-xs text-muted-foreground">
                            Referral Code: <span className="font-mono font-semibold">{coupon.referralCode}</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {showShopSearch && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Store className="h-5 w-5" />
                      Find Shops & Campaigns
                    </CardTitle>
                    <CardDescription>Browse shops, view their offers, and add coupons to start earning</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ShopSearch 
                      customerId={customer.id} 
                      existingShopIds={coupons.map(c => c.shopProfileId)}
                    />
                    <Button 
                      variant="outline" 
                      className="w-full mt-4" 
                      onClick={() => setShowShopSearch(false)}
                    >
                      Close
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">How to Upload a Bill</h3>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Take a photo or select your purchase bill</li>
                  <li>Enter the purchase amount</li>
                  <li>(Optional) Enter an affiliate's coupon code to give them credit</li>
                  <li>Submit for approval</li>
                </ol>
                <p className="text-xs text-blue-600 mt-2">
                  💡 If someone referred you, use their code to help them earn points!
                </p>
              </div>

              <BillUpload
                customerId={customer.id}
                couponId={null}
                pointsPerDollar={1}
                minPurchaseAmount={0}
                discountPercentage={10}
              />
            </div>
          </TabsContent>

          <TabsContent value="share" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Share Referral Link</CardTitle>
                <CardDescription>Invite friends to join and earn rewards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Share</h3>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Share the PWA link below with your friends</li>
                    <li>Ask them to install the app and create an account</li>
                    <li>They should enter your referral code when uploading their first bill</li>
                    <li>Both of you earn rewards when they make a purchase!</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pwa-url">PWA Link</Label>
                  <div className="flex gap-2">
                    <Input
                      id="pwa-url"
                      value={window.location.origin + '/customer'}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.origin + '/customer');
                        toast({
                          title: "Copied!",
                          description: "PWA link copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="referral-code">Your Referral Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="referral-code"
                      value={customer.referralCode || 'N/A'}
                      readOnly
                      className="flex-1 font-mono text-lg"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(customer.referralCode || '');
                        toast({
                          title: "Copied!",
                          description: "Referral code copied to clipboard",
                        });
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Share this code with your friends. They can enter it in the Upload section when submitting their first bill.
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    const message = `Join me on ReferralHub! Install the app here: ${window.location.origin}/customer and use my referral code: ${customer.referralCode}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Join ReferralHub',
                        text: message,
                      });
                    } else {
                      navigator.clipboard.writeText(message);
                      toast({
                        title: "Copied!",
                        description: "Message copied to clipboard. You can now paste it anywhere to share.",
                      });
                    }
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share via Apps
                </Button>
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
    </div>
  );
}
