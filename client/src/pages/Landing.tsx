import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Store, Users, TrendingUp, Gift, QrCode, Smartphone, User } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "wouter";
import { QRCodeSVG } from "qrcode.react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const pwaUrl = `${window.location.origin}/customer`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold font-heading">Fruitbox</h1>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={() => setLocation("/store")} data-testid="button-store-login">
                Store Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-heading mb-4 sm:mb-6 bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
            Reward Customers, Boost Walk-ins
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6 sm:mb-8 px-2">
            Create viral referral campaigns for your offline store. Turn customers into brand ambassadors with smart rewards.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md mx-auto">
            <Button
              onClick={() => setLocation("/customer")}
              size="lg"
              className="w-full sm:w-auto"
            >
              <User className="h-5 w-5 mr-2" />
              Customer Login
            </Button>
            <Button
              onClick={() => setLocation("/store")}
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Store className="h-5 w-5 mr-2" />
              Store Login
            </Button>
          </div>
        </div>

        <div className="mb-12 sm:mb-16">
          <Card className="max-w-md mx-auto bg-gradient-to-br from-primary/5 to-chart-2/5">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="font-heading">Scan to Access Customer PWA</CardTitle>
              <CardDescription>
                Scan this QR code with your phone to access the customer app instantly
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="bg-white dark:bg-white p-4 rounded-lg" data-testid="qr-code-pwa">
                <QRCodeSVG
                  value={pwaUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Or visit: <span className="font-mono text-primary">{pwaUrl}</span>
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-12 sm:mb-16">
          <Card className="hover-elevate">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-heading text-lg sm:text-xl">For Store Owners</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Complete dashboard to manage campaigns and track performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-xs sm:text-sm">Create custom referral campaigns with flexible rules</p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-xs sm:text-sm">Approve customer bills with photo verification</p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-xs sm:text-sm">Real-time analytics and conversion tracking</p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-xs sm:text-sm">Configure points, rewards, and incentives</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-chart-2/20 flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-chart-2" />
              </div>
              <CardTitle className="font-heading text-lg sm:text-xl">For Customers</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Simple app to track points and share referral coupons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2" />
                <p className="text-xs sm:text-sm">View points dashboard with progress tracking</p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2" />
                <p className="text-xs sm:text-sm">Share branded coupons via social media</p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2" />
                <p className="text-xs sm:text-sm">Access unique QR code and referral link</p>
              </div>
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2" />
                <p className="text-xs sm:text-sm">Track transaction history and rewards</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-chart-2/10 rounded-lg p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold font-heading mb-4">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                <QrCode className="h-8 w-8 text-primary" />
              </div>
              <h4 className="font-semibold font-heading">1. Create Campaign</h4>
              <p className="text-sm text-muted-foreground">
                Set up your referral rules, rewards, and customize your coupon design
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-chart-2/20 flex items-center justify-center mx-auto">
                <Users className="h-8 w-8 text-chart-2" />
              </div>
              <h4 className="font-semibold font-heading">2. Customers Share</h4>
              <p className="text-sm text-muted-foreground">
                Customers scan QR code, get their unique coupon, and share with friends
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-16 h-16 rounded-full bg-chart-3/20 flex items-center justify-center mx-auto">
                <TrendingUp className="h-8 w-8 text-chart-3" />
              </div>
              <h4 className="font-semibold font-heading">3. Track & Grow</h4>
              <p className="text-sm text-muted-foreground">
                Approve purchases, award points automatically, and watch your sales grow
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2024 Fruitbox. Helping offline stores grow through customer referrals.
          </p>
        </div>
      </footer>
    </div>
  );
}