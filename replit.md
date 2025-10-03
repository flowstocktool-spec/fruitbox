# Referral Campaign Management SaaS

## Overview

This is a dual-interface SaaS platform for managing referral campaigns in retail stores. The system enables store owners to create and manage referral programs while providing customers with a mobile-friendly PWA to track rewards, share referral codes, and submit purchase receipts for approval.

The application consists of:
- **Store Dashboard**: A professional interface for retailers to create campaigns, approve transactions, and monitor performance
- **Customer PWA**: A consumer-focused progressive web app for earning points, sharing referrals, and tracking rewards
- **Landing Page**: Public-facing homepage with product information and navigation

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**October 3, 2025 - Replit Setup Complete**
- Successfully configured project for Replit environment
- Set up development workflow on port 5000 with webview output
- Configured deployment with autoscale target for production
- Fixed TypeScript compatibility issues in storage layer
- App running successfully with in-memory storage (MemStorage)
- PostgreSQL database provisioned and ready for future migration
- All dependencies installed and working correctly

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

Five main tables with UUID primary keys:

1. **stores**: Store accounts
   - Credentials (email, password)
   - Basic profile (name)

2. **campaigns**: Referral program configurations
   - Belongs to store (storeId foreign key)
   - Reward rules (pointsPerDollar, minPurchaseAmount, discountPercentage)
   - Visual customization (couponColor, couponTextColor)
   - Active/inactive status flag

3. **customers**: End users enrolled in campaigns
   - Belongs to campaign (campaignId foreign key)
   - Contact info (name, phone)
   - Unique referral code
   - Points tracking (totalPoints, redeemedPoints)

4. **transactions**: Purchase and reward events
   - Links customer to campaign
   - Transaction types (purchase, referral, redemption)
   - Amount and calculated points
   - Status workflow (pending, approved, rejected)
   - Optional bill image URL

5. **sharedCoupons**: Coupon sharing relationships (NEW)
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