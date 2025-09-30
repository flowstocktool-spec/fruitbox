# Design Guidelines: Referral Campaign Management SaaS

## Design Approach

**Selected Approach:** Hybrid Design System
- **Store Dashboard:** Material Design-inspired for data-heavy enterprise interface
- **Customer PWA:** Consumer app aesthetic inspired by Starbucks Rewards, Cash App - friendly, visual, reward-focused
- **Rationale:** Two distinct user personas require different visual treatments - professional tools for retailers, engaging experience for end customers

## Core Design Elements

### A. Color Palette

**Store Dashboard (Professional)**
- Primary: 239 84% 47% (Deep Blue - trust, professionalism)
- Secondary: 220 13% 18% (Slate Gray - neutral backgrounds)
- Success: 142 76% 36% (Green - approvals, positive metrics)
- Warning: 38 92% 50% (Amber - pending reviews)
- Danger: 0 84% 60% (Red - rejections)
- Background Dark: 222 47% 11%
- Surface Dark: 217 33% 17%

**Customer PWA (Engaging)**
- Primary: 280 87% 65% (Vibrant Purple - rewards, excitement)
- Accent: 340 82% 52% (Coral - points, achievements)
- Success: 158 64% 52% (Mint Green - earned rewards)
- Background Dark: 280 40% 12%
- Card Surfaces: 280 30% 18%

### B. Typography

**Font Families:**
- Primary: 'Inter' (Google Fonts) - body text, UI elements
- Accent: 'Space Grotesk' (Google Fonts) - headings, emphasis

**Scale (Desktop):**
- H1: 2.5rem / 700 weight
- H2: 2rem / 600 weight  
- H3: 1.5rem / 600 weight
- Body: 1rem / 400 weight
- Small: 0.875rem / 400 weight

**Scale (Mobile):**
- H1: 2rem / 700 weight
- H2: 1.75rem / 600 weight
- H3: 1.25rem / 600 weight

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, 8, 12, 16
- Micro spacing: p-2, gap-2 (8px)
- Component spacing: p-4, gap-4 (16px)
- Section spacing: py-8, px-6 (32px/24px)
- Large sections: py-12, py-16 (48px/64px)

**Grid Systems:**
- Store Dashboard: 12-column grid (max-w-7xl containers)
- Customer PWA: Single column mobile-first (max-w-md)

### D. Component Library

**Store Dashboard Components:**

*Navigation:*
- Top bar: Logo, campaign selector dropdown, notifications bell, profile avatar
- Sidebar: Collapsible navigation with icons + labels (Dashboard, Campaigns, Analytics, Approvals, Settings)

*Campaign Builder:*
- Multi-step wizard with progress indicator
- Rule builder with drag-drop point value inputs
- Visual coupon editor with live preview panel
- Color picker, logo upload, text customization tools

*Approval Queue:*
- Card-based list view with bill image thumbnails
- Three-action buttons per item: Approve (green), Reject (red), View Details (blue)
- Bulk selection with floating action bar

*Analytics Dashboard:*
- Stat cards with large numbers, trend indicators (arrows)
- Line charts for performance over time
- Bar charts comparing campaigns
- Conversion funnel visualization

**Customer PWA Components:**

*Points Dashboard:*
- Hero card showing total points with animated number counter
- Circular progress indicator for next reward threshold
- Transaction timeline with icons (earned/redeemed)

*Coupon Display:*
- Full-width card with custom branding
- QR code centered prominently
- Referral code in large, copy-able text
- Share button with native share API

*Share Interface:*
- Bottom sheet modal with share options
- Pre-filled message template
- Social media quick-share buttons

### E. Key Interactions

**Store Dashboard:**
- Hover states: Subtle elevation increase (shadow-md to shadow-lg)
- Loading states: Skeleton screens for data tables
- Success feedback: Toast notifications (top-right)

**Customer PWA:**
- Pull-to-refresh on dashboard
- Haptic feedback on point transactions
- Confetti animation on reward unlock
- Smooth sheet transitions for modals

## Images

**Store Dashboard:**
- Empty states: Illustrations for "No campaigns yet" (creation prompt), "No pending approvals"
- Campaign cards: Small brand logo/image thumbnails

**Customer PWA:**
- Hero section: Abstract reward-themed gradient or geometric pattern (not a photo - keep it light and modern)
- Achievement badges: Icon-based, no photos needed
- Brand logos: Retail store logos in coupon displays

**No large hero images required** - this is a utility-focused application where screen space is precious for functionality.

## Accessibility & Polish

- WCAG AA contrast ratios throughout
- Focus indicators on all interactive elements
- Keyboard navigation for dashboard
- Screen reader labels for icons
- Responsive breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Dark mode default with high contrast text
- Loading skeletons match component shapes
- Error states with actionable messages