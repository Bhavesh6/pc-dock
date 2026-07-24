# Product

## Register

product

## Users

A single user (the owner) repurposing an old Android phone (Xiaomi Mi A1, custom ROM, no Google Play Store) as a permanently-docked secondary display next to their desktop PC. The phone sits in a stand, plugged in, screen always on. They glance at it while working at the PC — never touch a keyboard/mouse to use it, only tap the touchscreen directly.

## Product Purpose

A local dashboard, served from a Node server on the PC, that turns the docked phone into:
- a live system-monitor readout (CPU/GPU temp & load, RAM usage)
- a media remote (play/pause/next/prev/volume/mute over real OS media keys)
- a Stream-Deck-style grid of custom action buttons (launch apps, system actions like lock/sleep, custom hotkeys/scripts) across swipeable pages

It's wrapped in a minimal native Android WebView shell (no browser chrome, screen-always-on) so it behaves like dedicated hardware rather than a website. Success = at-a-glance readability from a normal desk-to-dock distance, and zero-fumble one-tap control.

## Brand Personality

Technical, no-nonsense, mission-control. Feels like monitoring/broadcast equipment — precise, data-dense, deliberate — not a consumer lifestyle app. Confidence through restraint: no decoration that isn't carrying information.

## Anti-references

Not a consumer smart-home app (no big friendly rounded cards, no pastel gradients, no cutesy iconography). Not a marketing/SaaS dashboard template (no hero metrics, no gradient text, no card-grid-of-identical-tiles filler). Not skeuomorphic.

## Design Principles

- Every pixel earns its place by carrying live information or enabling one-tap control — nothing decorative.
- Legible at a glance from normal desk distance, not just up close.
- Severity is communicated through color (calm accent → amber → red) consistently across every metric.
- Touch targets sized and spaced for direct-finger tapping on a small phone screen, not mouse-precision.
- Swiping between pages (dashboard / Stream Deck grids) should feel immediate — no loading stutter, since this is glanced at constantly.

## Accessibility & Inclusion

Single-user personal tool, no specific accessibility requirements beyond standard contrast/readability best practice.
