import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import StoreDashboard from "@/pages/StoreDashboard";
import CustomerPWA from "@/pages/CustomerPWA";
import JoinCampaign from "@/pages/JoinCampaign";
import JoinSharedCoupon from "@/pages/JoinSharedCoupon";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/store" component={StoreDashboard} />
      <Route path="/customer/:code?" component={CustomerPWA} />
      <Route path="/join/:campaignId" component={JoinCampaign} />
      <Route path="/shared-coupon/:token" component={JoinSharedCoupon} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;