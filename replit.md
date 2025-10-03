# Fruitbox - Customer Referral & Rewards Platform

## Overview

Fruitbox is a dual-interface SaaS platform that helps offline stores reward customers for promoting their business, increasing customer retention and walk-ins. The system enables store owners to create and manage referral programs while providing customers with a mobile-friendly PWA to track rewards, share referral codes, and submit purchase receipts for approval.

The application consists of:
- **Store Dashboard**: A professional interface for retailers to create campaigns, approve transactions, and monitor performance
- **Customer PWA**: A consumer-focused progressive web app for earning points, sharing referrals, and tracking rewards
- **Landing Page**: Public-facing homepage with product information and navigation

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 3, 2025 - Currency Symbol Selection Feature**
- Added currencySymbol field to shopProfiles database schema (text, not null, default '$')
- Created currency selector in ShopSettings component with 10 currency options ($, ₹, €, £, ¥, ₩, ₦, R, A$, C$)
- Added currency selector to shop registration form in ShopAuthScreen
- Updated all currency displays throughout the application to use shop's selected symbol:
  - StoreDashboard: Stats and analytics use shopProfile.currencySymbol
  - MyShops: Affiliate details display shop's currency
  - ShopSearch: Campaign and minimum purchase amounts show shop's currency
  - ShopAuthScreen: "Points per" label dynamically shows selected currency
- Currency selection integrates seamlessly with existing shop profile update flow
- Default currency is $ for all new shops unless changed during registration or in settings

**October 3, 2025 - PWA Installation Prompt Added**
- Created PWAInstallPrompt component with custom install banner
- Banner displays "For better experience, install the application" with Install Now button
- Component listens for browser's `beforeinstallprompt` event
- Triggers native browser PWA installation dialog when user clicks Install button
- Added to both Landing page and Customer PWA page for maximum visibility
- Dismissible banner with smooth animations (slides in from bottom)
- Styled with gradient purple-to-blue background matching app theme
- Only shows when app meets PWA installability criteria
- Note: Won't show in Replit preview iframe, but works when accessed directly via deployment URL

**October 3, 2025 - GitHub Import Successfully Configured for Replit**
- Imported GitHub repository and configured for Replit environment
- Installed all npm dependencies successfully (492 packages)
- Provisioned PostgreSQL database and pushed schema using Drizzle
- Configured development workflow on port 5000 with webview output type
- Configured deployment with autoscale target for production (npm run build → npm run start)
- Application running successfully with database integration active
- All routes tested and functional: Landing page, Customer PWA login, Store Owner portal
- Demo accounts seeded: Customer (username: sarah, password: password123), Shop (username: coffeehaven, password: password123)
- Vite HMR (Hot Module Replacement) working correctly on port 5000
- Host configuration verified: Server binds to 0.0.0.0:5000, Vite allowedHosts set to true

**October 1, 2025 - Coupon Sharing Feature**
- Added comprehensive coupon sharing flow where Customer A can share coupons with Customer B
- Implemented sharedCoupons database table to track sharing relationships
- Created JoinSharedCoupon page for shared coupon URL handling with PWA install prompt
- Built CouponShareSheet component with QR code generation and social media sharing (WhatsApp, Facebook, X, Email, SMS)
- Updated CustomerPWA to display shared coupons in "My Shop Coupons" section
- Added Share buttons to all coupon cards for easy viral distribution
- Enhanced BillUpload component to show discount calculations (discount % and final amount)
- Complete flow: Customer A shares → Customer B accesses URL → Installs PWA → Creates account → Claims coupon → Makes discounted purchase

## System Architecture

### Frontend Architecture

**Technology Stack**
- React 18 with TypeScript for type safety
- Vite as the build tool and dev server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens

**Design System**
- Hybrid approach with distinct aesthetics for two user personas:
  - Store Dashboard: Material Design-inspired professional interface (Deep Blue primary, Slate Gray backgrounds)
  - Customer PWA: Consumer app aesthetic inspired by Starbucks/Cash App (Vibrant Purple primary, Coral accents)
- Typography uses Inter for body text and Space Grotesk for headings
- Dark mode by default with light mode support via ThemeProvider
- Responsive breakpoint at 768px for mobile/desktop experiences

**Component Architecture**
- Atomic design pattern with reusable UI primitives in `/client/src/components/ui`
- Feature-specific components in `/client/src/components` (CampaignCard, BillApprovalCard, PointsDashboard, etc.)
- Page-level components in `/client/src/pages` for route handling
- Custom hooks in `/client/src/hooks` for shared logic (use-mobile, use-toast)

**State Management Strategy**
- Server state managed via TanStack Query with query invalidation for cache updates
- Local UI state with React hooks (useState, useContext)
- Form state handled by React Hook Form with Zod validation
- Theme state persisted to localStorage via ThemeProvider context

### Backend Architecture

**Technology Stack**
- Express.js server with TypeScript
- Drizzle ORM configured for PostgreSQL (via Neon serverless driver)
- Session-based architecture prepared (connect-pg-simple for session store)
- Multer for file upload handling (bill images)

**API Design**
- RESTful API structure under `/api` prefix
- Resource-based endpoints:
  - `/api/campaigns` - Campaign CRUD operations
  - `/api/customers` - Customer management and referral code lookups
  - `/api/transactions` - Transaction submission and approval workflow
  - `/api/stats` - Analytics endpoints for dashboard metrics
  - `/api/shared-coupons` - Coupon sharing and claiming (NEW)
- Error handling middleware with status code propagation
- Request logging middleware for API calls

**Business Logic**
- Storage abstraction layer (IStorage interface) with in-memory implementation
- Seed data system for development environment (demo store and campaigns)
- Points calculation based on campaign rules (pointsPerDollar)
- Transaction status workflow (pending → approved/rejected)
- Referral code generation and validation

### Data Storage

**Database Schema** (Drizzle ORM with PostgreSQL)

Six main tables with UUID primary keys:

1. **stores**: Store accounts
   - Credentials (email, password)
   - Basic profile (name)

2. **shopProfiles**: Shop profile and settings
   - Belongs to store (storeId foreign key)
   - Shop information (shopName, shopCode, description, category, address, phone)
   - Reward configuration (pointsPerDollar, discountPercentage)
   - Currency preference (currencySymbol, default '$')
   - Visual customization (couponColor, couponTextColor)

3. **campaigns**: Referral program configurations
   - Belongs to store (storeId foreign key)
   - Reward rules (pointsPerDollar, minPurchaseAmount, discountPercentage)
   - Visual customization (couponColor, couponTextColor)
   - Active/inactive status flag

4. **customers**: End users enrolled in campaigns
   - Belongs to campaign (campaignId foreign key)
   - Contact info (name, phone)
   - Unique referral code
   - Points tracking (totalPoints, redeemedPoints)

5. **transactions**: Purchase and reward events
   - Links customer to campaign
   - Transaction types (purchase, referral, redemption)
   - Amount and calculated points
   - Status workflow (pending, approved, rejected)
   - Optional bill image URL

6. **sharedCoupons**: Coupon sharing relationships
   - Links sharer customer to share token
   - Tracks claimed status and claiming customer
   - Enables viral coupon distribution flow
   - Used for PWA installation and account creation via shared URLs

**Data Access Pattern**
- Abstracted through IStorage interface for future database swapping
- Current implementation uses in-memory Map structures (MemStorage class)
- Drizzle schema defined with type generation for compile-time safety
- Query helpers in `/client/src/lib/api.ts` wrap fetch calls

### External Dependencies

**Third-Party UI Libraries**
- Radix UI primitives for accessible components (dialogs, dropdowns, tooltips, etc.)
- QRCode.react for generating referral QR codes
- React Icons (Simple Icons) for social media share buttons
- date-fns for date formatting and manipulation
- Lucide React for consistent iconography

**Development Tools**
- Replit-specific plugins (vite-plugin-runtime-error-modal, cartographer, dev-banner)
- ESBuild for production server bundling
- PostCSS with Autoprefixer for CSS processing

**Planned Integrations** (based on dependencies)
- PostgreSQL via @neondatabase/serverless (configured but using in-memory storage currently)
- File storage for bill images (Multer configured with memory storage, 5MB limit)
- Session management via connect-pg-simple (configured but not active)

**Frontend State Libraries**
- @tanstack/react-query for async state with configurable cache behavior
- React Hook Form + Zod for validated form handling
- Class Variance Authority (CVA) for component variant styling