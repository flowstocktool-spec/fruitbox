
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, UserPlus, ArrowRight } from "lucide-react";
import { createCustomer, generateReferralCode, getCustomerByCode } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function JoinSharedCoupon() {
  const { code } = useParams<{ code?: string }>();
  const [, setLocation] = useLocation();
  const [registrationData, setRegistrationData] = useState({
    name: "",
    phone: "",
    email: ""
  });
  const { toast } = useToast();

  // Check if user already has an account
  const existingCustomerCode = localStorage.getItem('customerCode');
  
  // Get the coupon owner's info
  const { data: couponOwner, isLoading, isError } = useQuery({
    queryKey: ['/api/customers/code', code],
    queryFn: () => getCustomerByCode(code!),
    enabled: !!code,
    retry: false,
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
      localStorage.setItem('customerCode', newCustomer.referralCode);
      localStorage.setItem('sharedCouponCode', code!);
      queryClient.invalidateQueries({ queryKey: ['/api/customers/code'] });
      toast({
        title: "Welcome!",
        description: "Account created! Redirecting to your dashboard...",
      });
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

  useEffect(() => {
    if (existingCustomerCode) {
      // User already has account, store the shared coupon and redirect
      localStorage.setItem('sharedCouponCode', code!);
      setLocation('/customer');
    }
  }, [existingCustomerCode, code, setLocation]);

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

  const handleExistingUser = () => {
    setLocation('/customer');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (isError || !couponOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="w-12 h-12 rounded-lg bg-destructive/20 flex items-center justify-center mx-auto mb-4">
              <Gift className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Coupon Not Found</CardTitle>
            <CardDescription>
              This coupon link is no longer active or doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setLocation('/')} 
              className="w-full"
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
          <CardTitle className="font-heading text-2xl">You're Invited!</CardTitle>
          <CardDescription className="text-base">
            <strong>{couponOwner.name}</strong> shared their referral coupon with you.
            Join now to start earning rewards!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center p-4 bg-primary/10 rounded-lg">
            <p className="text-sm font-medium text-primary mb-1">Referral Code</p>
            <p className="text-xl font-bold font-mono">{code}</p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleExistingUser}
              variant="outline" 
              className="w-full"
            >
              I Already Have an Account
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or create new account
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
                {createCustomerMutation.isPending ? "Creating Account..." : "Join & Start Earning"}
                <UserPlus className="h-4 w-4 ml-2" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
