---
name: Modern Global Kitchen
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#d1c5ad'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#9a907a'
  outline-variant: '#4e4634'
  surface-tint: '#f0c12c'
  primary: '#ffe3a1'
  on-primary: '#3d2e00'
  primary-container: '#f4c430'
  on-primary-container: '#695200'
  inverse-primary: '#755b00'
  secondary: '#c8c6c5'
  on-secondary: '#313030'
  secondary-container: '#474746'
  on-secondary-container: '#b7b5b4'
  tertiary: '#e8e5e5'
  on-tertiary: '#303030'
  tertiary-container: '#cbc9c9'
  on-tertiary-container: '#555454'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdf90'
  primary-fixed-dim: '#f0c12c'
  on-primary-fixed: '#241a00'
  on-primary-fixed-variant: '#584400'
  secondary-fixed: '#e5e2e1'
  secondary-fixed-dim: '#c8c6c5'
  on-secondary-fixed: '#1c1b1b'
  on-secondary-fixed-variant: '#474746'
  tertiary-fixed: '#e4e2e1'
  tertiary-fixed-dim: '#c8c6c5'
  on-tertiary-fixed: '#1b1c1c'
  on-tertiary-fixed-variant: '#474746'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Work Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Work Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1200px
  gutter: 24px
  margin-desktop: 64px
  margin-tablet: 32px
  margin-mobile: 20px
---

## Brand & Style

The design system embodies the atmosphere of a high-end, late-night culinary studio. It is built for a discerning audience that appreciates the intersection of traditional global flavors and modern technical precision. The visual language is "Nocturnal Minimalism"—an aesthetic that prioritizes focus through deep, immersive backgrounds and sharp, high-contrast highlights.

The style leverages a premium editorial feel, utilizing generous white space (or "dark space") to create a sense of luxury and calm. Subtle glassmorphism is used sparingly to indicate depth without breaking the focused, flat aesthetic. Every element is designed to feel intentional, professional, and evocative of a candlelit, sophisticated kitchen environment.

## Colors

The palette is anchored by a deep charcoal base, providing a "nocturnal" canvas that reduces eye strain and emphasizes content. Midnight navy is employed for container surfaces and secondary layering to add subtle temperature to the darkness.

The signature **Saffron Gold** serves as the sole high-energy accent, reserved strictly for primary actions, critical highlights, and brand moments. Text adheres to a strict hierarchy: a crisp off-white for maximum legibility in headlines and body copy, and a muted soft gray for metadata and de-emphasized functional labels.

## Typography

This design system uses a dual-font strategy to balance heritage with utility. **Playfair Display** provides the editorial soul of the system; it should be used for all major headlines to evoke a sense of timeless elegance and culinary tradition.

**Work Sans** handles the functional heavy lifting. Its neutral, grounded character ensures that recipes, measurements, and interface controls remain legible and professional. Uppercase tracking is applied to small labels to create a clean, "architectural" feel in the navigation and metadata.

## Layout & Spacing

The layout follows a disciplined 12-column fixed grid on desktop, shifting to a 4-column grid on mobile. The spacing rhythm is based on an 8px modular scale to maintain mathematical harmony across all components.

Large outer margins are critical to the "premium" feel, ensuring that content never feels crowded. Elements should be grouped with generous internal padding to allow the dark backgrounds to act as a frame for the high-contrast imagery and typography.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** rather than traditional drop shadows. Surfaces closer to the user are rendered in slightly lighter shades of navy or charcoal (#1A1A1A or #2A2A2A) to create a natural "stacking" effect.

For interactive overlays like modals or dropdowns, a subtle **Glassmorphism** effect is used: a 12px background blur with a 10% white border. This maintains the "nocturnal" mood while providing the necessary visual separation for temporary interface elements.

## Shapes

The shape language is "Soft" (Level 1), utilizing a 0.25rem (4px) base corner radius. This creates a modern, precise look that avoids the playfulness of larger curves while feeling more approachable than sharp 90-degree angles. This subtle rounding reflects the precision of a chef's knife and the clean lines of modern kitchen architecture.

## Components

### Buttons
Primary buttons use a solid **Saffron Gold** fill with black text for maximum prominence. Secondary buttons are "Ghost" style: a saffron gold border with saffron text. All buttons use the base 4px roundedness.

### Cards
Cards are built on the #1A1A1A background with a very thin (1px) border of #2A2A2A. They should feature high-quality photography as the hero element, with Playfair Display text overlays.

### Input Fields
Fields use a dark fill (#1A1A1A) with a 1px bottom-border only in soft gray (#A0A0A0). Upon focus, the bottom border transitions to Saffron Gold.

### Navigation & Lists
Navigation items use Work Sans in the `label-sm` style. Interactive list items should feature a subtle background shift to #2A2A2A on hover to provide tactile feedback in the dark environment.

### Special Components
*   **Recipe Tags:** Small, pill-shaped chips with a midnight navy background and Saffron Gold text.
*   **Ingredient Toggles:** Custom checkboxes that utilize the Saffron Gold for the "checked" state, providing a vivid pop of color against the charcoal background.