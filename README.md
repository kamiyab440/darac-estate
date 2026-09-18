# DARAC Estate — Website

A seven-page, production-ready marketing site built to match the supplied Figma frames.
Hand-written HTML, CSS and vanilla JavaScript. No build step, no framework, no dependencies.

---

## 1. Pages

| File | Page | Built from frame |
|---|---|---|
| `index.html` | Home | `image.png` |
| `about.html` | About Us | `About Us Page.png` |
| `residential.html` | Residential (project listing) | `Residential Page.png` |
| `residential-detail.html` | Residential Inner Details — *Tulsi Villa-2* | `Residential Inner Page.png` |
| `blog.html` | Blogs (9-card grid) | `Blog page.png` |
| `blog-post.html` | Blog Inner Details | `Blog Inner page.png` |
| `contact.html` | Contact Us | `Contact Page.png` |

Every page shares a byte-identical header, mobile menu, enquiry drawer, lightbox, page-wipe
transition and footer. They were generated from a single shell so the navigation and footer can
never drift apart — this is verified automatically (see §8).

## 2. Running it

It is a static site. Either open `index.html` directly, or serve the folder:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080
```

Deploy by uploading the whole folder to any static host (Netlify, Vercel, S3, cPanel, Nginx).
No configuration is required.

> Typography loads from the Google Fonts CDN, so the first paint needs an internet connection.
> To self-host, drop the woff2 files into `assets/fonts/` and replace the `<link>` tags in each
> `<head>` with an `@font-face` block.

## 3. Structure

```
site/
├── index.html · about.html · residential.html · residential-detail.html
├── blog.html · blog-post.html · contact.html
├── README.md
└── assets/
    ├── css/style.css          single stylesheet, 31 numbered sections
    ├── js/main.js             single script, no dependencies
    ├── tulsi-villa-2-brochure.pdf
    └── img/                   51 images + logo SVG
```

## 4. Design system

All design decisions are CSS custom properties declared once in `:root` at the top of
`style.css`. Change them there and the whole site follows.

**Brand colour** — taken from the logo and the frames:

| Token | Value | Use |
|---|---|---|
| `--red` | `#a61d24` | Primary brand red: buttons, accents, active states |
| `--red-dark` | `#87141b` | Pressed / deep red |
| `--ink` | `#272727` | Headings, dark sections, button hover fill |
| `--cream` | `#fff6ef` | Page background |
| `--cream-deep` | `#fbeae0` | Alternating section background |
| `--muted` | `#5c5853` | Body copy |

**Typography** — Playfair Display (display serif) + DM Sans (UI sans). The type scale is fully
fluid via `clamp()`, so nothing needs per-breakpoint font sizes: `--t-d1` 44→90px through
`--t-small` 13→15px. Body text never drops below 15px and small text never below 13px.

**Spacing & shape** — 4/8/12/16/24/32/48/64 spacing rhythm, `--radius: 6px` for cards and media,
`10px` for buttons and `100px` for pills and chips. Sections use `--sec` (60→110px fluid) and `.section--tight`
(44→88px) for denser stacks.

## 5. Liquid glass

The glass follows the iOS/macOS "liquid glass" rule: the surface has **no colour of its own**.
All it does is bend, brighten and lightly tint what is already behind it, so it takes on the
colour of the page as you scroll.

1. a near-invisible white light layer (`rgba(255,255,255,.26)` → `.10`, top to bottom) — light,
   not paint,
2. `backdrop-filter: blur(34px) saturate(200%) brightness(1.06)` — the blur and the saturation
   boost are what actually make it read as glass,
3. one very soft drop shadow to lift the pane off the page. No borders, no hairlines, no
   specular streaks anywhere on the navbar.

### Navbar behaviour

- **At the very top of the page the navbar is completely transparent** — no tint, no blur, no
  border, nothing. It floats over the hero.
- The moment the page leaves the top edge (>10px) the header gets `.is-stuck` and the glass
  fades in over 0.45s, the logo swaps white→ink and the links darken for the light page body.
- **The bar is pinned.** It stays fixed to the top at every scroll position and never hides
  itself on scroll-down.
- Nav tabs: hover and the current page show a rounded `#A61D24` pill that **wipes up from below**
  (`::after`, `translateY(101%) → 0`) under a white label — the same motion, radius and colour
  language as the buttons. No underline.
- The current tab is driven by `aria-current="page"`; detail pages inherit their parent
  (residential-detail → Residential, blog-post → Blog).

Glass is also used on the mobile menu panel, the breadcrumb pills on every interior hero, the
lightbox chrome, the enquiry drawer and `.btn-ghost`.

Tokens: `--glass-blur`, `--glass-sat`, `--glass-edge`, `--glass-ring`, `--glass-lift`.
There is a `@supports not (backdrop-filter: blur(1px))` fallback that swaps in a solid tint for
older browsers.

### Footer links

Every footer link is wrapped at runtime by `footSwap()` in `main.js`: the label slides up and an
identical copy in `#A61D24` slides in behind it, matching the way the buttons wipe their
background. The duplicate is `aria-hidden`, so a screen reader still reads the link once.
The link for the page you are on carries `aria-current="page"` and sits permanently in the red
state, detail pages included. The credit line links to <https://richestbranding.com/> and opens
in a new tab (`target="_blank" rel="noopener noreferrer"`) on all seven pages.

## 6. Buttons

One component, used everywhere (`Explore Now`, `Enquire Now`, `Submit Now`, `View Project`…).

**Shape** — a 10px-radius red block, label on the left, and a white rounded-square tile pinned to
the right holding the red diagonal arrow. The tile is inset by 6px, so the button is built from
`padding: 6px` + `padding-left: var(--btn-pad)`; height is `--btn-h` (50→58px fluid) and the tile
is always `--btn-h - 12px` square with a 7px radius.

**Hover** — the ink panel wipes up from below (`::before`, `translateY(101%) → 0`) and the arrow
does its diagonal fly-out / fly-in swap, **landing back on the exact pixel it started from**. The
old persistent `transform: translate(14px,-14px)` that left the arrow parked in the corner after
the keyframe finished has been removed; only the `ico` keyframe runs now. The arrow also takes
the colour the background is wiping to — ink on the red buttons, red on `.btn--ink` and
`.btn--light` — so it always matches the incoming panel. On `.btn--light` the tile inverts
(red tile → white tile) with it.

**Removed on request** — the 2px `translateY` lift, the soft drop shadow and the specular sheen
sweep. Nothing else about the animation changed. `:active` still gives a 1.5% press.

Variants: `.btn--ink` (dark, reveals red), `.btn--light` (white, reveals red), `.btn--wide`
(full width), `.btn-ghost` (glass outline, for use on imagery — radius matched to 10px).

## 7. Motion

All animation is driven by data attributes, so markup stays declarative and nothing is
hard-coded in JS:

| Attribute | Effect |
|---|---|
| `data-reveal="fade\|left\|right\|scale"` | Entrance on scroll |
| `data-stagger="0.06"` | Staggers the children of a container |
| `data-clip` | Image mask wipe |
| `data-split` | Per-line heading reveal |
| `data-parallax` | Slow drift on scroll |
| `data-count` | Number roll-up for statistics |
| `data-lb` / `data-lb-cap` | Opens the lightbox with a caption |
| `data-slider`, `data-rail` | Testimonial slider, draggable card rail |
| `data-form` | Inline validation + success state |
| `data-enquire` | Opens the enquiry drawer instead of navigating |

Everything is gated behind `prefers-reduced-motion`: when the user asks for less motion, content
is shown immediately in its final state and the page-wipe, parallax and Ken Burns effects are
disabled. Keyboard focus is always visible, and the lightbox and drawer trap focus and close on
`Esc`.

Reveals are double-driven: an `IntersectionObserver` handles the normal case, and a
`getBoundingClientRect` sweep runs on every scroll as a safety net. An observer can miss an
element entirely if the viewport jumps (anchor link, restored scroll position, fast flick), which
would leave that block stuck at `opacity: 0` forever — the sweep marks anything at or above the
trigger line, so content can never be lost.

## 8. Quality checks

Run against a headless Chromium at 1440px and 390px, all seven pages:

- no horizontal scrolling (`scrollWidth === clientWidth` everywhere),
- no broken or zero-size images (51 assets, every reference resolves),
- every scroll animation completes — zero elements left in a pre-reveal state,
- header markup and footer markup are identical across all seven pages (hash-compared),
- the navbar reports a live `backdrop-filter` and switches to its stuck state on scroll,
- breadcrumb pills sit flush to the hero base and never collide with the fixed header,
- lightbox opens with the correct image and caption and closes on `Esc`,
- the contact form flags all six empty fields and then shows the success panel,
- mobile: primary nav hides, burger appears, every grid collapses to a single column.

## 9. Assets

All imagery was extracted directly from the supplied Figma PNGs at native resolution — no stock
photography and no AI-generated pictures were substituted. Extraction was automated: photo
blocks were detected, cropped, and heroes were re-cropped below each frame's baked-in navbar so
no duplicate navigation appears in the image. The red breadcrumb pills that were flattened into
the frame exports were removed by inpainting, and are now real, accessible HTML.

`assets/tulsi-villa-2-brochure.pdf` is generated to match the project page, so the
**Download** action on the detail page delivers a real document rather than a dead link.

### Icons

The four *Why Choose Us* icons (location pin, pool, growth chart, calendar) are hand-authored
inline SVGs drawn to match the supplied reference one-for-one. The build sandbox has no network
access, so no icon set could be downloaded — the upside is zero third-party requests and icons
that inherit `currentColor`, so they invert with the card on hover. To swap in Font Awesome,
replace the `<svg>` inside each `.why__ico` with `<i class="fa-solid fa-location-dot"></i>`,
`fa-water-ladder`, `fa-chart-line`, `fa-calendar-days` and load the FA stylesheet.

### The video block

The *Project View* walkthrough on `residential-detail.html` uses the frame's own still as the
poster and opens it in the lightbox, because no video file was supplied. To wire up a real one,
replace the `<button class="vid">` with:

```html
<div class="vid">
  <video src="assets/tulsi-villa-2.mp4" poster="assets/img/rp-video.jpg" controls playsinline></video>
</div>
```

## 10. Editing content

**A new blog post** — copy any `<article class="post">` card in `blog.html`, change the date,
title and image, then duplicate `blog-post.html` for the article body.

**A new project** — copy a `.pcard` block in `residential.html`, then duplicate
`residential-detail.html` and swap the hero, the floor-plan rows, the facilities and the gallery.

**Contact details** — phone, email and address appear in the footer of all seven pages and in the
`.gt` block on `contact.html`.

**Form submission** — `forms()` in `main.js` validates and then simulates a send. Point it at
your endpoint (Formspree, a PHP handler, an API route) to go live; the validation, error messages
and success panel already work.

## 11. Revision round 5 — what changed

Every item below is live in this package and covered by an automated check
(`node /data/qa/rev5check.mjs`, 11 groups, all green).

**Navbar**

- Hover / current pill keeps the solid `#A61D24` fill, with the inner padding cut by ~2px
  (`8px clamp(10px, .95vw, 16px)`, i.e. 13.7px horizontal at 1440px instead of 15.8px) and the
  gap between tabs opened by ~3px (`clamp(4px, .75vw, 14px)` → 10.8px at 1440px).
- The hamburger breakpoint moved from 900px to **1024px**. At 1023.98px and below the inline nav
  and the header's *Enquire Now* button are hidden and the burger + full-screen mobile menu take
  over. Change the single `@media (max-width: 1023.98px)` query in section 34 of `style.css` to
  move that line again.

**Buttons**

- Label type is now `clamp(15px, 1.15vw, 16px)` — exactly 16px from 1392px up, 15px floor on
  small screens (with an explicit 15px rule below 640px). Height, 44px arrow tile, wipe fill and
  arrow return-to-origin behaviour are unchanged.

**Home page**

- *Hero:* the "Scroll to explore" cue is gone; the CTA now sits alone on the left directly under
  the title + subtitle block, and it uses the same dark red `#A61D24` as the nav pill (white
  label, white arrow tile). `min-height` is `100svh` at every width — the mobile 92svh exception
  was removed, so the hero fills the visible viewport on iPhone-class screens where the browser
  chrome used to eat 8%.
- *About:* the right-hand graphic is now **your supplied 442×404 path**, drawn twice — the front
  copy stroked in `#A61D24`, an echo behind it at `translate(17, -17)` in `rgba(166,29,36,.26)`.
  The scroll-triggered draw-on (`stroke-dasharray: 1800`, 2.1s, echo delayed 0.42s) and the slow
  float are unchanged. It renders in a `-10 -26 480 442` viewBox so the stroke is not clipped.
- *Trust band:* moved **after** the testimonials section (it is now the 7th block on the page,
  testimonials 6th). The skyline drift runs faster — `data-parallax="0.13"` with a
  `data-parallax-max="40"` clamp, ~80px of travel across one screen instead of ~46px — and the
  parallax loop now keeps updating from 400px outside the viewport in either direction instead of
  200px, so the image is already in motion as the band enters rather than only while it is
  centred. Same values on the About page.

**About Us page**

- The three process cards are taller and squarer (`min-height: clamp(340px, 28vw, 460px)`, padding
  up to 44px), each with a larger 46–62px line icon at 66% white: a drafting square with a dashed
  arc (Design), a magnifier with a second lens (Planning), a tower crane (Build). The cards now
  wipe down with the same `data-clip` reveal as the imagery instead of fading up.

**Residential inner page**

- *Project info header:* the three actions are bordered, rounded, glassy 43px tiles — Inquiry
  (chat bubble), Download (cloud + arrow), Location (map pin) — in solid brand red with knocked-out
  white detail, labels beneath, and a hairline rule closing the header.
- *Floor plans:* each row is separated by a light hairline again. The generic button reset in the
  stylesheet was stripping `border` from the rows, which is why the dividers had disappeared; they
  are restored with `.floor__list .frow` and warm to red on hover. Hovering or focusing a row now
  re-plays the wipe on the plan image on the right every time, swapping in that row's drawing.
- *Project view:* the six pictures wipe in horizontally from their own side — the three
  left-column images open left→right, the three right-column images right→left.
- A full section's worth of space (`var(--sec)`, 92px at 1440px) now sits between the walkthrough
  video and the footer.

**Site-wide**

- Every content image on all seven pages now uses the slide-down wipe from the About and Ongoing
  Projects sections. `autoClip()` in `main.js` tags them at boot — 11 on Home, 16 on About, 4 on
  Residential, 9 on the inner page, 9 on Blog, 6 on the article, 1 on Contact — skipping the hero,
  page headers and the parallax skyline, which have their own entrances.
- Lightbox prev/next are scoped to the section you clicked in. Each gallery gets a group key from
  `data-lb-group`, else its nearest `<section>`; opening a project-view image cycles only those
  six, a floor-plan row cycles only the plans, and a lone image hides the arrows entirely.

"

## 12. Deliberate deviations from the frames

Seven changes were made on purpose, all easy to revert:

1. **Email corrected.** The frame reads `Infodarac@Gamil.Com`; the site uses
   `infodarac@gmail.com` so the `mailto:` link actually works.
2. **Team members named.** The frame repeats a placeholder "John Doe / Vp Of Construction" four
   times. Replaced with four distinct roles — Managing Partner, VP of Construction, Head of
   Design, Sales Director. Swap the names in `about.html`.
3. **Blog cards written out.** The frames repeat one placeholder headline nine times; nine
   distinct real titles and dates are used so the grid reads like a genuine journal.
4. **Floor-plan rows are interactive.** Each of the seven rows opens the plan in the lightbox.
   Point each `data-lb` at its own drawing when the individual plans are available.
5. **Red is lightened on dark surfaces — except the footer, as requested.** Brand red `#A61D24`
   scores ~2.5:1 against the hero image and ~2:1 against the ink footer, below the WCAG AA 4.5:1
   minimum. The hero and mobile menu therefore use `--red-on-dark: #f2878d`. The footer hover and
   current-page colour is the **exact `#A61D24`** you specified, so that one surface sits below AA
   on purpose — swap `var(--red)` back to `var(--red-on-dark)` in the `.foot*` / `.info` rules to
   revert. Nav pills are white text on solid `#A61D24` (6.2:1), so they are unaffected.
6. **Trust band edge crop — deeper after the speed increase.** The band is
   `clamp(360px, 40.8vw, 705px)` tall and the skyline is `object-fit: cover`. Running the drift at
   the faster `data-parallax="0.13"` you asked for (~80px of travel, clamped at 40px each way)
   needs `inset: -46px` of vertical slack so no gap ever shows, and that extra scale crops the
   sides further: about **86% of the skyline width stays visible at 1440px**, against 91% at the
   round-4 speed and 94% at the original. If you would rather have the wider skyline, lower
   `data-parallax` on `.trust__media` in `index.html` / `about.html` and shrink the matching
   `inset` in the `.trust__media` rule. Same values on both pages.

7. **"Our Story" on the About page is newly written.** The earlier package in this thread has no
   `Our Story` section — its About page opened with the same intro block as the Home page, which
   is the repetition you flagged — so the replacement (intro + three-image gallery + three
   numbered principles) was authored fresh. No dates, figures or claims were invented; edit the
   copy in `about.html` under `<!-- our story -->`.

8. **Icons are hand-drawn, not downloaded.** The build sandbox has no internet access, so the
   process-section icons (drafting square, magnifier, tower crane) and the project-header glyphs
   (chat bubble, cloud-download, map pin) are inline SVG authored to match the reference frames
   rather than files pulled from an icon site. They are single-colour, crisp at any size and add
   no requests. Swap any `<svg>` for a licensed equivalent if you prefer the exact original set.

9. **Floor-plan drawings still share one image.** Hovering a row re-plays the wipe and re-points
   the picture at that row's `data-plan`, but all seven currently reference the same
   `rp-floorplan.jpg` because only one drawing was in the frames. Point each row's `data-plan`
   (and `data-lb`) at its own file and the swap becomes a real plan change with no code edits.

---

© 2026 Darac Properties. All rights reserved.

---

## Revision 6

### Buttons, site wide

| token | was | now |
| --- | --- | --- |
| `--btn-h` | `clamp(50px,3.9vw,58px)` | `clamp(46px,3.3vw,52px)` |
| `--btn-pad` | `clamp(18px,1.5vw,26px)` | `clamp(15px,1.2vw,21px)` |
| label to tile gap | `clamp(16px,1.5vw,28px)` | `clamp(10px,.95vw,18px)` |
| inner tile | `--btn-h - 12px` | `--btn-h - 10px` |
| tile glyph | `16px` | `15px` |

Measured at 1440: **47.5 x 166.8**, label 16px, tile 37.5px. Every button in the
site (header, hero, section heads, cards, forms) reads from these tokens, so the
whole family shrank together and the hover wipe, arrow return and colour logic
from revision 5 are untouched.

### Home

**Hero button.** The reveal sweep marked anything above `innerHeight * 0.92`.
On a `100svh` hero the button sits at roughly `0.93`, so it only faded in once
the About section had been scrolled into view. Two changes: the sweep line is
now `0.999`, and the first screen (`.hero`/`.phero` reveal, split and eyebrow
nodes) is force-marked at boot. The CTA is now painted at `scrollY 0` at both
1440 and 390.

**Stats.** `.stat__label` is `var(--red)`. `.stats` swapped `padding-top` for
`padding-block` and gained a `border-bottom`, so the rule below the band sits at
the same 43.2px distance as the rule above it.

**Project sections.** Eyebrows are now `Ongoing Projects`, `Completed Projects`
and `Upcoming Projects`. Each single picture became a pinned three-picture
stack:

```
.pstack            height: calc(3 * 74svh)      the scroll budget
  .pstack__pin     position: sticky; top: var(--hdr) + 16px
    .pstack__win   aspect-ratio: 1478/700       the fixed window
      .pstack__item   clip-path: inset(100% 0 0 0)  ->  .is-shown inset(0)
      img             scale(1.06) + translate3d(0, (seg - .5) * -34px, 0)
    .pstack__dots  i.is-on  26px -> 44px, red
```

`pstack()` reads `travel = stack.offsetHeight - pin.offsetHeight`, converts
scroll position into `p` (0 to 1), and from that derives the active index and the
within-segment fraction. The index drives the clip-path wipe-up and the dots; the
fraction drives the parallax drift inside the frame. It is rAF-throttled, honours
`prefers-reduced-motion`, and without JavaScript the three pictures simply stack
vertically.

Captions read `ONGOING / Tulsi Villa 3`, `ONGOING / Tulsi Villa 4` and so on. The
ghost button is now **View Image**, and the section CTA is a real `.btn`, i.e.
the navbar Enquire Now design.

**Why choose.** The circular plate is gone. `.why__ico` is a bare flex box with a
`clamp(38px,3.2vw,48px)` glyph (46px at 1440) that lifts 4px on hover. The pool
and growth glyphs were redrawn to match the reference band; the pin and calendar
were already correct.

**Blog cards.** Hover is now card-wide: pointing at the image, the title or Read
More triggers the image zoom, the title underline and the red Read More at once
(`.post:hover`, plus `.post:focus-within` for keyboards). The zoom curve is
`.55s cubic-bezier(.22,1,.36,1)` with zero delay, and the idle state has its own
`1.1s` transition so the scale-back is equally smooth.

### About

- Team pictures use the same `data-clip` reveal as the vision picture, so both
  measure `1.15s cubic-bezier(.65,0,.35,1)`. The stagger was removed so the
  timing matches exactly.
- Cards are inert: no zoom, no lift, and the four `Connect` tags were deleted.
- The blog block is now the home rail markup verbatim (four cards, prev/next
  controls, `data-rail`), and the trust band was moved below the testimonial
  slider so the section order matches the home page.

### Residential

`.pcard__go` keeps its glass but drops to a 10px radius. Hover adds a red wipe-up
behind the glass, a red-tinted shadow and a 3px diagonal step on the arrow.

### Residential inner

- Inquiry / Download / Location: the lift and shadow are gone. Each `.act__box`
  now has a `::before` that wipes the dark red down from the top, exactly like
  the header Enquire button, and the glyph turns white.
- Floor plans: every row now carries its own `data-plan`
  (`rp-floorplan`, `fp-2` ... `fp-7`), so `floorSwap()` has something to swap
  and the swipe-down replays on each tab.
- Walkthrough: the poster button became a 16:9 `div` holding a
  `youtube-nocookie` iframe for `OUnpN9bCdrA`, with the section spacing kept
  before the footer.

### Blog

Every blog card on every page now uses one markup shape: picture link, date,
linked `h3`, Read More. Nine distinct thumbnails on the blog index, three on the
related rail.

### Favicon

`favicon.svg` (the logo dart) is the primary icon, with a 512px PNG fallback and
a 180px apple-touch icon rendered from the same path.

### Images

All 49 photographic assets were rebuilt from `darac-images.zip`. Each job keeps
the aspect ratio the layout already reserved, so nothing reflowed:

```
magick <source> -auto-orient -resize WxH^ -gravity <g> -extent WxH \
       -strip -interlace Plane -sampling-factor 4:2:0 -quality 78..82 <out>
```

Sources were matched to the old snapshot crops numerically (normalised cross
correlation plus a colour histogram), so each section keeps the same subject it
had before. Pack sources per group:

| group | source |
| --- | --- |
| home hero | `img-03` |
| page heroes | `img-01`, `img-02`, `img-04`, `img-05`, `img-06` |
| trust skyline | `img-11` |
| residential cards | `img-05`, `img-06`, `img-08`, `img-10` |
| project stacks | `img-04` to `img-11` |
| floor plans | `img-04` to `img-09` |
| mosaic | `img-04`, `img-05`, `img-07`, `img-08`, `img-09`, `img-10` |
| blog thumbnails | `img-04` to `img-11` |
| contact side | `img-04` |

No pack frame matched the portraits or the two small story pictures
(`team-1..4`, `person-*`, `quote-person`, `vision`, `mission`, `signature`), so
those were left exactly as they were rather than substituted with an unrelated
photograph.

### Deviations worth knowing

- The why-choose glyphs are hand-drawn inline SVG traced from the reference
  band; the sandbox has no network access, so the original icon set could not be
  downloaded.
- Six of the nine stack project names are placeholders (`Tulsi Villa 5`,
  `Tulsi Residency`, `Tulsi Business Park`, `Tulsi Retail Plaza`,
  `Tulsi Corporate Tower`) - the Figma frames only named three.
- The YouTube embed cannot be played inside the sandbox, so it is verified
  structurally (correct id, fills its 16:9 box, fullscreen allowed) rather than
  visually.
- Higher resolution photography makes the package larger than revision 5; the
  image folder is about 11.6 MB.

## Revision 7

### One arrow for the whole site
The supplied dart is defined once per page as an inline SVG `<symbol id="arw">`
(inside `.sprite`, which is hidden) and used everywhere with
`<svg class="ico-arw"><use href="#arw"/></svg>`. It inherits `currentColor`, so
it is red on the white tile of a button, white on dark, and it needs no network.
Sizes: 14px in a button tile, 13px on a ghost button, 12px next to `Read More`,
15px in a prev/next circle, and clamp(36-50px) in the footer.

Rotation is a variable, so the hover fly-out keeps it:
`--rot` is `45deg` for next, `225deg` for prev and `-45deg` for `View Image`,
and `@keyframes ico` interpolates `translate() rotate(var(--rot,0deg))`.
Every arrow that used to nudge 3px on hover now plays the same fly-out, and it
is triggered by hovering the whole link, not just the icon.

### Home hero swiper
`.hero[data-hero]` holds three `.hero__slide` articles. Slide one carries
`is-on` in the markup, so the hero is correct with JavaScript disabled or still
loading. `hero()` cross-fades every 4.6s, pauses on hover, on focus and when
the tab is hidden, and stops entirely under `prefers-reduced-motion`. Each
slide has its own picture, headline, paragraph, and call to action, a 7.4s
scale-down on the image, and a 0.16/0.30/0.44s copy cascade. The three dots are
real buttons with a 44px hit area.

### Signature
`sign.svg` is inlined (three paths, all recoloured to `currentColor`) and
revealed by a slanted soft-edged mask that sweeps left to right over 3.1s, so
the burgundy strokes appear progressively on a transparent background with no
pen or hand. Filled artwork carries no stroke order, so the sweep follows the
natural left-to-right order of the writing. `assets/img/signature.svg` ships the
same recoloured file for reuse.

### Project stacks
- `View Project` now rises from the bottom like `More About Us`.
- The pictures wipe top to bottom, matching every other image on the site.
- The first picture after a reload always plays its wipe, even when the browser
  restores the scroll position half way down the stack.
- The inner parallax drift is gone: each picture holds still and the next one
  wipes over it.
- The block pins vertically centred under the header instead of sticking to the
  top, and the heading above it scrolls away normally.
- The minor bottom gradient is back, so the caption and `View Image` stay legible.
- Numbers are spelled out: `Tulsi Villa Three`, `Tulsi Villa Four`, and so on,
  across every page.

### Other fixes
- The trust band and the home about heading now use the same family and weight
  as every other section title.
- Prev/next circles are `#A61D24` with a red border, filling red with a white
  dart on hover.
- About: the four team pictures wipe in at 0/0.16/0.32/0.48s, and the process
  cards step at 0.16s.
- Residential inner: the red hover fill now covers the whole rounded box (no
  corner seam) and the dots inside each icon turn red with it.
- The walkthrough is a poster with a play button. Served over http(s) it builds
  the YouTube frame on click; opened straight from disk (`file://`) YouTube
  rejects the request with a player configuration error, so the click opens the
  video in a new tab instead. Run `python3 -m http.server` in this folder and
  open `http://localhost:8000/residential-detail.html` to play it inline.
- Mobile menu: lucide `Menu` and `X` icons, and the panel uses the navbar glass
  recipe (`blur(26px) saturate(180%)`) over a dark tint so white links stay
  readable over any page behind it.
