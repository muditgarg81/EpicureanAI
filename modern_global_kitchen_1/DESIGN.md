---
name: Modern Global Kitchen
colors:
  surface: '#fff8f1'
  surface-dim: '#e2d9ca'
  surface-bright: '#fff8f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fcf2e3'
  surface-container: '#f6eddd'
  surface-container-high: '#f1e7d7'
  surface-container-highest: '#ebe1d2'
  on-surface: '#1f1b12'
  on-surface-variant: '#4e4634'
  inverse-surface: '#353025'
  inverse-on-surface: '#f9f0e0'
  outline: '#807661'
  outline-variant: '#d1c5ad'
  surface-tint: '#755b00'
  primary: '#755b00'
  on-primary: '#ffffff'
  primary-container: '#f4c430'
  on-primary-container: '#695200'
  inverse-primary: '#f0c12c'
  secondary: '#006d36'
  on-secondary: '#ffffff'
  secondary-container: '#83fba5'
  on-secondary-container: '#00743a'
  tertiary: '#bf0023'
  on-tertiary: '#ffffff'
  tertiary-container: '#ffb8b4'
  on-tertiary-container: '#ad001e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdf90'
  primary-fixed-dim: '#f0c12c'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#584400'
  secondary-fixed: '#83fba5'
  secondary-fixed-dim: '#66dd8b'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005227'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#930018'
  background: '#fff8f1'
  on-background: '#1f1b12'
  surface-variant: '#ebe1d2'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.03em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-margin: 24px
  gutter: 16px
---

## Brand & Style
This design system embodies a "Modern Global" aesthetic, designed to celebrate the vibrant diversity of world cuisines through a lens of premium minimalism. The brand personality is epicurean, inclusive, and sophisticated, aiming to evoke the sensory richness of a spice market within a clean, high-end digital environment. 

The style utilizes **Minimalism** as its foundation to let high-quality food photography serve as the primary visual hero. This is layered with **Glassmorphism** specifically for AI-driven features (like recipe adjustments or ingredient scanning) to create a clear cognitive distinction between static content and "intelligent" interactions. The emotional response should be one of culinary inspiration and effortless exploration.

## Colors
The palette is rooted in a warm, inviting cream (#FFFDF5) that prevents the interface from feeling clinical. Accent colors are inspired by fundamental global spices: 
- **Saffron (Primary):** Used for primary actions, highlights, and active states to evoke warmth and premium quality.
- **Emerald (Secondary):** Used for "fresh" attributes, vegetarian indicators, and success states, referencing herbs and greenery.
- **Chili Red (Tertiary):** Reserved for "heat" levels, seasonal promotions, and critical alerts.

Neutral tones should lean warm (brown-greys) rather than cool blues to maintain the organic, food-centric atmosphere.

## Typography
This design system utilizes a high-contrast typographic pairing to balance tradition and modernity. 
- **Playfair Display** provides an editorial, sophisticated feel for headers and dish titles, reminiscent of luxury cookbooks.
- **Plus Jakarta Sans** ensures high legibility for ingredient lists, instructions, and UI controls. 

Large display type should be used sparingly to maintain the minimalist feel. Line heights are intentionally generous (1.6 for body) to ensure a comfortable reading experience while cooking.

## Layout & Spacing
The layout follows a **fluid grid** model with an emphasis on "generous whitespace."
- **Mobile:** 4-column grid with 24px side margins.
- **Desktop:** 12-column grid with a max-width of 1280px and 80px vertical section spacing.

Vertical rhythm should be strictly maintained using the 8px base unit. Negative space is used as a functional tool to separate culinary regions and categories without the need for heavy dividers. Large-scale photography should frequently "bleed" to the edges of the container to create an immersive experience.

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Subtle Glassmorphism**.
- **Surface Level:** The cream background (#FFFDF5) is the base.
- **Elevated Cards:** Use a very slight, warm-tinted ambient shadow (Hex #1A1915 at 4% opacity, 12px blur) to lift food cards off the background.
- **AI/Interactive Elements:** Use backdrop-blur (12px to 20px) with a semi-transparent white fill (80% opacity) to create a "glass" effect. This is reserved for dynamic overlays, such as smart ingredient substitutions or floating recipe timers.
- **No Heavy Borders:** Elements are separated by soft shadows or color shifts rather than hard lines to keep the interface feeling light and airy.

## Shapes
The shape language is **Rounded**, reflecting the organic nature of food and ingredients.
- **Standard Elements:** (Buttons, Input fields) use a 0.5rem (8px) radius.
- **Featured Cards:** (Recipes, Cuisine tiles) use `rounded-lg` (16px) to create a soft, premium frame for photography.
- **Search & Filters:** Use `rounded-xl` (24px) or full pills to distinguish interactive utility elements from content containers.

## Components
- **Buttons:** Primary buttons use the Saffron background with charcoal text. Secondary buttons are outlined with a 1px Saffron stroke. All buttons have a high-tap target (min 48px height).
- **Cards:** Food cards are the heart of the system. They should feature full-bleed imagery with a bottom-scrim overlay for legibility of the title (Playfair Display) and prep time (Plus Jakarta Sans).
- **Chips:** Used for dietary tags (e.g., Vegan, Gluten-Free). These use low-saturation versions of the Emerald or Chili Red palette to avoid visual clutter.
- **Input Fields:** Minimalist design with only a bottom border that transitions to Saffron on focus. Labels use `label-sm` in a muted tone.
- **Glass Overlays:** For AI-assisted cooking steps, panels should appear as translucent glass sheets that softly blur the recipe imagery behind them.
- **Lists:** Ingredient lists use wide spacing (16px between items) with custom Emerald checkmarks for completed items.