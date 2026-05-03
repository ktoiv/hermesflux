---
name: Hermes Finance Design System
colors:
  surface: '#f9faf6'
  surface-dim: '#d9dad7'
  surface-bright: '#f9faf6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f0'
  surface-container: '#edeeeb'
  surface-container-high: '#e8e8e5'
  surface-container-highest: '#e2e3df'
  on-surface: '#1a1c1a'
  on-surface-variant: '#414943'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f0f1ed'
  outline: '#717973'
  outline-variant: '#c1c8c1'
  surface-tint: '#3d6751'
  primary: '#3d6751'
  on-primary: '#ffffff'
  primary-container: '#a8d5ba'
  on-primary-container: '#345d48'
  inverse-primary: '#a4d1b6'
  secondary: '#48626f'
  on-secondary: '#ffffff'
  secondary-container: '#c8e4f3'
  on-secondary-container: '#4c6673'
  tertiary: '#835053'
  on-tertiary: '#ffffff'
  tertiary-container: '#fcbabd'
  on-tertiary-container: '#79474b'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bfedd1'
  primary-fixed-dim: '#a4d1b6'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#254f3a'
  secondary-fixed: '#cbe7f6'
  secondary-fixed-dim: '#afcbda'
  on-secondary-fixed: '#011f2a'
  on-secondary-fixed-variant: '#304a57'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#f7b6b9'
  on-tertiary-fixed: '#340f13'
  on-tertiary-fixed-variant: '#68393d'
  background: '#f9faf6'
  on-background: '#1a1c1a'
  surface-variant: '#e2e3df'
typography:
  display:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  h1:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  h2:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: '0'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: '0'
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: '0'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: '0'
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  gutter: 24px
  margin: 32px
---

## Brand & Style

This design system is anchored in the philosophy of **Functional Minimalism**. It prioritizes clarity and emotional tranquility to demystify the often-stressful nature of personal finance. Drawing heavily from Dieter Rams’ "Ten Principles for Good Design," the interface remains unobtrusive and honest, acting as a quiet vessel for the user's data rather than a distraction.

The aesthetic is **Calm and Airy**, utilizing generous whitespace and a "Paper & Ink" tactile quality. By combining a warm, off-white foundation with soft, botanical and atmospheric accents, the system evokes a sense of reliability and modern humanist values. It avoids the aggressive visual cues typical of fintech, opting instead for a supportive, grounded presence.

## Colors

The palette is derived from natural, desaturated tones to maintain a low cognitive load. 

- **Foundation:** The background uses a warm parchment tone (#F8F6F0) to reduce eye strain and distinguish the canvas from pure white components.
- **Primary (Sage):** Used for primary actions and "growth" indicators. It represents stability and balance.
- **Secondary (Blue):** Applied to informational elements and "steady-state" data visualization.
- **Accent (Pink):** Reserved for delicate highlights, notifications, or secondary call-outs to provide warmth without urgency.
- **Neutrals:** Typography utilizes a soft charcoal rather than pure black to maintain the "airy" contrast ratio.

## Typography

This design system employs **Plus Jakarta Sans** for its humanist characteristics and modern, rounded terminals that align with the 4px grid. 

Typography is used as a functional hierarchy tool. Headlines are set with slightly tighter tracking to feel cohesive, while body text is given ample line height to ensure readability and "breathability." All type scales are multiples of 4px to maintain a strict mathematical rhythm across the interface. Use "Medium" (500) and "Semi-Bold" (600) weights sparingly to emphasize information without cluttering the visual field.

## Layout & Spacing

The layout follows a **Fixed-Fluid Hybrid Grid**. Content is housed within a 12-column system with a maximum width of 1280px for desktop, while margins and gutters remain fixed at 32px and 24px respectively to ensure consistent "air" around the content.

The vertical rhythm is dictated by a strict **4px baseline grid**. All components, padding, and margins must be increments of 4px (8, 12, 16, 24, 32, etc.). Use larger spacing increments (48px+) between distinct sections to reinforce the minimalist, "as little design as possible" aesthetic.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and tonal layering rather than heavy borders.

- **Level 0 (Canvas):** The #F8F6F0 background serves as the lowest layer.
- **Level 1 (Cards):** Primary content containers use #FFFFFF. They feature a "Soft Breath" shadow: `0px 4px 20px rgba(0, 0, 0, 0.04)`.
- **Level 2 (Interactive/Floating):** Modals or active dropdowns use a slightly more pronounced shadow: `0px 10px 32px rgba(0, 0, 0, 0.06)`.

Avoid inner shadows or complex gradients. The depth should feel like paper sheets resting lightly on a flat surface.

## Shapes

The design system uses a **Rounded** shape language to evoke friendliness and accessibility. 

Standard components (Buttons, Inputs) utilize a 0.5rem (8px) corner radius. Larger containers (Cards) use a 1rem (16px) radius to create a softer, more protective appearance for financial data. Pill-shapes are reserved exclusively for status indicators (Tags/Chips) to differentiate them from interactive buttons.

## Components

- **Buttons:** Primary buttons use the Sage (#A8D5BA) background with dark text. Secondary buttons are transparent with a 1px border in a muted neutral. All buttons feature 8px rounded corners and avoid heavy drop shadows to remain "unobtrusive."
- **Cards:** The workhorse of this design system. Cards are pure white (#FFFFFF) with a 16px corner radius and a soft ambient shadow. They should include generous internal padding (min 24px).
- **Inputs:** Fields use a subtle #F0EFE9 fill and no border in their default state. On focus, they transition to a white background with a 1px Sage border.
- **Icons:** Use feather-style outlines with a 1.5px or 2px stroke weight. Icons should always be monochromatic, utilizing the text colors to remain secondary to the data.
- **Lists:** Data lists should be "borderless," using subtle spacing and Level 0 backgrounds to separate rows rather than hard lines.
- **Progress Indicators:** Use the Secondary Blue (#B8D4E3) for progress bars with a rounded cap, maintaining a thin, 4px or 8px height for a delicate look.