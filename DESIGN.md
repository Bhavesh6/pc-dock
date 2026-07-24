# Design

## Theme

Dark only, permanently — this runs on a phone screen sitting in a dock, glanced at constantly. No light mode.

## Color (OKLCH-equivalent roles; current values are hex, kept as-is since they're already tuned)

| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a0c0f` | App background |
| `--panel` | `#14171c` | Card surface |
| `--panel-2` | `#1a1e24` | Card surface, elevated (gradient top) |
| `--line` | `#232830` | Borders, dividers |
| `--text` | `#eef0f2` | Primary text |
| `--muted` | `#767d87` | Labels, secondary text |
| `--accent` | `#45e0c4` | Calm/live/OK state (teal) |
| `--accent-dim` | `#1f4941` | Pressed/active state background |
| `--warn` | `#f2b84b` | Elevated severity (amber) |
| `--hot` | `#f2555f` | Critical severity (red) |
| `--track` | `#20242b` | Gauge ring background track |

Severity ramp is the core color system: accent (calm) → warn (≥70%) → hot (≥90%), applied consistently to every metric (temp, load, RAM). Never introduce a second accent hue — one accent color, used for both "live/OK" status and gauge fill, keeps the palette legible from a distance.

## Typography

System font stack only: `"SF Pro Text", -apple-system, "Segoe UI", Roboto, sans-serif`. No webfonts — this is a local network appliance, it shouldn't have external font requests. Numeric values use `font-variant-numeric: tabular-nums` so digits don't jitter as they update live.

## Layout & Components

- **Ring card**: SVG radial gauge (stroke-dasharray progress ring) + big centered number + small label, in a bordered card with a subtle top-to-bottom gradient (`--panel-2` → `--panel`). Three per row for CPU/GPU/RAM.
- **Media control bar**: pill-shaped card, circular buttons, custom inline SVG icons (never emoji — emoji render inconsistently across Android skins/fonts). Play/pause is the largest, filled with the accent color as the primary action.
- **Status header**: small live-dot (pulses teal when polling succeeds, solid red on failure) + wordmark + clock. This is the at-a-glance "is this thing working" signal.
- Border radius: 20-24px on cards, fully round on buttons/dots.
- Cards use full borders (`1px solid var(--line)`), never side-stripe accents.

## Motion

- Gauge ring fill transitions (`stroke-dashoffset`, `stroke` color) over 0.6s ease — smooths out the 2s polling cadence so values don't feel like they're snapping.
- Live-dot pulse: 2s ease-in-out opacity loop, signals "actively polling" without being distracting.
- Button press: scale-down + background shift on `:active`, immediate (no delay) since this is direct-touch, not hover-driven.
- No motion gated behind reduced-motion media query yet — single personal device, known context, not required per PRODUCT.md accessibility scope.

## Multi-page pattern (Stream Deck grids)

New pages (Stream Deck button grids) should visually match this system exactly: same card surface, same border radius, same severity/accent colors repurposed for button states (idle = panel surface, pressed = accent-dim, destructive actions like Lock/Sleep = hot-tinted border, never hot fill — a full red button reads as an error state, not an action). Page transitions via horizontal swipe/scroll-snap, not fade — physical, direct manipulation, matching the "equipment" personality.
