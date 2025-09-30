import { StatsCard } from "../StatsCard";
import { Users, TrendingUp, DollarSign, Gift } from "lucide-react";

export default function StatsCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
      <StatsCard
        title="Total Customers"
        value="1,234"
        description="Active referrers"
        icon={Users}
        trend={{ value: 12, isPositive: true }}
      />
      <StatsCard
        title="Total Revenue"
        value="$45,678"
        description="From referrals"
        icon={DollarSign}
        trend={{ value: 8, isPositive: true }}
      />
      <StatsCard
        title="Conversion Rate"
        value="24.5%"
        description="Referral to purchase"
        icon={TrendingUp}
        trend={{ value: -3, isPositive: false }}
      />
      <StatsCard
        title="Points Redeemed"
        value="8,456"
        description="This month"
        icon={Gift}
        trend={{ value: 15, isPositive: true }}
      />
    </div>
  );
}
