import { CampaignBuilder } from "../CampaignBuilder";

export default function CampaignBuilderExample() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <CampaignBuilder
        onSubmit={(data) => console.log("Campaign submitted:", data)}
      />
    </div>
  );
}
