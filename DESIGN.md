# gongeo.us Design System

## Purpose

This document is the visual source of truth for gongeo.us. It describes the intended experience across marketing, catalog, tracker, statistics, and utility surfaces. When an implementation and this document disagree, treat the documented rule as the target unless a product requirement explicitly calls for an exception.

The design language is **Luminous Whimsy**: soft, magical, and polished, with enough structure and contrast to support dense game data. The interface should feel inspired by _Infinity Nikki_ without competing with its artwork.

## Design Principles

1. **Game art leads.** UI surfaces frame imagery rather than overpowering it.
2. **Soft does not mean faint.** Pastels create atmosphere; text, controls, focus states, and data remain clear.
3. **Whimsy is selective.** Gradients, glows, and motion emphasize navigation, primary actions, and celebratory moments—not every element.
4. **Dense tools stay orderly.** Catalog filters, trackers, and charts use consistent spacing, grouping, and hierarchy.
5. **Light and dark are equal modes.** Neither mode is a simple color inversion, and both must preserve hierarchy and readability.

## Foundations

### Typography

- **Primary family:** Outfit, with `ui-sans-serif`, `system-ui`, and `sans-serif` fallbacks.
- **Supported weights:** 400, 500, 600, and 700.
- **Body:** 400 for normal copy; 500 for compact labels or emphasized metadata.
- **Headings:** 600 by default; 700 for page titles and hero headings.
- **Labels and controls:** 500 or 600.
- Avoid weights above 700. Do not use `font-extrabold` or `font-black` in product UI.
- Use tabular numerals for changing statistics, counts, pull totals, and aligned numeric comparisons.

Recommended type scale:

| Role             | Size    | Line height | Weight  |
| ---------------- | ------- | ----------- | ------- |
| Hero title       | 36–40px | 1.15        | 700     |
| Page title       | 30–36px | 1.2         | 700     |
| Section title    | 20–24px | 1.3         | 600     |
| Card title       | 14–18px | 1.35        | 600     |
| Body             | 14–16px | 1.5         | 400     |
| Supporting text  | 12–14px | 1.45        | 400–500 |
| Compact metadata | 10–12px | 1.35        | 500–600 |

Do not place essential text below 10px. Use 12px or larger where space allows, and reserve 10px for space-constrained names, labels, and metadata.

### Color

#### Brand and interaction

| Token               | Value     | Use                                                 |
| ------------------- | --------- | --------------------------------------------------- |
| Action Rose         | `#F43F5E` | Primary actions, active navigation, selected states |
| Action Rose Hover   | `#FB7185` | Hover and supplementary brand accents               |
| Action Rose Pressed | `#E11D48` | Pressed states and strong emphasis                  |
| Soft Rose           | `#FFF0F3` | Gentle highlights and secondary tinted surfaces     |
| Info Indigo         | `#6366F1` | Informational states and secondary data accents     |
| Success Emerald     | `#10B981` | Success and positive status                         |
| Warning Amber       | `#F59E0B` | Warnings, caution, and five-star chart accents      |
| Error Red           | `#EF4444` | Errors and destructive status                       |

#### Light mode

| Token           | Value     | Use                                         |
| --------------- | --------- | ------------------------------------------- |
| App Background  | `#F8FAFC` | Page canvas                                 |
| Primary Surface | `#FFFFFF` | Floating controls and high-emphasis content |
| Tinted Surface  | `#F5F0FA` | Cards and grouped data regions              |
| Border          | `#DDD2E8` | Card and section boundaries                 |
| Primary Text    | `#0F172A` | Headings and body text                      |
| Secondary Text  | `#475569` | Supporting copy and metadata                |

#### Dark mode

| Token            | Value     | Use                                  |
| ---------------- | --------- | ------------------------------------ |
| App Background   | `#101014` | Page canvas                          |
| Primary Surface  | `#1E2035` | Cards and grouped data regions       |
| Elevated Surface | `#24263D` | Menus, popovers, and raised controls |
| Border           | `#3A3858` | Card and section boundaries          |
| Primary Text     | `#F8FAFC` | Headings and body text               |
| Secondary Text   | `#CBD5E1` | Supporting copy and metadata         |

Pastel fills and translucent surfaces must not be the only indicator of state. Pair color with text, an icon, a border, or another visible cue.

### Atmospheric Gradients

- The app shell uses a restrained violet → rose → peach gradient with translucency and backdrop blur.
- Page canvases may use a soft radial violet glow near the top, fading into the app background.
- Hero headings may use fuchsia → pink → rose when the surrounding hierarchy remains simple.
- Dark gradients should use deep indigo, plum, and burgundy at low saturation.
- Limit each screen to one dominant atmospheric gradient. Functional content areas should stay calm enough for data and imagery to read clearly.

### Data Visualization Palette

Charts may extend beyond the brand palette when categories must remain distinguishable:

- Amber `#F59E0B`
- Sky `#0EA5E9`
- Teal `#14B8A6`
- Indigo `#6366F1`
- Violet `#8B5CF6`

Never rely on color alone to distinguish a series. Use legends, labels, shapes, or patterns, and verify chart colors in both themes.

### Spacing and Layout

- Use a 4px base grid.
- Common spacing steps: 4, 8, 12, 16, 24, 32, 48, and 64px.
- The fixed desktop header is 56px high.
- Use a 1280px maximum width for broad catalog and dashboard surfaces.
- Use a 1024px maximum width for reading-focused pages and footer content.
- Page gutters are 16px on small screens and 20–24px on larger screens.
- Prefer visible section separation over tightly stacking unrelated controls.

### Radius

Use radius as a hierarchy, not a single universal value:

| Token    | Value | Use                                                |
| -------- | ----- | -------------------------------------------------- |
| Compact  | 6px   | Dense inputs, thumbnail frames, compact controls   |
| Small    | 8px   | Item and outfit cards, menu items, chart internals |
| Medium   | 12px  | Menus, popovers, and grouped controls              |
| Standard | 16px  | Cards, panels, modals, and major sections          |
| Feature  | 24px  | Search overlays and high-emphasis feature surfaces |
| Pill     | 999px | Tags, segmented options, rounded buttons           |

### Elevation

- **Resting surface:** border plus little or no shadow.
- **Soft card:** `0 4px 20px rgb(15 23 42 / 0.05)`.
- **Interactive lift:** `0 8px 20px rgb(244 63 94 / 0.20)` with a small upward translation.
- **Popover/overlay:** `0 12px 48px rgb(244 114 182 / 0.15)` in light mode; use a neutral near-black shadow in dark mode.
- Avoid stacking a strong border, saturated glow, and heavy shadow on the same element.

## Components

### App Shell and Navigation

- Use the 56px translucent gradient header with backdrop blur.
- The logo and product name anchor the left side; grouped navigation is centered on desktop; utilities sit on the right.
- Top-level navigation items use pill-shaped hover and active states.
- Dropdown menus use an opaque elevated surface, 12px radius, a subtle border, and clear row hover states.
- The mobile header keeps the product identity visible and moves navigation into a drawer.

### Buttons

- **Primary:** Action Rose fill, high-contrast text, pill shape, and a visible focus ring.
- **Secondary:** light or tinted surface, rose border or text, and lower elevation.
- **Quiet/icon:** transparent at rest with a clear hover surface and an accessible label.
- Use shimmer only for rare, high-value primary actions. Respect reduced-motion preferences.
- Do not make every control pill-shaped; dense filters and icon controls may use compact or medium radii.

### Cards and Panels

- Standard content panels use a tinted surface, 16px radius, a subtle border, and restrained elevation.
- Game-art cards may use 6–8px radii so the image remains visually dominant.
- Interactive cards may lift or scale slightly, but should not shift surrounding layout.
- Text placed over art requires a reliable fade or scrim. Essential labels must retain readable contrast across all images.
- Do not mix multiple radius styles within one repeated card set.

### Filters and Form Controls

- Group filters inside a clearly bounded panel rather than letting controls float on the page.
- Labels and current values must remain legible without relying on placeholder text.
- Disabled controls need a visible disabled treatment while preserving readable labels.
- Selected filters must use more than a pastel fill alone.
- Desktop filters may be dense; on small screens, preserve touch targets and move secondary filters into a drawer.

### Tags, Badges, and Status

- Tags are compact, rounded, and semantically colored.
- Keep text at 12px or larger where space allows; 10px is the absolute minimum.
- Ownership, rarity, and status must include text or iconography, not color alone.
- Use consistent tag order across repeated cards: category, rarity, ownership/status, then attributes.

### Charts and Statistics

- Group related metrics into a shared panel with consistent inner cards.
- Use tabular numerals and concise labels.
- Axis and legend text must remain readable at the intended viewport; abbreviate or provide detail views rather than shrinking below 11px.
- Provide a text alternative or accessible summary for chart-only insights.
- Fullscreen and filter controls need visible labels or accessible names.

### Imagery and Icons

- Use official or repository-provided artwork where available.
- Preserve artwork aspect ratios and use intentional crops.
- Use the existing icon library for UI actions; do not substitute emoji or text glyphs.
- Decorative images use empty alternative text. Informative images use concise, localized alternative text.

## Responsive Behavior

- Preserve the primary task before secondary controls as space decreases.
- Reflow multi-column panels without horizontal page scrolling.
- Keep interactive targets at least 44×44px on touch layouts unless an equivalent larger target surrounds the visible control.
- Catalog density may decrease at small breakpoints, but names, rarity, and ownership status must remain available.
- Test at 200% browser zoom and narrow mobile widths for reflow, clipping, and sticky-header overlap.

## Motion

- Default transitions: 150–300ms.
- Use soft easing for hover, menu, and card movement.
- Reserve longer reveal animations for celebratory or game-like moments.
- Honor `prefers-reduced-motion`; remove shimmer, large transforms, and nonessential reveal motion when enabled.

## Accessibility Requirements

- Target WCAG 2.2 AA contrast for text and essential UI indicators.
- Every interactive control needs a visible keyboard focus state.
- Maintain logical heading order and landmark structure.
- Icon-only controls require accessible names.
- Validation, loading, success, and error states must be conveyed programmatically and visually.
- Do not claim accessibility from visual review alone; verify keyboard behavior, focus order, semantics, zoom/reflow, and assistive-technology output.

## Content and Localization

- All user-facing product text uses i18n keys.
- Allow labels and controls to expand for translated text; avoid fixed widths where wrapping or flexible layout is practical.
- Use sentence case for actions and labels. Reserve uppercase for short eyebrow text.
- Prefer specific action copy such as “View global data” over vague labels such as “Continue.”

## Implementation Anchors

- Naive UI theme overrides define global semantic colors and the standard 16px component radius.
- Tailwind utilities provide localized layout, radius, elevation, and responsive behavior.
- Global design foundations belong in `app/assets/styles/global.css` and `app/app.vue`.
- App-shell behavior belongs in `app/layouts/default.vue`.
- Local exceptions are acceptable for game-art cards, charts, and dense catalog controls when they follow the scales in this document.

## Review Checklist

- Typography uses Outfit and only weights 400–700.
- Primary actions and active states use the Action Rose family consistently.
- Light and dark surfaces preserve clear hierarchy and readable borders.
- Radius follows the component hierarchy rather than defaulting everything to pills or 16px.
- Filters have readable labels, values, and disabled states.
- Text over game art retains contrast on every image.
- Chart labels and legends remain readable and have non-color cues.
- Focus, keyboard, reduced-motion, zoom, responsive reflow, and localized expansion have been tested.
