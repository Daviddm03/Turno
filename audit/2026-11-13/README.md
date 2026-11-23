# Turno web product design and frontend audit

13 November 2026. Application source was reviewed without edits. The app ran locally at `http://127.0.0.1:5173` in isolated headless Chrome 157 on Windows. A frontend specialist independently reviewed the source and CSS. This is an audit, not an implementation of the recommendations.

Turno already has a coherent mobile foundation. Its blue roster-block logo, ink typography, cool canvas, white cards, and coloured shift chips communicate a calm scheduling product. The main weaknesses are composition as available space increases, incomplete authentication states, and a few concrete accessibility defects. A new visual identity is unnecessary; the current identity needs to be applied more deliberately.

## Scope and evidence

All implemented web routes were reviewed: `/` (welcome) and `/login`. Shared elements reviewed: `TurnoHeader`, brand mark, back link, primary action styles, page shell, heading rules, focus rules, and design tokens. The welcome table/chips/legend and all login controls were also reviewed. There is no authenticated planner route in `web/src`. `mobile/` is a separate Expo app and is outside this web audit.

Source coverage: `web/src/App.tsx`, `Login.tsx`, `App.css`, `index.css`, `main.tsx`, `web/index.html`, public favicon, package scripts, and Vite configuration. There is no `web/src/Login.css` on disk, despite the IDE tab listing it.

Screenshots are real app captures, not mockups. Comparison sheets scale the captures for side-by-side viewing; open the original PNGs for legibility. Measurements are CSS pixels. Narrow-width checks use desktop Chrome viewport emulation, not physical phones; scrollbar behaviour differs from mobile browsers.

| Viewport | Welcome | Login | Observed behaviour |
| --- | --- | --- | --- |
| 320 × 568 | [Screenshot](welcome-320x568.png) | [Screenshot](login-320x568.png) | Both fit; welcome action ends 24 px above viewport bottom; table and legend remain intact. |
| 375 × 667 | [Screenshot](welcome-375x667.png) | [Screenshot](login-375x667.png) | Comfortable controls; preview remains compact; login card uses the same outer alignment. |
| 430 × 932 | [Screenshot](welcome-430x932.png) | [Screenshot](login-430x932.png) | Large blank spaces surround the small preview; login card becomes detached from its header. |
| 768 × 1024 | [Screenshot](welcome-768x1024.png) | [Screenshot](login-768x1024.png) | Both routes remain 440 px wide; vertical empty space dominates. |
| 1440 × 900 | [Screenshot](welcome-1440x900.png) | [Screenshot](login-1440x900.png) | Same 440 px column; welcome still behaves like a phone screen. |
| 375 × 480 | [Screenshot](welcome-375x480.png) | [Screenshot](login-375x480.png) | Vertical scrolling appears; welcome action falls below the fold. |
| 320 × 400 | [Screenshot](welcome-320x400.png) | [Screenshot](login-320x400.png) | Both scroll; welcome legend wraps in the scrollbar-reduced width; login feedback requires scrolling. |

Side-by-side evidence: [mobile](mobile-comparison.png), [tablet](tablet-comparison.png), [desktop](desktop-comparison.png), [login states](login-state-comparison.png).

## Findings, in priority order

### 1. P1 — Login cannot complete its primary task

**Confirmed in browser and code.** A valid submission always displays “A autenticação ainda não está disponível nesta versão.” Nothing authenticates or redirects. This is a release dependency rather than a styling regression. [Login.tsx:8](../../web/src/Login.tsx#L8), `handleSubmit`.

Keep this distinction explicit: required-field and email-format validation already work. Missing states are authentication pending, credential rejection, network/server failure, success, and authenticated navigation. Before release, connect these states to real authentication; use a visible pending label, prevent duplicate submission, and provide specific recoverable feedback. If this remains a prototype, communicate its status before asking someone to enter credentials.

Evidence: [submission feedback](login-submission-feedback.png).

### 2. P2 — Input boundaries have insufficient contrast

**Measured from the implemented colours.** `.turno-field input` uses `#8d9bb0` against white: **2.82:1**. The empty white inputs sit on a white card, so the border is the visual cue identifying their boundaries. Strengthen the input border to at least 3:1 and give it a semantic control-border token. [App.css:292](../../web/src/App.css#L292).

This is separate from focus visibility: keyboard focus is implemented, with a blue border and pale outer ring for fields, and solid blue outlines for links/buttons. Preserve that behaviour. W3C explains the 3:1 requirement for identifying text-input boundaries in [Understanding Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast).

### 3. P2 — Unknown URLs render a blank app

**Confirmed in browser.** An unrecognised path produces an empty root with no heading, explanation, brand, or recovery action. Only two routes are defined. Add a small branded not-found route with a home link. [App.tsx:134](../../web/src/App.tsx#L134), `<Routes>`.

Evidence: [unknown route](unknown-route.png).

### 4. P2 — Page language and navigation do not orient assistive technology

**Confirmed in code and browser.** The Portuguese interface declares `lang="en"`. Both routes retain the title `web`; after activating welcome’s action with Enter, focus is on `BODY`, not the login heading or form. Set `lang="pt-PT"`, use meaningful route titles, and implement a deliberate focus policy on client-side navigation, normally focusing the new main heading. [index.html:2](../../web/index.html#L2), [index.html:7](../../web/index.html#L7), [App.tsx:134](../../web/src/App.tsx#L134).

The incorrect language declaration can cause incorrect screen-reader pronunciation; W3C’s [language attribute technique](https://www.w3.org/WAI/WCAG22/Techniques/html/H57) documents the intended behaviour. Actual screen-reader announcements were not tested.

### 5. P2 — Tablet and desktop inherit the phone composition

**Confirmed visually and by layout measurements.** `.turno-header`, `.turno-intro`, and `.turno-login` all share `max-width: 440px`, with no width-specific composition. At 1440 px the content occupies only 31% of the width, with 500 px margins. The preview still uses 11 px labels and 20 px chips. [App.css:29](../../web/src/App.css#L29), [App.css:136](../../web/src/App.css#L136), [App.css:164](../../web/src/App.css#L164).

Introduce a wider shared desktop shell and a two-column welcome composition: explanation/action alongside a larger weekly roster. Let the primary action follow the explanation on desktop. Keep login’s actual form bounded around its current comfortable width; a wider shell should not stretch the inputs across the page. Align the header consistently across the desktop routes.

Evidence: [desktop comparison](desktop-comparison.png), [tablet comparison](tablet-comparison.png).

### 6. P2 — Welcome’s flexible middle row creates extremes of empty space and loses the action on short screens

**Confirmed visually and by measurements.** `grid-template-rows: auto 1fr auto` and `.turno-schedule { align-self: center }` center a fixed-height preview in all remaining space. At 430 × 932, the copy ends around y=204, the preview starts around y=428, and the action begins at y=860. There is approximately 223 px of blank space on each side of the preview. [App.css:83](../../web/src/App.css#L83), [App.css:114](../../web/src/App.css#L114).

At ordinary phone heights the bottom action placement is successful and should remain. At 375 × 480, however, the action starts around y=476 and requires scrolling. At 320 × 400 the document is about 576 px tall. The current bottom anchoring is to the document once content exceeds the viewport.

Preserve the bottom action on mobile through a shell with a reserved action row and a scrollable content region for short screens. On taller phones, use available space to make the roster more legible and keep it more closely related to the headline, rather than allocating all surplus height to blank gaps. Keep all seven days and the legend; do not solve this by further shrinking the already-small labels.

Evidence: [430 px welcome](welcome-430x932.png), [375 px short welcome](welcome-375x480.png).

### 7. P2 — Hover removes the primary action’s visible label

**Confirmed in browser.** `.turno-intro__action:hover .turno-button__label` sets opacity to zero while revealing an arrow in exactly the same grid cell. The button changes from a named action into an unexplained symbol. Login’s button only darkens, so the two primary actions also behave differently. [App.css:226](../../web/src/App.css#L226), [App.css:242](../../web/src/App.css#L242).

Keep “Entrar” visible; place an arrow beside it if directional feedback is useful. The accessible name remains present in the current code, so this is a visual clarity issue rather than a missing-name defect.

Evidence: [desktop hover](welcome-desktop-hover.png).

### 8. P3 — Login elevation is intentional, but its position and feedback spacing weaken the connection to the header

**Visual judgement supported by measurements.** The card repeats the welcome card’s white surface, 16 px radius, and fine border. Its shadow appropriately makes the form the focal point. The issue is the large distance from the header: at 430 × 932, the header ends at y=68 and the card starts at y=312, a gap of roughly 244 px. `.turno-login { align-content: center }` ties this distance to viewport height rather than a deliberate content relationship. [App.css:251](../../web/src/App.css#L251), [App.css:258](../../web/src/App.css#L258).

At 375 × 667, submission feedback grows the card by about 39 px and recenters it, moving its heading, fields, and action upward by about 20 px. `.turno-login__status:empty` also uses a negative margin to cancel the grid gap, while the empty grid item still occupies space. [App.css:333](../../web/src/App.css#L333).

Use a bounded top spacing or stable card anchor, with an explicitly designed feedback area. Keep the subtle elevation, and document it as the raised form surface; the welcome roster can remain a lower, bordered preview. On short screens, keep the form in normal scrollable flow and make feedback reachable. At 320 × 400, the status begins around y=409, below the viewport.

Evidence: [login state comparison](login-state-comparison.png), [short-screen feedback](login-short-feedback.png).

### 9. P3 — The roster explains Turno well, but its information scale stops growing

**Visual judgement, not a claim of WCAG text-size failure.** Names, seven weekdays, shift letters, and the legend clearly demonstrate a team’s week. At 320 px everything fits. However, 11 px labels and 20 px chips demand close attention and remain unchanged at desktop widths. [App.css:136](../../web/src/App.css#L136), [App.css:164](../../web/src/App.css#L164), [App.css:203](../../web/src/App.css#L203).

Increase labels toward 12–13 px and chips toward 24 px where available width permits. At the narrowest width, preserve the complete week and measure the row-name column before increasing chip size. At wider widths, show fuller shift labels or time ranges only if those values accurately represent the product. Keep the preview visibly illustrative; its fixed date is acceptable for a sample, but a small “Exemplo” cue would prevent it being mistaken for live data.

The palette itself works: measured text contrast is morning **7.06:1**, afternoon **6.92:1**, night **7.84:1**, and off **6.69:1**. Colour is reinforced by distinct letters/dashes and the legend, with full hidden labels and table row/column headers for accessibility. These are static chips, so their 20 px size is not a tap-target defect.

### 10. P3 — Typography, browser branding, and token ownership need finishing

**Confirmed in source; font fallback confirmed in browser.** `index.css` requests Inter without loading it. Chrome actually rendered the login heading in **Segoe UI Bold**. The product’s typography therefore varies by installed fonts and operating system. Decide deliberately between a system stack and a bundled, licensed typeface. [index.css:1](../../web/src/index.css#L1).

The tab still uses the purple Vite favicon instead of the blue Turno roster mark. Reuse the same visual signature in the favicon and meaningful browser titles. [web/public/favicon.svg](../../web/public/favicon.svg), [index.html:5](../../web/index.html#L5).

The logo itself is worth preserving: its grouped rectangular blocks echo shift slots, and the same shared component renders it on both routes. Scheduling identity can come from this vocabulary—week columns, team rows, shift blocks, time bands, and off days—rather than extra decorative calendar imagery.

## Design-system assessment and CSS architecture

| Element | Current assessment | Recommended system decision |
| --- | --- | --- |
| Logo/header | Same component, size, colour, and outer alignment on both routes. Strong foundation. | Preserve the roster mark; use it in browser identity. Give the shared shell a desktop width. |
| Gutters | Shared clamp produces about 19 px at 320, 22.5 px at 375, and 24 px at 430. | Preserve common outer alignment. Reuse the gutter token where the card padding deliberately follows it. |
| Typography | Clear display/body/label hierarchy; tightly tracked headings. Welcome and login use different fluid display sizes appropriately. | Choose font ownership; define explicit body line-height and a small text scale for metadata. |
| Spacing | Most spacing follows 4/8/16/24/32 px values. | Separate header-to-content spacing from viewport centering. Replace the empty-status negative-margin correction. |
| Colour | Blue action/brand, ink text, cool canvas, and semantic shift pastels are cohesive. | Preserve palette; move all shift, input-border, focus, and elevation colours into semantic tokens. |
| Borders/radii | Shared 16 px cards and 10 px controls; 5 px compact chips. | Preserve hierarchy; tokenise password-toggle radius and strengthen control borders. |
| Shadows | Welcome preview is bordered; login is elevated. Difference can communicate interaction hierarchy. | Document flat preview vs raised form surfaces; keep elevation restrained. |
| Controls | 48 px actions/inputs, 44 px back/toggle controls; consistent primary colour and corner shape. | Keep dimensions; retain labels on hover; define active/pending/disabled behaviour consistently. |

There are **no confirmed conflicting CSS overrides or duplicated page stylesheets** in the current source. The issues are incomplete responsive composition and scattered ownership, not a large cascade failure.

Specific maintenance opportunities:

- `--turno-blue` is declared in both `index.css:5` and `App.css:2`; ink is repeated as a root colour and page token. Centralise product tokens in one root scope.
- Shift colours (`App.css:174` onward), input border (`:297`), translucent focus (`:307`), shadow values (`:264`), and toggle radius (`:325`) are hardcoded outside the existing token vocabulary.
- `.turno-page--intro` and `.turno-page--login` exist in JSX but have no rules. They are useful future composition hooks, not current conflicting selectors.
- The repeated `clamp(16px, 6vw, 24px)` in page gutters and card padding could share ownership if matching these values is intentional. Fractional computed values are not inherently a defect.
- `Login.tsx` imports `TurnoHeader` from `App.tsx`, while `App.tsx` imports `Login`. This works now but creates a circular module dependency. A small shared header module would clarify ownership when changes are implemented. A new component framework is unnecessary.
- Shared `.turno-button` styling already keeps link and submit actions visually aligned. There is no need to create a large button abstraction solely for these two uses.

## Login state and accessibility inventory

| State/behaviour | Status |
| --- | --- |
| Explicit associated labels | Implemented; inspected. |
| Required email/password | Implemented; both browser-verified. |
| Email-format validation | Implemented; browser-verified with malformed input. |
| Persistent inline field feedback | Not implemented; current feedback uses native browser validation bubbles. Their language/appearance follows the browser environment. |
| Password masking/show/hide | Implemented; verified both directions and unchanged value length. |
| Password autocomplete | Implemented as `current-password`; actual password-manager integration not tested. |
| Keyboard order | Verified: Início → email → password → Mostrar → Entrar. |
| Focus indicators | Implemented and visible in the browser; input boundary contrast still needs correction. |
| Status live region | Implemented as `role="status"`; DOM update verified, actual screen-reader announcement not tested. |
| Authentication loading/rejection/network error/success | Not implemented; depends on authentication work. |
| Recovery/account provisioning | No such flows are implemented; product requirements must establish whether they are needed. |

The back link is correctly implemented as a real link, has text plus an icon, and provides a 44 px-high target. Its top-right position is consistent with the current compact header; it does not need relocation simply to imitate another product. The password toggle has an appropriate changing action name and `aria-controls`; missing `aria-pressed` is not itself a defect with this action-label pattern.

## Verification and delivery

- `npm.cmd run lint`: **passed**.
- `npm.cmd run build`: **passed**, including `tsc -b` and the Vite production build.
- There is no separate test or typecheck script in the package; TypeScript checking ran as part of build.
- Browser evidence captured across **14 route/viewport combinations**, plus validation, password, submission, keyboard-focus, hover, and unknown-route screenshots.
- **28 audit assertions passed**: horizontal overflow checks, normal-height bottom action placement, link navigation, keyboard order, native validation, password visibility/value preservation, current stub feedback, and absence of captured runtime errors. Passing these assertions does not mean the listed design/accessibility defects are resolved.
- Contrast ratios were calculated from the actual CSS colour values, using sRGB relative luminance; actual rendered heading font was obtained from Chrome’s platform font API.
- No application source or dependencies were changed. Audit scripts, evidence JSON, screenshots, and comparison HTML were added under this folder. Running the build regenerated `web/dist`.
- Git history/diff checks were unavailable because the supplied workspace is not a Git repository. No stage, commit, merge, reset, or push was performed.
- Physical mobile devices, mobile software keyboards, Safari/Firefox, real screen readers, and real authentication were **not tested**. Safe-area CSS exists but hardware safe-area behaviour was not verified. No automated accessibility scanner or repository regression suite is configured/run.

Remaining work: implement the prioritised fixes, then repeat the affected viewport/state checks and test the real authentication and software-keyboard flows. The recommended order is control contrast and language/orientation, route recovery, responsive composition and stable feedback, then token/font/favicon polish; authentication remains the release dependency throughout.

Reproduction artifacts: [capture script](capture.cjs), [supplemental checks](supplement.cjs), [layout/state evidence](evidence.json), [assertion and contrast results](checks.json). The capture scripts require a local Vite server on port 5173 and an isolated Chrome debugging endpoint on loopback port 9327; they do not install packages or modify the app source.
