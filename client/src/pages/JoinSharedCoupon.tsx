import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, UserPlus, ArrowRight, Loader2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { createCustomer, claimSharedCoupon, getSharedCouponByToken } from "@/lib/api";
import type { CustomerCoupon, SharedCoupon, Customer } from "@shared/schema";

export default function JoinSharedCoupon() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [, setLocation] = useLocation();
  
  console.log("URL params:", params);
  console.log("Token from URL:", token);
  console.log("Current location:", window.location.pathname);
  
  const [registrationData, setRegistrationData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const { toast } = useToast();

  // Check if user already has an account
  const existingCustomerCode = localStorage.getItem('customerCode');
  const existingCustomerId = localStorage.getItem('customerId');
  
  // Get the shared coupon info
  const { data: sharedCouponData, isLoading, isError, error } = useQuery<{
    sharedCoupon: SharedCoupon;
    coupon: CustomerCoupon;
  }>({
    queryKey: ['/api/shared-coupons/token', token],
    queryFn: () => {
      console.log("Fetching shared coupon with token:", token);
      if (!token) {
        throw new Error("No token provided");
      }
      return getSharedCouponByToken(token);
    },
    enabled: !!token,
    retry: false,
  });

  console.log("Query state:", { isLoading, isError, error, hasData: !!sharedCouponData });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      // Generate unique referral code
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };
      
      return createCustomer({
        ...data,
        campaignId: null,
        referralCode: generateCode(),
        totalPoints: 0,
        redeemedPoints: 0,
      });
    },
    onSuccess: async (newCustomer: Customer) => {
      localStorage.setItem('customerCode', newCustomer.referralCode);
      localStorage.setItem('customerId', newCustomer.id);
      
      // Claim the shared coupon
      if (sharedCouponData?.sharedCoupon) {
        try {
          await claimSharedCoupon(sharedCouponData.sharedCoupon.id, newCustomer.id);
          
          queryClient.invalidateQueries({ queryKey: ['/api/customer-coupons'] });
          toast({
            title: "Success!",
            description: "Account created and coupon claimed! Redirecting...",
          });
        } catch (error) {
          toast({
            title: "Account Created",
            description: "But there was an issue claiming the coupon.",
            variant: "destructive",
          });
        }
      }
      
      setTimeout(() => {
        setLocation('/customer');
      }, 1500);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const claimCouponMutation = useMutation({
    mutationFn: async () => {
      if (!sharedCouponData?.sharedCoupon || !existingCustomerId) {
        throw new Error("Missing data");
      }
      
      return claimSharedCoupon(sharedCouponData.sharedCoupon.id, existingCustomerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/customer-coupons'] });
      toast({
        title: "Success!",
        description: "Coupon claimed! Redirecting to your dashboard...",
      });
      setTimeout(() => {
        setLocation('/customer');
      }, 1500);
    },
    onError: (error: any) => {
      const message = error.message || "Failed to claim coupon";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (existingCustomerCode && existingCustomerId && sharedCouponData?.sharedCoupon && !claimCouponMutation.isPending && !claimCouponMutation.isSuccess) {
      // User already has account, claim the coupon
      claimCouponMutation.mutate();
    }
  }, [existingCustomerCode, existingCustomerId, sharedCouponData?.sharedCoupon]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-container">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading shared coupon...</p>
        </div>
      </div>
    );
  }

  if (claimCouponMutation.isPending) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="loading-container">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Claiming your coupon...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <Gift className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              This link is missing the coupon token. Please check the URL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/')} 
              className="w-full"
              data-testid="button-go-home"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || (!isLoading && !sharedCouponData)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <Gift className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Coupon Not Found</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "This coupon link is no longer active or doesn't exist."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/')} 
              className="w-full"
              data-testid="button-go-home"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { sharedCoupon, coupon } = sharedCouponData;

  if (sharedCoupon.status === "claimed") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Gift className="h-6 w-6 text-amber-500" />
            </div>
            <CardTitle>Already Claimed</CardTitle>
            <CardDescription>
              This coupon has already been claimed and is no longer available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/')} 
              className="w-full"
              data-testid="button-go-home-claimed"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-heading text-2xl" data-testid="text-title">You're Invited!</CardTitle>
          <CardDescription className="text-base">
            Someone shared a coupon from <strong>{coupon.shopName}</strong> with you.
            Create an account to claim it and start shopping at a discounted price!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <p className="text-sm font-medium text-primary mb-1">Shop</p>
            <p className="text-xl font-bold" data-testid="text-shop-name">{coupon.shopName}</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Create your account
                </span>
              </div>
            </div>

            <form onSubmit={handleRegistration} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={registrationData.name}
                  onChange={(e) => setRegistrationData({ ...registrationData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                  data-testid="input-name"
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
                  data-testid="input-phone"
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
                  data-testid="input-email"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={createCustomerMutation.isPending}
                data-testid="button-submit"
              >
                {createCustomerMutation.isPending ? "Creating Account..." : "Claim Coupon & Start Shopping"}
                <UserPlus className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
