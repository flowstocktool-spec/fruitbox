import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignBuilder } from "@/components/CampaignBuilder";
import { CampaignCard } from "@/components/CampaignCard";
import { BillApprovalCard } from "@/components/BillApprovalCard";
import { StatsCard } from "@/components/StatsCard";
import { ShopSettings } from "@/components/ShopSettings";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { Store, LogOut, Settings, TrendingUp, Users, DollarSign } from "lucide-react";
import {
  getCampaigns,
  getTransactions,
  getShopProfile,
  loginShopOwner,
} from "@/lib/api";

export default function StoreDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shopProfile, setShopProfile] = useState<any>(null);
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if already logged in
  useEffect(() => {
    const savedShopId = localStorage.getItem("shopOwnerId");
    if (savedShopId) {
      getShopProfile(savedShopId)
        .then((profile) => {
          setShopProfile(profile);
          setIsAuthenticated(true);
        })
        .catch(() => {
          localStorage.removeItem("shopOwnerId");
        });
    }
  }, []);

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return loginShopOwner(username, password);
    },
    onSuccess: (data) => {
      setShopProfile(data);
      setIsAuthenticated(true);
      localStorage.setItem("shopOwnerId", data.id);
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.shopName}!`,
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.username || !loginData.password) {
      toast({
        title: "Error",
        description: "Please enter username and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleLogout = () => {
    localStorage.removeItem("shopOwnerId");
    setShopProfile(null);
    setIsAuthenticated(false);
    setLoginData({ username: "", password: "" });
    queryClient.clear();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    });
  };

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns", shopProfile?.id],
    queryFn: () => getCampaigns(shopProfile?.id),
    enabled: isAuthenticated && !!shopProfile?.id,
  });

  const { data: pendingTransactions = [] } = useQuery({
    queryKey: ["pending-transactions", shopProfile?.id],
    queryFn: async () => {
      const allTransactions = await getTransactions();
      return allTransactions.filter(
        (t: any) => t.status === "pending" && 
        campaigns.some((c: any) => c.id === t.campaignId)
      );
    },
    enabled: isAuthenticated && campaigns.length > 0,
  });

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-heading text-center">Shop Owner Login</CardTitle>
            <CardDescription className="text-center">
              Sign in to manage your referral campaigns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
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
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard after authentication
  const totalRevenue = campaigns.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0);
  const totalCustomers = campaigns.reduce((sum: number, c: any) => sum + (c.participantCount || 0), 0);
  const conversionRate = totalCustomers > 0 ? ((totalRevenue / totalCustomers) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center">
                <Store className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold font-heading">{shopProfile?.shopName}</h1>
                <p className="text-sm text-muted-foreground">Store Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            title="Total Revenue"
            value={`₹${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+12.5%"
          />
          <StatsCard
            title="Active Customers"
            value={totalCustomers.toString()}
            icon={Users}
            trend="+8.2%"
          />
          <StatsCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            trend="+3.1%"
          />
        </div>

        <Tabs defaultValue="campaigns" className="space-y-6">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="approvals">
              Pending Approvals
              {pendingTransactions.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                  {pendingTransactions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-6">
            <CampaignBuilder storeId={shopProfile?.id} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {campaigns.map((campaign: any) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="approvals">
            <div className="grid grid-cols-1 gap-4">
              {pendingTransactions.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No pending approvals
                  </CardContent>
                </Card>
              ) : (
                pendingTransactions.map((transaction: any) => (
                  <BillApprovalCard key={transaction.id} transaction={transaction} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <ShopSettings shopProfile={shopProfile} onUpdate={setShopProfile} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}