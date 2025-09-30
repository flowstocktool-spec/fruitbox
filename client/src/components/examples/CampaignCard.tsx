import { CampaignCard } from "../CampaignCard";

export default function CampaignCardExample() {
  const campaign = {
    id: "1",
    storeId: "store-1",
    name: "Summer Rewards Campaign",
    description: "Earn points on every purchase and get your friends 10% off!",
    pointsPerDollar: 5,
    minPurchaseAmount: 25,
    discountPercentage: 10,
    couponColor: "#2563eb",
    couponTextColor: "#ffffff",
    isActive: true,
    createdAt: new Date(),
  };

  return (
    <div className="p-4 max-w-md">
      <CampaignCard
        campaign={campaign}
        onViewQR={() => console.log("View QR clicked")}
        onSettings={() => console.log("Settings clicked")}
      />
    </div>
  );
}
