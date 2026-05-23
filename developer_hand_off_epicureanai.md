# Developer Hand-off Document: Epicurean AI (v1.2.0)

## 1. Project Overview
**Project Name:** Epicurean AI
**Brand Essence:** Premium, multicultural, AI-driven culinary companion.
**Visual Style:** "Modern Global Kitchen" – high-fidelity glassmorphism, sophisticated typography, and warm, inviting tones.

## 2. Design System: Modern Global Kitchen

### Theme Tokens (Light Mode)
- **Primary Color:** Saffron Gold (`#f4c430`) - Used for CTAs, active states, and brand accents.
- **Surface Color:** Cream (`#fff8f1`) - Main background.
- **On-Surface Color:** Onyx (`#131313`) - Primary text and headings.
- **Secondary Colors:**
    - Onyx (`#1b1b1b`) - Card backgrounds, secondary buttons.
    - Surface-Dim (`#e2d9ca`) - Dividers, subtle borders.
- **Roundness:** `ROUND_EIGHT` (8px base radius).
- **Glassmorphism:** `backdrop-blur-xl` with semi-transparent surface overlays (typically `bg-surface/80`).

### Theme Tokens (Dark Mode)
- **Color Mode:** DARK
- **Surface Color:** Onyx (`#131313`)
- **Primary Color:** Saffron Gold (`#f4c430`)
- **Typography:** Playfair Display (Headlines), Serif-based body text.

### Typography (Tailwind Scale)
- **Display:** `font-display-lg` (Playfair Display, Bold)
- **Headlines:** `font-headline-md`, `font-headline-sm`
- **Body:** `font-body-md` (Serif-based)
- **Labels:** `font-label-sm` (Sans-serif, Uppercase for utility)

## 3. Shared Components

### TopAppBar (Small Center-Aligned)
- **Structure:** Leading (Menu/Back/Avatar) | Title (Epicurean AI) | Trailing (Account/Settings).
- **Style:** `bg-surface/90 backdrop-blur-xl`, `h-16`, `z-50`.

### BottomNavBar (Label + Icon)
- **Destinations:** Explore, AI Coach, Recipes, Saved, Support.
- **Style:** `bg-surface/90 backdrop-blur-2xl`, fixed bottom, `h-20`.
- **Active State:** `bg-primary-container/20`, `text-primary`, rounded-xl.

### NavigationDrawer (Standard)
- **Header:** User Profile (Avatar + Title + Subtext).
- **Items:** Pantry, Dietary Prefs, History, Subscription, Settings.

## 4. Asset Library
- **Primary Logo:** `{{DATA:IMAGE:IMAGE_9}}` (3D Glassmorphism Chef's Hat).
- **UI Icons:** Material Symbols (Outlined/Rounded).
- **Currency Support:** 135+ global currencies, localized to Indian Rupees (₹) by default.

## 5. Screen Inventory & Flow Map

### Onboarding Flow
1. **Welcome:** `{{DATA:SCREEN:SCREEN_26}}`
2. **Culinary Preferences:** `{{DATA:SCREEN:SCREEN_48}}`
3. **Coach Setup:** `{{DATA:SCREEN:SCREEN_18}}`
4. **Setup Complete:** `{{DATA:SCREEN:SCREEN_41}}`

### Core Experience
- **Discovery Home:** `{{DATA:SCREEN:SCREEN_24}}`
- **AI Recipe Generator:** `{{DATA:SCREEN:SCREEN_17}}`
- **Detailed Recipe View:** `{{DATA:SCREEN:SCREEN_3}}`
- **AI Voice Coach (Hands-Free):** `{{DATA:SCREEN:SCREEN_22}}`
- **Flavor Profile & Digital Pantry:** `{{DATA:SCREEN:SCREEN_60}}`

### Management & Support
- **Weekly Meal Planner (Family Sharing):** `{{DATA:SCREEN:SCREEN_39}}`
- **Pricing & Subscription:** `{{DATA:SCREEN:SCREEN_63}}`
- **Payment Success:** `{{DATA:SCREEN:SCREEN_73}}`
- **Help Center (FAQ):** `{{DATA:SCREEN:SCREEN_65}}`
- **Subscription Help:** `{{DATA:SCREEN:SCREEN_71}}`

## 6. Implementation Notes
- **Framework Recommendation:** React Native or Flutter with WebView support to leverage existing Tailwind-based HTML/CSS.
- **Responsive Layout:** All screens are designed for `MOBILE` device type with safe-area insets considered for the BottomNavBar.
- **Animations:** Recommend soft fades for transitions and `scale-95` on active button states.

---
*Prepared by Stitch AI Design Assistant for epicureanAI Project.*