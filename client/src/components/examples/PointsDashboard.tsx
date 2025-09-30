import { PointsDashboard } from "../PointsDashboard";

export default function PointsDashboardExample() {
  return (
    <div className="p-4 max-w-md mx-auto">
      <PointsDashboard
        totalPoints={2750}
        redeemedPoints={1500}
        pointsToNextReward={2000}
      />
    </div>
  );
}
