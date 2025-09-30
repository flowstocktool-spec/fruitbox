import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Store, Users, TrendingUp, Gift, QrCode, Smartphone } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
                <Gift className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold font-heading">ReferralHub</h1>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold font-heading" data-testid="text-hero-title">
            Turn Customers Into Your Best Salespeople
          </h2>
          <p className="text-xl text-muted-foreground">
            Create powerful referral campaigns for your retail store. Reward customers for sharing, 
            track every transaction, and watch your business grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => setLocation("/store")} data-testid="button-get-started">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setLocation("/customer")} data-testid="button-view-demo">
              View Customer Demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <Card className="hover-elevate">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Store className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="font-heading">For Retail Stores</CardTitle>
              <CardDescription>
                Create and manage referral campaigns with custom rewards and rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-sm">Set custom point values and discount percentages</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-sm">Approve bills and award points instantly</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-sm">Track campaign performance with analytics</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                <p className="text-sm">Generate QR codes for easy customer signup</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-chart-2/20 flex items-center justify-center mb-4">
                <Smartphone className="h-6 w-6 text-chart-2" />
              </div>
              <CardTitle className="font-heading">For Customers</CardTitle>
              <CardDescription>
                Simple PWA to track points and share referral coupons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2" />
                <p className="text-sm">View points dashboard with progress tracking</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2" />
                <p className="text-sm">Share branded coupons via social media</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2" />
                <p className="text-sm">Access unique QR code and referral link</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2" />
                <p className="text-sm">Track transaction history and rewards</p>
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
            © 2024 ReferralHub. Transform your customers into brand ambassadors.
          </p>
        </div>
      </footer>
    </div>
  );
}
