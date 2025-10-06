
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store } from "lucide-react";
import { loginShopOwner, registerShopOwner, resetShopPassword } from "@/lib/api";

interface ShopAuthScreenProps {
  onSuccess: (profile: any) => void;
}

export function ShopAuthScreen({ onSuccess }: ShopAuthScreenProps) {
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetData, setResetData] = useState({
    username: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [registerData, setRegisterData] = useState({
    shopName: "",
    shopCode: "",
    username: "",
    password: "",
    description: "",
    category: "",
    address: "",
    phone: "",
    currencySymbol: "$",
    pointsPerDollar: 1,
    discountPercentage: 10,
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      return loginShopOwner(username, password);
    },
    onSuccess: (data) => {
      localStorage.setItem('hasShopLoggedIn', 'true');
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

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ username, newPassword }: { username: string; newPassword: string }) => {
      return resetShopPassword(username, newPassword);
    },
    onSuccess: () => {
      toast({
        title: "Password reset successful",
        description: "You can now login with your new password",
      });
      setShowPasswordReset(false);
      setResetData({ username: "", newPassword: "", confirmPassword: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
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

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetData.username || !resetData.newPassword) {
      toast({
        title: "Error",
        description: "Please enter username and new password",
        variant: "destructive",
      });
      return;
    }
    if (resetData.newPassword !== resetData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    resetPasswordMutation.mutate({
      username: resetData.username,
      newPassword: resetData.newPassword,
    });
  };

  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="font-heading text-center">Reset Shop Password</CardTitle>
            <CardDescription className="text-center">
              Enter your username and new password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <Label htmlFor="reset-username">Username</Label>
                <Input
                  id="reset-username"
                  value={resetData.username}
                  onChange={(e) => setResetData({ ...resetData, username: e.target.value })}
                  placeholder="Enter your username"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={resetData.newPassword}
                  onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={resetData.confirmPassword}
                  onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                  required
                />
              </div>
              <Button
                type="submit"
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
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowPasswordReset(true)}
                >
                  Forgot Password?
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

                <div>
                  <Label htmlFor="currencySymbol">Currency Symbol</Label>
                  <Select
                    value={registerData.currencySymbol}
                    onValueChange={(value) => setRegisterData({ ...registerData, currencySymbol: value })}
                  >
                    <SelectTrigger id="currencySymbol">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ - US Dollar</SelectItem>
                      <SelectItem value="₹">₹ - Indian Rupee</SelectItem>
                      <SelectItem value="€">€ - Euro</SelectItem>
                      <SelectItem value="£">£ - British Pound</SelectItem>
                      <SelectItem value="¥">¥ - Japanese Yen</SelectItem>
                      <SelectItem value="₩">₩ - Korean Won</SelectItem>
                      <SelectItem value="₦">₦ - Nigerian Naira</SelectItem>
                      <SelectItem value="R">R - South African Rand</SelectItem>
                      <SelectItem value="A$">A$ - Australian Dollar</SelectItem>
                      <SelectItem value="C$">C$ - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pointsPerDollar">Points per {registerData.currencySymbol}1</Label>
                    <Input
                      id="pointsPerDollar"
                      type="number"
                      min="1"
                      value={registerData.pointsPerDollar}
                      onChange={(e) => setRegisterData({ ...registerData, pointsPerDollar: parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="discountPercentage">Discount %</Label>
                    <Input
                      id="discountPercentage"
                      type="number"
                      min="0"
                      max="100"
                      value={registerData.discountPercentage}
                      onChange={(e) => setRegisterData({ ...registerData, discountPercentage: parseInt(e.target.value) })}
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
