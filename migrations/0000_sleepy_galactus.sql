CREATE TABLE "campaigns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" varchar NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"points_per_unit" integer DEFAULT 1 NOT NULL,
	"min_purchase_amount" integer DEFAULT 0 NOT NULL,
	"discount_percentage" integer DEFAULT 10 NOT NULL,
	"coupon_color" text DEFAULT '#2563eb' NOT NULL,
	"coupon_text_color" text DEFAULT '#ffffff' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_coupons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"shop_profile_id" varchar NOT NULL,
	"referral_code" text NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"redeemed_points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_coupons_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" varchar,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"email" text,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"referral_code" text NOT NULL,
	"total_points" integer DEFAULT 0 NOT NULL,
	"redeemed_points" integer DEFAULT 0 NOT NULL,
	"device_id" text,
	"device_fingerprint" text,
	"last_device_verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customers_username_unique" UNIQUE("username"),
	CONSTRAINT "customers_referral_code_unique" UNIQUE("referral_code")
);
--> statement-breakpoint
CREATE TABLE "shared_coupons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"coupon_id" varchar NOT NULL,
	"shared_by_customer_id" varchar NOT NULL,
	"share_token" text NOT NULL,
	"claimed_by_customer_id" varchar,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "shared_coupons_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE "shop_profiles" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_name" text NOT NULL,
	"shop_code" text NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"description" text,
	"logo" text,
	"currency" text DEFAULT 'INR' NOT NULL,
	"currency_symbol" text DEFAULT '₹' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "shop_profiles_shop_code_unique" UNIQUE("shop_code"),
	CONSTRAINT "shop_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	CONSTRAINT "stores_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"campaign_id" varchar,
	"coupon_id" varchar,
	"type" text NOT NULL,
	"amount" integer NOT NULL,
	"points" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"bill_image_url" text,
	"referral_code" text,
	"shop_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_coupons" ADD CONSTRAINT "customer_coupons_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_coupons" ADD CONSTRAINT "customer_coupons_shop_profile_id_shop_profiles_id_fk" FOREIGN KEY ("shop_profile_id") REFERENCES "public"."shop_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_coupons" ADD CONSTRAINT "shared_coupons_coupon_id_customer_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."customer_coupons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_coupons" ADD CONSTRAINT "shared_coupons_shared_by_customer_id_customers_id_fk" FOREIGN KEY ("shared_by_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_coupons" ADD CONSTRAINT "shared_coupons_claimed_by_customer_id_customers_id_fk" FOREIGN KEY ("claimed_by_customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_coupon_id_customer_coupons_id_fk" FOREIGN KEY ("coupon_id") REFERENCES "public"."customer_coupons"("id") ON DELETE no action ON UPDATE no action;