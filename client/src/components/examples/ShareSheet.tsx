import { useState } from "react";
import { ShareSheet } from "../ShareSheet";
import { Button } from "@/components/ui/button";

export default function ShareSheetExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-4 max-w-md mx-auto flex items-center justify-center min-h-[200px]">
      <Button onClick={() => setOpen(true)}>
        Open Share Sheet
      </Button>
      <ShareSheet
        open={open}
        onOpenChange={setOpen}
        referralCode="ALEX2024"
        campaignName="Summer Rewards"
        discountPercentage={10}
      />
    </div>
  );
}
