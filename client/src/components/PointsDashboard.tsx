import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Gift, TrendingUp } from "lucide-react";

interface PointsDashboardProps {
  totalPoints: number;
  redeemedPoints: number;
  pointsToNextReward?: number;
}

export function PointsDashboard({ totalPoints, redeemedPoints, pointsToNextReward = 1000 }: PointsDashboardProps) {
  const availablePoints = totalPoints - redeemedPoints;
  const progress = (availablePoints / pointsToNextReward) * 100;

  return (
    <Card className="bg-gradient-to-br from-chart-2/20 to-chart-4/20" data-testid="card-points-dashboard">
      <CardHeader>
        <CardTitle className="font-heading flex items-center gap-2">
          <Gift className="h-5 w-5 text-chart-2" />
          Your Rewards
        </CardTitle>
        <CardDescription>Track your points and unlock rewards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-5xl font-bold font-heading text-chart-2 mb-2" data-testid="text-available-points">
            {availablePoints.toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground">Available Points</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Next reward at {pointsToNextReward} points</span>
            <span className="font-medium">{Math.min(100, Math.round(progress))}%</span>
          </div>
          <Progress value={Math.min(100, progress)} className="h-2" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Earned</p>
            <p className="text-2xl font-bold font-heading" data-testid="text-total-points">
              {totalPoints.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Redeemed</p>
            <p className="text-2xl font-bold font-heading" data-testid="text-redeemed-points">
              {redeemedPoints.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
