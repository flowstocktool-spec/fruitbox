
import { db } from "./db";
import { shopProfiles } from "@shared/schema";

async function clearShopProfiles() {
  try {
    console.log("Deleting all shop profiles...");
    
    await db.delete(shopProfiles);
    
    console.log("✅ All shop profiles have been deleted successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error deleting shop profiles:", error);
    process.exit(1);
  }
}

clearShopProfiles();
