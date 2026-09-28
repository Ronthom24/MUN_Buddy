# MUN Buddy Design System (Version 1)

This is the design brief for MUN Buddy's visual identity — the source of truth for visual/brand
decisions. See the root `README.md` for build status and stack. Update the "Implementation status"
section below as more of the spec lands.

## Implementation status (as of 2026-07-17)

Done:
- Real logo integrated (`frontend-next/public/logo-badge.png`, cropped/cutout from
  `MUN Buddy Logo.png` in the repo root — transparent outside the ring). `components/logo.tsx`
  wraps it as `LogoBadge`/`LogoMark`/`LogoWordmark`. Favicon at `frontend-next/app/icon.png`.
- Full color palette below applied as CSS variables in `frontend-next/app/globals.css` (light +
  dark; the spec only defines light — dark is a reasonable navy-anchored extrapolation, not
  spec'd).
- Typography: Playfair Display (headings) + DM Sans (body) wired via `next/font/google` in
  `frontend-next/app/layout.tsx`.
- Button variants: `default` (primary navy), `secondary` (white/navy-border per spec), `accent`
  (gold CTA, new), `outline`, `destructive`, `ghost`, `link` — see `components/ui/button.tsx`.
- Card radius 12px, input radius 8px, 1440px max content width (dashboard + public pages).
- Organizer conference workspace converted from top-tabs to a collapsible navy sidebar
  (280px ↔ 80px, gold active-indicator) — `app/conferences/[id]/layout.tsx`. Delegate workspace
  sidebar (already navy from a prior pass) widened to match at 280px.
- Chart colors (`--chart-1..5`) reuse the same primary/accent/success/warning/danger hues per §16.

Not done yet:
- Icon library migration to Bootstrap Icons (§12) — currently `lucide-react` throughout (~40
  files). Deliberately deferred: no functional gain, high mechanical-churn risk. Revisit only if
  explicitly requested.
- Chart library migration to Chart.js (§16) — currently `recharts`. Same reasoning as icons.
- Top navigation bar's search/quick-actions (§13 "Top Navigation... Contains: Search,
  Notifications, Profile, Quick Actions") — only Notifications exists today.
- Full accessibility pass (§19) — not audited yet (keyboard nav, focus indicators, alt text,
  screen-reader compat).
- ~~Public website redesign to this system specifically~~ — done in a later pass the same day.
  `components/public-nav.tsx` rebuilt with a full nav (Home/Conferences/Organizations/Resources/
  Pricing/About), a mobile sheet menu (previously none existed), and a 5-column footer (Company/
  Platform/Legal/Support/Utilities) with Certificate Verification and Platform Status links. New
  pages: `/pricing`, `/about` (mission/vision/story/roadmap/contact), `/resources` (searchable
  guide list + FAQ), `/status` (live API health check), `/legal/privacy`, `/legal/terms`. Homepage
  (`app/page.tsx`) rebuilt with a two-column hero (diplomatic ring illustration), a live platform
  stats bar backed by a new `GET /public/stats` endpoint (`backend/src/controllers/publicController.js`),
  a 6-step "journey" section, and testimonials. `/discover` gained a filter panel (country/city text
  match, month, registration status) backed by new `conferenceModel.listPublic` params. Conference
  and organization detail pages (`/discover/[slug]`, `/organizations/[slug]`) got navy hero sections
  matching the homepage/directory treatment. Not done: pricing figures are illustrative placeholders
  (no real billing), resources/blog content is static copy (no CMS), testimonials are illustrative
  (not sourced from real users) — flag before treating any of these as real content.
- Platform Administration Workspace (Super Admin) now exists (`app/platform/`) but hasn't had a
  dedicated visual pass against this design system yet.

## 1. Overview

The MUN Buddy Design System establishes the visual identity and user interface standards for the
platform. The objective is to create a premium, modern, and diplomatic experience that reflects the
professionalism of Model United Nations while maintaining excellent usability across desktop and
mobile devices.

The design language shall remain consistent throughout all modules, including: Public Website,
Organization Workspace, Organizer Workspace, Delegate Workspace, Platform Administration (Super
Admin).

The platform shall prioritize clarity, consistency, accessibility, and responsiveness.

## 2. Design Philosophy

The user interface shall embody: Professional, Diplomatic, Minimalistic, Modern, Consistent,
Accessible, Responsive, Information-focused.

The interface should resemble an executive command center rather than a conventional student
portal.

## 3. Brand Identity

The visual identity shall be derived directly from the official MUN Buddy logo. Primary
characteristics: Deep Diplomatic Blue, Prestige Gold, Warm Ivory, Clean Typography, Minimalistic
Layout, Large White Space.

The interface shall communicate authority without appearing overly corporate or governmental.

## 4. Color Palette

**Primary — Diplomatic Navy `#183A67`**
Usage: Sidebar, Navbar, Primary Buttons, Icons, Headers, Active Navigation, Dashboard Titles.

**Secondary — Diplomatic Gold `#C9A24A`**
Usage: Call-to-Action Buttons, Highlights, Active States, Progress Indicators, Badges, Charts,
Icons. Gold shall be used sparingly to emphasize important elements.

**Background — Warm Ivory `#F8F6F1`**
Usage: Application Background, Dashboard Background, Forms, Public Website. Pure white shall be
avoided for full-page backgrounds.

**Surface — White `#FFFFFF`**
Usage: Cards, Tables, Modals, Dropdowns, Popups.

**Primary Text `#2B2B2B`** · **Secondary Text `#6B7280`** · **Borders `#E5E7EB`**

## 5. Status Colors

| Role | Hex | Examples |
|---|---|---|
| Success | `#2E7D32` | Approved, Active, Completed, Success Messages |
| Warning | `#F59E0B` | Pending, Waitlist, Draft |
| Danger | `#DC2626` | Delete, Rejected, Error |
| Information | `#2563EB` | Notifications, Updates, Information Messages |

## 6. Typography

**Primary Heading Font — Playfair Display**: Dashboard Titles, Conference Names, Landing Page Hero,
Major Section Headings.

**Body Font — DM Sans**: Navigation, Forms, Buttons, Tables, Paragraphs, Cards, Dashboard Content.

## 7. Typography Scale

| Element | Font | Weight | Size |
|---|---|---|---|
| Hero Title | Playfair Display | 700 | 48px |
| Page Title | Playfair Display | 700 | 36px |
| Section Title | Playfair Display | 600 | 28px |
| Card Title | DM Sans | 600 | 20px |
| Body Text | DM Sans | 400 | 16px |
| Small Text | DM Sans | 400 | 14px |
| Caption | DM Sans | 400 | 12px |

## 8. Layout

Maximum Content Width **1440px** · Page Padding **32px** · Card Padding **24px** · Section Gap
**32px** · Grid Gap **24px**. Generous spacing to improve readability.

## 9. Cards

Background White · Border Radius **12px** · Border **1px solid `#E5E7EB`** · Soft shadow · Padding
**24px**. Cards shall never use heavy shadows.

## 10. Buttons

- **Primary**: bg `#183A67`, text white, hover `#102A4C`
- **Secondary**: bg white, border `#183A67`, text `#183A67`
- **Accent**: bg `#C9A24A`, text white, hover `#B58F37`
- **Danger**: bg `#DC2626`

## 11. Forms

Rounded corners **8px**, soft border, large click area, clear labels, validation messages,
placeholder text. Focused inputs display the primary brand color.

## 12. Icons

Recommended library: **Bootstrap Icons**. Usage: Navigation, Buttons, Status, Analytics, Dashboard
Cards. Icons shall remain simple and consistent.

## 13. Navigation

**Sidebar**: bg Diplomatic Navy, text white, active item gold indicator, collapsed width **80px**,
expanded width **280px**.

**Top Navigation**: height **72px**, contains Search, Notifications, Profile, Quick Actions.

## 14. Dashboard Components

Standard widgets: Statistic Cards, Data Tables, Charts, Recent Activity, Notifications, Calendar,
Progress Cards. Widgets shall maintain consistent sizing and spacing.

## 15. Tables

Sticky headers, zebra rows (optional), search, filters, pagination, sorting. Row hover: light gray
background.

## 16. Charts

Recommended library: **Chart.js**. Preferred colors: Primary `#183A67`, Accent `#C9A24A`, Success
`#2E7D32`, Warning `#F59E0B`, Danger `#DC2626`. Charts shall avoid excessive colors.

## 17. Animations

Subtle only: Fade In, Slide Up, Hover Elevation, Loading Skeletons, Smooth Page Transitions.
Duration **200–300ms**. Avoid unnecessary motion that distracts from content.

## 18. Responsive Design

| Device | Width |
|---|---|
| Mobile | <576px |
| Tablet | 576–992px |
| Laptop | 992–1200px |
| Desktop | >1200px |

All dashboards shall remain functional across supported screen sizes.

## 19. Accessibility

Keyboard navigation, focus indicators, color contrast compliance, alt text for images, semantic
HTML, screen reader compatibility. Considered throughout development, not added afterward.

## 20. CSS Variables (reference — see `frontend-next/app/globals.css` for the actual, expanded set)

```css
:root {
  --primary:#183A67;
  --primary-dark:#102A4C;
  --accent:#C9A24A;
  --accent-dark:#B58F37;
  --background:#F8F6F1;
  --surface:#FFFFFF;
  --text:#2B2B2B;
  --text-secondary:#6B7280;
  --border:#E5E7EB;
  --success:#2E7D32;
  --warning:#F59E0B;
  --danger:#DC2626;
  --info:#2563EB;
  --radius:12px;
  --transition:0.25s ease;
}
```

## 21. UI Principles

Consistent visual hierarchy · Uniform spacing and alignment · Minimal use of colors beyond the
defined palette · White space used intentionally · Reusable UI components across all modules ·
Responsive layouts · Clear feedback for user interactions · Professional and diplomatic appearance.

## 22. Overall Experience

The MUN Buddy interface should feel like a **Diplomatic Operating System** rather than a
conventional web application. Every screen — from the public landing page to the Super Admin
dashboard — should communicate professionalism, trust, and efficiency.

- Professional enough for universities and institutions.
- Modern enough to compete with contemporary SaaS platforms.
- Simple enough for first-time delegates to navigate confidently.
- Consistent enough that every module feels like part of one cohesive product.

This design system is the single source of truth for all frontend development, ensuring visual
consistency as MUN Buddy evolves.
