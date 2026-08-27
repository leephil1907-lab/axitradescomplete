# TODO — AXI Images, Tawk Avatar, Carousel Text Fix, Deployment Solution

## Phase 1: Fix Carousel Text Duplication
- [x] Inspected HeroSlideshow.tsx — images have baked-in text + overlay rendered title/subtitle/badge
- [x] Removed all overlay text except CTA button; images speak for themselves
- [x] Verify with build + screenshot

## Phase 2: Fix Tawk.to Avatar with Axi Logo
- [x] Created Axi avatar PNG (red bg, white "axi") + set profilePicture attribute in tawkto.ts onLoad
- [x] Added CSS override for Tawk.to avatar elements + replaced launcher icon with AxiLogo component
- [x] Verify in build

## Phase 3: Add AXI.com Images to Website
- [x] Downloaded AXI official images from media.axiglobal.net (6 content images + 11 symbol SVGs)
- [x] Replaced external desktop MT4 image with AxiDesktopHeroImg
- [x] Replaced external education webinar image with AxiIndicesSceneImg
- [x] Added AxiManCityLogo SVG to ManCity partnership section
- [x] Added new "Axi Mobile App" section using AxiMobileAppImg
- [x] Verify in build

## Phase 4: Deployment Solution (Vercel 100% error rate)
- [x] Diagnosed: Express.js server is persistent; Vercel is serverless — no serverless fn file exists
- [ ] Provide working deployment solution to user (Railway/Render/Fly.io/Cloud Run)
- [ ] Present deployment guidance in final ask

## Phase 5: Build, Commit, Push, Preview
- [x] tsc --noEmit zero errors
- [x] npm run build success
- [ ] Commit + push to GitHub
- [ ] Start preview server + expose URL
- [ ] Present results to user via 'ask'
