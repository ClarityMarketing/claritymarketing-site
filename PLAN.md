# Clarity Marketing — Static Rebuild Plan

## Goal
1:1 rebuild of claritymarketing.dk as a static site. Same copy, same look, plus subtle animations and a new animated header banner. Auto-HTTPS via static hosting.

## Stack
- **HTML** + **Tailwind CSS** (via CDN, no build step)
- **Vanilla JS** for scroll reveals + banner rotator
- **Custom CSS** for the unique animations
- Self-hosted fonts (DM Sans / Inter feel, matching the current site)
- **Deploy:** Vercel (drag-and-drop deploy, free HTTPS, Danish CDN edge)

## Pages
| Page | URL | Status |
|---|---|---|
| Hjem | `/` (index.html) | Build full |
| Service | `/service.html` | Build full |
| Kontakt os | `/kontakt-os.html` | Build full + form to Formspree/Resend |
| Tidligere Arbejde | `/tidligere-arbejde.html` | Placeholder "Coming soon" (live site is empty) |

## Homepage sections (1:1 with current)
1. **NEW: Animated top banner** — cycles "Bliv set" → "Bliv husket" → "Skab vækst" with subtle slide-up fade. Black bar, white text, ~36px tall, above nav.
2. **Header / nav** — logo + Hjem / Service / Kontakt os / Tidligere Arbejde + language flag
3. **Hero** — disco ball image, "Bliv set / Bliv husket / Skab vækst" stacked headline, "Book en tid" CTA button
4. **Stats row** — "Vores tidligere arbejde" + 38% / 68% / 40% with labels, counter animation on scroll
5. **Bamboo glassmorphism section** — wood texture background with glass card: "Skab skalerbar vækst og fuld gennemsigtighed..." + "Læs mere" CTA
6. **Case study** — "Hvordan 100+ kvalificerede leads skabte vækst for Sams Indeklima" with 4 portfolio images + 5-star testimonial from Morten Nielsen
7. **Services preview** — "Sådan skaber vi vækst for brands" — Hjemmeside og SEO, Social Media Marketing, Google Ads, GEO with circular image icons + "Se mere her" CTA
8. **CTA section** — cushion/textile image + "Tag det første skridt mod din succes i dag." with 3-dot indicator
9. **Footer** — Clarity Marketing wordmark, email, phone

## Service page sections (1:1)
- Hero "Udforsk vores services" + intro paragraph
- 4 service blocks: Social Media Marketing, Hjemmeside & SEO, Google Ads, GEO — each with bulleted services
- "Kerneværdier & fordele" — 3 value blocks (En samarbejdspartner / Moderne systemer / Kreativitet)
- "Dine spørgsmål – besvaret" — FAQ accordion (5 questions)
- Footer

## Kontakt os page sections (1:1)
- "Book en samtale" hero + intro
- Form: Navn, Virksomhedsnavn, Email, Hjemmeside, "Hvad ønsker du at forbedre / scale?" → Send button
- Footer
- **Form handler:** Formspree (free tier, no backend needed) or Resend webhook

## Animations (subtle, all of them)
- **Top banner:** continuous rotator, ~2.5s per word, fade+slide up
- **Hero headline:** stagger fade-in on load (each line 80ms apart)
- **Stats numbers:** count up from 0 when scrolled into view
- **Section reveals:** fade-in-up on scroll via IntersectionObserver (40ms ease-out)
- **Buttons:** subtle scale on hover (1.02)
- **Images:** subtle ken-burns / parallax on hero
- **FAQ:** smooth height transition on expand
- **No bouncy / playful motion** — keeps the professional/serious agency tone

## Assets (from FTP backup)
Located in `rebuild/assets/`:
- `logo.jpg` — Clarity Marketing wordmark
- `hero.png` — disco ball (terracotta/orange)
- `wood-bg.png` — bamboo wood texture
- `cushion.jpg` — textile/cushion shot
- `about.jpg` — about us image
- More images to be copied from `live-backup/wp-content/uploads/2026/05/` as needed for case study + service icons

## File structure
```
rebuild/
├── index.html
├── service.html
├── kontakt-os.html
├── tidligere-arbejde.html
├── styles.css
├── script.js
└── assets/
    ├── logo.jpg
    ├── hero.png
    ├── wood-bg.png
    ├── cushion.jpg
    └── (more as needed)
```

## Build order
1. ✅ Plan + assets gathered
2. Homepage (index.html) with animated banner — proves the look + motion system
3. styles.css + script.js — extract shared system
4. Service page
5. Kontakt os page + form integration
6. Tidligere Arbejde placeholder
7. Cross-page polish: meta tags, favicon, Open Graph
8. Deploy preview to Vercel
9. Customer review
10. Point claritymarketing.dk DNS to Vercel (when approved)

## Deployment notes
- Drag-and-drop deploy to vercel.com — free SSL, fast Danish edge
- DNS change happens AT THE END, not during build — current WP site stays live
- Preview URL: something like `clarity-marketing-rebuild.vercel.app` — share with customer for review before going live
- When approved: change A record in Simply.com DNS to point at Vercel — propagates in minutes

## Open decisions (ask user when ready)
- Form handler choice (Formspree vs Resend vs Netlify Forms)
- Keep language flag/i18n placeholder, or remove (since only Danish is real)?
- Cookie banner — keep WP's Complianz behavior or skip until needed?
- "Tidligere Arbejde" page — make it a Coming Soon, or actually populate with the Sams case study?
