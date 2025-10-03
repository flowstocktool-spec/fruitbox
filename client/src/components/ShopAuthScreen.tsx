import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Store } from "lucide-react";
import { loginShopOwner, registerShopOwner } from "@/lib/api";

interface ShopAuthScreenProps {
  onSuccess: (profile: any) => void;
}

export function ShopAuthScreen({ onSuccess }: ShopAuthScreenProps) {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    shopName: "",
    shopCode: "",
    username: "",
    password: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    currency: "INR", // Default currency
    currencySymbol: "₹", // Default currency symbol
    pointsPerUnit: 1, // Renamed from pointsPerDollar
    discountPercentage: 10,
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return loginShopOwner(username, password);
    },
    onSuccess: (data) => {
      onSuccess(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      return registerShopOwner(data);
    },
    onSuccess: (data) => {
      onSuccess(data);
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
        title: "Error",
        description: "Please enter username and password",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.shopName || !registerData.shopCode || !registerData.username || !registerData.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    registerMutation.mutate(registerData);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Store className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="font-heading text-center">Shop Owner Portal</CardTitle>
          <CardDescription className="text-center">
            Sign in or create a new shop account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4 mt-4">
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
              </form>
            </TabsContent>

            <TabsContent value="register" className="space-y-4 mt-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shopName">Shop Name *</Label>
                    <Input
                      id="shopName"
                      value={registerData.shopName}
                      onChange={(e) => setRegisterData({ ...registerData, shopName: e.target.value })}
                      placeholder="e.g., Coffee Haven"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shopCode">Shop Code *</Label>
                    <Input
                      id="shopCode"
                      value={registerData.shopCode}
                      onChange={(e) => setRegisterData({ ...registerData, shopCode: e.target.value })}
                      placeholder="e.g., COFFEE2025"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Unique identifier for your shop</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="register-username">Username *</Label>
                    <Input
                      id="register-username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      placeholder="Choose a username"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-password">Password *</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="Choose a password"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={registerData.description}
                    onChange={(e) => setRegisterData({ ...registerData, description: e.target.value })}
                    placeholder="Brief description of your shop"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={registerData.category}
                      onChange={(e) => setRegisterData({ ...registerData, category: e.target.value })}
                      placeholder="e.g., Café, Retail"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      placeholder="Contact number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={registerData.address}
                    onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                    placeholder="Shop address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="register-currency">Currency</Label>
                    <Input
                      id="register-currency"
                      value={registerData.currency}
                      onChange={(e) => setRegisterData({ ...registerData, currency: e.target.value })}
                      placeholder="INR, USD, EUR, etc."
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-currencySymbol">Currency Symbol</Label>
                    <Input
                      id="register-currencySymbol"
                      value={registerData.currencySymbol}
                      onChange={(e) => setRegisterData({ ...registerData, currencySymbol: e.target.value })}
                      placeholder="₹, $, €, etc."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="register-pointsPerUnit">Points per Currency Unit</Label>
                    <Input
                      id="register-pointsPerUnit"
                      type="number"
                      min="1"
                      value={registerData.pointsPerUnit}
                      onChange={(e) => setRegisterData({ ...registerData, pointsPerUnit: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="register-discountPercentage">Referral Discount (%)</Label>
                    <Input
                      id="register-discountPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={registerData.discountPercentage}
                      onChange={(e) => setRegisterData({ ...registerData, discountPercentage: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Creating Account..." : "Create Shop Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}