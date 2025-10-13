import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { createShopProfile, updateShopProfile } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Store, MapPin, Phone, Mail, Globe, Clock, Share2, Shield, Upload, X } from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiTiktok, SiYoutube } from "react-icons/si";

interface ShopSettingsProps {
  shopProfile?: any;
  onSuccess?: () => void;
  onUpdate?: (profile: any) => void;
}

const BUSINESS_CATEGORIES = [
  "Restaurant & Food",
  "Retail & Fashion",
  "Grocery & Supermarket",
  "Beauty & Wellness",
  "Electronics & Technology",
  "Home & Garden",
  "Sports & Fitness",
  "Books & Stationery",
  "Pharmacy & Healthcare",
  "Automotive",
  "Entertainment & Events",
  "Professional Services",
  "Other"
];

const BUSINESS_TYPES = [
  { value: "physical", label: "Physical Store Only" },
  { value: "online", label: "Online Store Only" },
  { value: "both", label: "Both Physical & Online" }
];

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export function ShopSettings({ shopProfile, onSuccess, onUpdate }: ShopSettingsProps) {
  const isEdit = !!shopProfile;
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    shopName: shopProfile?.shopName || "",
    shopCode: shopProfile?.shopCode || "",
    description: shopProfile?.description || "",
    logo: shopProfile?.logo || "",
    category: shopProfile?.category || "",
    businessType: shopProfile?.businessType || "",
    phone: shopProfile?.phone || "",
    email: shopProfile?.email || "",
    address: shopProfile?.address || "",
    website: shopProfile?.website || "",
    taxId: shopProfile?.taxId || "",
    businessHours: shopProfile?.businessHours || {},
    socialLinks: shopProfile?.socialLinks || {},
    currencySymbol: shopProfile?.currencySymbol || "$",
  });

  const [logoPreview, setLogoPreview] = useState(shopProfile?.logo || "");

  const mutation = useMutation({
    mutationFn: (data: any) => {
      if (isEdit) {
        return updateShopProfile(shopProfile.id, data);
      }
      return createShopProfile(data);
    },
    onSuccess: (updatedProfile) => {
      queryClient.invalidateQueries({ queryKey: ['/api/shop-profiles'] });
      if (isEdit && shopProfile?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/shop-profiles/${shopProfile.id}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/shops/me'] });
      }
      toast({
        title: "Success!",
        description: isEdit ? "Shop profile updated successfully" : "Shop profile created successfully",
      });
      if (updatedProfile && onUpdate) {
        onUpdate(updatedProfile);
      }
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save shop settings",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, logo: url });
    setLogoPreview(url);
  };

  const handleBusinessHoursChange = (day: string, field: string, value: string | boolean) => {
    setFormData({
      ...formData,
      businessHours: {
        ...formData.businessHours,
        [day]: {
          ...(formData.businessHours[day] || {}),
          [field]: value
        }
      }
    });
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData({
      ...formData,
      socialLinks: {
        ...formData.socialLinks,
        [platform]: value
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Login Credentials - Only for Edit Mode */}
      {isEdit && shopProfile && (
        <Card className="bg-muted/50 border-amber-200 dark:border-amber-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-600" />
              <CardTitle className="text-sm">Login Credentials</CardTitle>
            </div>
            <CardDescription>Your shop account details - Keep these secure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Username</Label>
                <div className="mt-1 p-2 bg-background border rounded-md font-mono text-sm">
                  {shopProfile.username}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Password</Label>
                <div className="mt-1 p-2 bg-background border rounded-md font-mono text-sm">
                  {shopProfile.password}
                </div>
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              Keep these credentials secure. Use them to login to your shop dashboard.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Logo & Branding */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <CardTitle>Logo & Branding</CardTitle>
          </div>
          <CardDescription>Add your shop logo and branding elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            {logoPreview && (
              <div className="relative">
                <img 
                  src={logoPreview} 
                  alt="Shop Logo Preview" 
                  className="h-24 w-24 rounded-lg object-cover border-2 border-border"
                  onError={() => setLogoPreview("")}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => {
                    setLogoPreview("");
                    setFormData({ ...formData, logo: "" });
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex-1 w-full">
              <Label htmlFor="logo">Logo URL</Label>
              <Input
                id="logo"
                value={formData.logo}
                onChange={handleLogoChange}
                placeholder="https://example.com/logo.png"
                data-testid="input-logo"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Enter the URL of your shop logo image
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <CardTitle>Basic Information</CardTitle>
          </div>
          <CardDescription>Essential details about your shop</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="shopName">
                Shop Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shopName"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                required
                data-testid="input-shop-name"
              />
            </div>
            <div>
              <Label htmlFor="shopCode">
                Shop Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="shopCode"
                value={formData.shopCode}
                onChange={(e) => setFormData({ ...formData, shopCode: e.target.value })}
                placeholder="e.g., FRUITBOX2025"
                required
                disabled={isEdit}
                data-testid="input-shop-code"
              />
              {isEdit && (
                <p className="text-xs text-muted-foreground mt-1">
                  Shop code cannot be changed
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of your shop and what you offer"
              rows={3}
              data-testid="input-description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Business Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={formData.businessType}
                onValueChange={(value) => setFormData({ ...formData, businessType: value })}
              >
                <SelectTrigger id="businessType" data-testid="select-business-type">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="taxId">Tax ID / Business Registration</Label>
            <Input
              id="taxId"
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              placeholder="Your business registration or tax ID number"
              data-testid="input-tax-id"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Optional - helps build trust with customers
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Contact & Location */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <CardTitle>Contact & Location</CardTitle>
          </div>
          <CardDescription>How customers can reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                data-testid="input-phone"
              />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Support Email
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="support@yourshop.com"
                data-testid="input-email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Business Address
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="123 Main St, City, State, ZIP"
              data-testid="input-address"
            />
          </div>

          <div>
            <Label htmlFor="website" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.yourshop.com"
              data-testid="input-website"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <CardTitle>Business Hours</CardTitle>
          </div>
          <CardDescription>Set your operating hours for each day</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {DAYS.map((day) => {
            const hours = formData.businessHours[day] || { open: "09:00", close: "17:00", closed: false };
            return (
              <div key={day} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                <div className="w-24">
                  <Badge variant="outline" className="capitalize">
                    {day.substring(0, 3)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <Switch
                    checked={!hours.closed}
                    onCheckedChange={(checked) => handleBusinessHoursChange(day, "closed", !checked)}
                    data-testid={`switch-${day}-open`}
                  />
                  {!hours.closed ? (
                    <>
                      <Input
                        type="time"
                        value={hours.open || "09:00"}
                        onChange={(e) => handleBusinessHoursChange(day, "open", e.target.value)}
                        className="w-32"
                        data-testid={`input-${day}-open`}
                      />
                      <span className="text-muted-foreground">to</span>
                      <Input
                        type="time"
                        value={hours.close || "17:00"}
                        onChange={(e) => handleBusinessHoursChange(day, "close", e.target.value)}
                        className="w-32"
                        data-testid={`input-${day}-close`}
                      />
                    </>
                  ) : (
                    <span className="text-muted-foreground italic">Closed</span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            <CardTitle>Social Media Links</CardTitle>
          </div>
          <CardDescription>Connect your social media profiles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facebook" className="flex items-center gap-2">
                <SiFacebook className="h-3 w-3 text-blue-600" />
                Facebook
              </Label>
              <Input
                id="facebook"
                value={formData.socialLinks.facebook || ""}
                onChange={(e) => handleSocialLinkChange("facebook", e.target.value)}
                placeholder="https://facebook.com/yourshop"
                data-testid="input-facebook"
              />
            </div>
            <div>
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <SiInstagram className="h-3 w-3 text-pink-600" />
                Instagram
              </Label>
              <Input
                id="instagram"
                value={formData.socialLinks.instagram || ""}
                onChange={(e) => handleSocialLinkChange("instagram", e.target.value)}
                placeholder="https://instagram.com/yourshop"
                data-testid="input-instagram"
              />
            </div>
            <div>
              <Label htmlFor="twitter" className="flex items-center gap-2">
                <SiX className="h-3 w-3" />
                X (Twitter)
              </Label>
              <Input
                id="twitter"
                value={formData.socialLinks.twitter || ""}
                onChange={(e) => handleSocialLinkChange("twitter", e.target.value)}
                placeholder="https://x.com/yourshop"
                data-testid="input-twitter"
              />
            </div>
            <div>
              <Label htmlFor="tiktok" className="flex items-center gap-2">
                <SiTiktok className="h-3 w-3" />
                TikTok
              </Label>
              <Input
                id="tiktok"
                value={formData.socialLinks.tiktok || ""}
                onChange={(e) => handleSocialLinkChange("tiktok", e.target.value)}
                placeholder="https://tiktok.com/@yourshop"
                data-testid="input-tiktok"
              />
            </div>
            <div>
              <Label htmlFor="youtube" className="flex items-center gap-2">
                <SiYoutube className="h-3 w-3 text-red-600" />
                YouTube
              </Label>
              <Input
                id="youtube"
                value={formData.socialLinks.youtube || ""}
                onChange={(e) => handleSocialLinkChange("youtube", e.target.value)}
                placeholder="https://youtube.com/@yourshop"
                data-testid="input-youtube"
              />
            </div>
            <div>
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <SiLinkedin className="h-3 w-3 text-blue-700" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                value={formData.socialLinks.linkedin || ""}
                onChange={(e) => handleSocialLinkChange("linkedin", e.target.value)}
                placeholder="https://linkedin.com/company/yourshop"
                data-testid="input-linkedin"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>Set your preferred currency symbol</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full md:w-1/2">
            <Label htmlFor="currencySymbol">Currency Symbol</Label>
            <Select
              value={formData.currencySymbol}
              onValueChange={(value) => setFormData({ ...formData, currencySymbol: value })}
            >
              <SelectTrigger id="currencySymbol" data-testid="select-currency">
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
        </CardContent>
      </Card>

      <Separator />

      <Button 
        type="submit" 
        className="w-full" 
        disabled={mutation.isPending}
        data-testid="button-save-shop-profile"
      >
        {mutation.isPending ? "Saving..." : isEdit ? "Update Shop Profile" : "Create Shop Profile"}
      </Button>
    </form>
  );
}
