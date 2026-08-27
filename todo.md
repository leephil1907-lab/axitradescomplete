# TODO — Carousel Images, Slanty Menu, Live Prices & Crypto Logos

## Phase 1: Replace Carousel Slide Images with User Uploads
- [x] Identified 5 uploaded images and mapped them to the 5 HeroSlideshow slides
- [x] Optimize the 5 images (resize 1536x1024, compress) into src/assets/images/
- [x] Update HeroSlideshow.tsx SLIDES array titles (subtitles emptied to avoid duplicate text)
- [x] Soften gradient overlay + add text drop-shadows for readability over baked-in image text
- [x] Made subtitle conditional render; removed CMS subtitle override to prevent duplication
- [x] Verify tsc passes (zero errors)

## Phase 2: Slanty (Diagonal) Hamburger Menu like axi.com
- [x] Inspected axi.com hamburger SVG (aria-label "handle open mobile menu", viewBox 0 0 21 18)
- [x] Created AxiHamburgerIcon.tsx — 3 staggered/decreasing-length bars (slanted staircase) + open/close animation
- [x] Replaced lucide Menu icon in Header.tsx with AxiHamburgerIcon
- [x] Removed unused Menu import
- [x] Verify tsc passes (zero errors)

## Phase 3: Live Price Updates + Crypto/Asset Brand Logos
- [x] Audit liveMarketFeed service for real price fetching (Kraken/Coinbase/Yahoo) — confirmed working
- [x] Verify Market Watch / quotes table updates in real time — server polls Kraken+Coinbase+er-api+Yahoo, client polls /api/markets/quotes every 1800ms + Coinbase WebSocket
- [x] Audit AssetBrandLogo component — all 17 crypto + stablecoins + commodities + forex + indices + equities have correct brand colors & SVG icons
- [x] Ensure all crypto/forex/commodity/indices icons resolve correctly — verified all mappings

## Phase 4: Build, Commit, Push, Preview
- [x] npx tsc --noEmit zero errors
- [x] npm run build success
- [ ] Commit + push to GitHub
- [ ] Start preview server + expose URL
- [ ] Present results to user via 'ask'
