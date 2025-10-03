import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignBuilder } from "@/components/CampaignBuilder";
import { CampaignCard } from "@/components/CampaignCard";
import { BillApprovalCard } from "@/components/BillApprovalCard";
import { StatsCard } from "@/components/StatsCard";
import { ShopSettings } from "@/components/ShopSettings";
import { ShopAuthScreen } from "@/components/ShopAuthScreen";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { Store, LogOut, Settings, TrendingUp, Users, DollarSign } from "lucide-react";
import {
  getCampaigns,
  getTransactions,
  getShopProfile,
  getCurrentShop
} from "@/lib/api";

export default function StoreDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shopProfile, setShopProfile] = useState<any>(null);
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

  const handleLogout = () => {
    localStorage.removeItem("shopOwnerId");
    setShopProfile(null);
    setIsAuthenticated(false);
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

  // Customers query
  const { data: customers = [], refetch: refetchCustomers } = useQuery({
    queryKey: ['/api/shop-profiles', shopProfile?.id, 'customers'],
    queryFn: async () => {
      if (!shopProfile?.id) {
        console.log("No shop profile ID available");
        return [];
      }
      console.log("Fetching customers for shop:", shopProfile.id);
      const response = await fetch(`/api/shop-profiles/${shopProfile.id}/customers`);
      if (!response.ok) {
        const error = await response.text();
        console.error("Failed to fetch customers:", error);
        throw new Error('Failed to fetch customers');
      }
      const data = await response.json();
      console.log("Customers fetched:", data.length, data);
      return data;
    },
    enabled: !!shopProfile,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <ShopAuthScreen onSuccess={(profile) => {
      setShopProfile(profile);
      setIsAuthenticated(true);
      localStorage.setItem("shopOwnerId", profile.id);
      toast({
        title: "Success",
        description: `Welcome, ${profile.shopName}!`,
      });
    }} />;
  }

  // Main dashboard after authentication
  const totalRevenue = campaigns.reduce((sum: number, c: any) => sum + (c.totalRevenue || 0), 0);
  const totalCustomers = customers.length; // Use the fetched customers count
  const conversionRate = totalCustomers > 0 ? ((totalRevenue / totalCustomers) * 100).toFixed(1) : "0";

  return (
    <div className="min-h-screen bg-background pb-safe">
      <header className="border-b bg-card sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <Store className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold font-heading truncate">{shopProfile?.shopName}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Store Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout" className="flex-shrink-0">
                <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatsCard
            title="Total Revenue"
            value={`${shopProfile?.currencySymbol || '$'}${totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend="+12.5%"
            description={`% from last month`}
          />
          <StatsCard
            title="Active Customers"
            value={totalCustomers.toString()}
            icon={Users}
            trend="+8.2%"
            description={`% from last month`}
          />
          <StatsCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            icon={TrendingUp}
            trend="+3.1%"
            description={`% from last month`}
          />
        </div>

        <Tabs defaultValue="campaigns" className="space-y-4 sm:space-y-6">
          <TabsList className="w-full grid grid-cols-3 h-auto">
            <TabsTrigger value="campaigns" className="text-xs sm:text-sm">
              <span className="hidden sm:inline">Campaigns</span>
              <span className="sm:hidden">📊</span>
            </TabsTrigger>
            <TabsTrigger value="approvals" className="text-xs sm:text-sm relative">
              <span className="hidden sm:inline">Pending Approvals</span>
              <span className="sm:hidden">✓</span>
              {pendingTransactions.length > 0 && (
                <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 text-xs rounded-full bg-destructive text-destructive-foreground">
                  {pendingTransactions.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm">
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="space-y-4 sm:space-y-6">
            <CampaignBuilder storeId={shopProfile?.id} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
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
            <ShopSettings shopProfile={shopProfile} onUpdate={(profile) => {
              setShopProfile(profile);
              queryClient.invalidateQueries({ queryKey: ['/api/shops/me'] });
            }} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}