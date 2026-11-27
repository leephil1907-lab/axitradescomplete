# AxiTrades visual comparison — supervisor review

Reference: https://www.axi.com/int/ and the supplied desktop-layout/mobile screenshots. This is a **partial recreation, not visual sign-off**. The inventory covers the homepage and the corresponding routes exposed by this project; it is not a complete crawl of Axi's international site.

## Verification scope

- Local production Chromium: **1440 × 900** and **390 × 844**, with reduced motion on for deterministic controls. At both sizes, verified all five carousel controls, country selection and Escape dismissal in the account dialog, direct rendering of the three product pages, and FAQ expansion without page-level horizontal overflow. Desktop Trade submenu verified via hover; mobile Trade → Spot Crypto and browser Back verified. No uncaught JavaScript errors during those checks.
- Reference: homepage copy and section order inspected through the page reader and supplied screenshots, plus the public CFD page content. A fresh Chromium load of the external reference returned `ERR_CONNECTION_CLOSED`; **matching-viewport side-by-side capture is not verified**. Spot reference page also did not return content through the page reader during this pass.
- `npm run build` passed. The production preview served the homepage and all three new deep links. No live transaction, custody, authentication, or payment certification was performed.

## Homepage section checklist

| Section | Matches reference structure | Difference or gap |
|---|---|---|
| Header and desktop dropdowns | Sticky navigation, account CTA and grouped dropdowns | Menu contents and grouping are not a complete clone. Keyboard parity with reference was not audited. |
| Mobile menu | Full-screen gradient menu, expandable categories, search, login and account CTA | Search filters local navigation rather than the full Axi catalogue. |
| Campaign carousel | Five numbered campaign states; responsive type and artwork | Recreated animated stills, not the original videos. Timings and exact framing differ. |
| Market strip | Instrument marks and compact updating quote tiles | Smaller instrument set and different feed/refresh behavior. |
| Broker introduction and metrics | Centered phone showcase, split-color title and four large metrics | Trustpilot is a link rather than the original rating widget; metrics attributed to the reference, not measured by this implementation. |
| Products | Three cut-corner cards with dedicated destinations | Copy avoids implying that this build executes spot or perpetual orders. |
| Platform showcase | Four selectable platforms and animated content | Alternate artwork/video and different implementation of selection and transitions. |
| TradFi Perpetuals | Category rail and product callout | Not all reference category details or actions are reproduced. |
| Axi Select | Dark introduction and three steps, with CTA | Not a pixel match; program terms are not verified for this project. |
| MT5–Claude | Split feature and artwork | Informational external link, not a local integration. |
| Manchester City | Responsive clipped partnership banner | CDN artwork can fall back to a different bundled image. |
| Get started | Full-width CFD banner and account CTA | Different supporting copy and potential artwork fallback. |
| Insights and AI summaries | Editorial card rail with article links and AI summarizer links | A subset of the reference article catalogue. |
| Footer, risk notice and chat | Dark six-column footer and bottom warning | WhatsApp-only chat intentionally differs from Axi. Footer links and app badges are not exact. |
| Open account dialog | Desktop split layout, stacked mobile art, country selection and close behavior | Different artwork; launches the existing registration flow. Submission beyond the dialog was not part of this browser check. |

## Public page inventory

| Reference area | Project destination | Status |
|---|---|---|
| `/int/` | Homepage | Structure mapped above; no pixel sign-off |
| Trade / CFDs | `/int/trade/cfds` | New responsive landing; hero, instrument preview, account/pricing cards, FAQ. Reference filters, pricing terms and instrument-detail pages not duplicated. |
| Trade / TradFi Perpetuals | `/int/trade/perpetual-futures` | New informational landing; no order execution. Exact reference layout not verified. |
| Trade / Spot Crypto | `/int/trade/cryptocurrencies/spot` | New read-only landing; exact reference layout not verified. No asset ownership, buy/sell, custody, or transfer functionality. |
| Markets and individual instruments | Existing Markets terminal | Terminal is not a substitute for the full reference marketing catalogue and detail pages. |
| Platforms: Axi App, MT4, MT5, Copy Trading, MCP | Existing Platforms overview, homepage panel and reference links | Separate reference landing pages and download states not recreated. |
| Account types, Axi Select, promotions | Existing Accounts, Select and Promotions views | Mapped, not visually verified page by page. |
| Academy, Blog, Tools, VPS, Economic Calendar | Existing corresponding views | Mapped, not visually verified page by page. Article and lesson detail inventory incomplete. |
| Partnerships and sponsorship | Existing Partners and About views | Mapped, not visually verified; no complete sponsorship microsite. |
| Company, Legal, Help Centre | Existing About, Legal and Support views | Mapped, not visually verified; individual legal documents and help articles not mirrored. |
| Login and sign-up | Existing account flow | Dialog entrance verified above; complete login/signup journey and provider-specific steps not verified against the reference. |
| Dashboard, funding, settings, admin | Existing private workspaces | Outside the public site inventory; not claimed as matched. |

## Asset substitutions and sign-off

Manrope and Inter substitute for Axi Saans. Campaign videos are represented by stills with motion. Some images are served from the reference CDN with bundled fallbacks; regional content and availability were not verified. Before calling this complete, capture both sites at the same desktop and mobile sizes, inventory all public URLs and states, review asset rights, and mark differences against approved screenshots for each route.
