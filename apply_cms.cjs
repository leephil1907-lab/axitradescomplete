const fs = require('fs');

// 1. HomeView.tsx
let homeCode = fs.readFileSync('src/components/HomeView.tsx', 'utf8');

if (!homeCode.includes('import { useSiteCMS }')) {
  homeCode = "import { useSiteCMS } from '../hooks/useSiteCMS';\n" + homeCode;
}

homeCode = homeCode.replace(
  "function MobileAppPreview(",
  "function MobileAppPreview("
);

homeCode = homeCode.replace(
  "export default function HomeView({ quotes, setView, openSignUp }: HomeViewProps) {",
  "export default function HomeView({ quotes, setView, openSignUp }: HomeViewProps) {\n  const { cmsContent } = useSiteCMS();"
);

homeCode = homeCode.replace(
  "A winning partnership",
  "{cmsContent.home.partnershipTitle}"
);
homeCode = homeCode.replace(
  "We're proud to be Official Online Trading Partner of Manchester City Football Club.",
  "{cmsContent.home.partnershipSubtitle}"
);
homeCode = homeCode.replace(
  "Ready to trade your edge?",
  "{cmsContent.home.preFooterTitle}"
);
homeCode = homeCode.replace(
  "Join thousands of traders choosing Axi.",
  "{cmsContent.home.preFooterSubtitle}"
);

fs.writeFileSync('src/components/HomeView.tsx', homeCode);


// 2. HeroSlideshow.tsx
let heroCode = fs.readFileSync('src/components/axi/HeroSlideshow.tsx', 'utf8');
if (!heroCode.includes('import { useSiteCMS }')) {
  heroCode = "import { useSiteCMS } from '../../hooks/useSiteCMS';\n" + heroCode;
}
heroCode = heroCode.replace(
  "export default function HeroSlideshow() {",
  "export default function HeroSlideshow() {\n  const { cmsContent } = useSiteCMS();"
);

// We need to inject cmsContent to SLIDES. But SLIDES is defined outside the component.
// We can modify the component to override slide-0
const overrideSlideCode = `
  const activeSlides = [...SLIDES];
  if (cmsContent) {
    activeSlides[0] = {
      ...activeSlides[0],
      title: cmsContent.home.heroTitle,
      subtitle: cmsContent.home.heroSubtitle,
      cta: cmsContent.home.ctaText
    };
  }
`;

heroCode = heroCode.replace(
  "const [currentSlide, setCurrentSlide]",
  overrideSlideCode + "\n  const [currentSlide, setCurrentSlide]"
);
heroCode = heroCode.replace(
  "SLIDES[currentSlide]",
  "activeSlides[currentSlide]"
);
heroCode = heroCode.replace(
  "SLIDES.length",
  "activeSlides.length"
);
heroCode = heroCode.replace(
  "SLIDES.map(",
  "activeSlides.map("
);

fs.writeFileSync('src/components/axi/HeroSlideshow.tsx', heroCode);

console.log('Applied CMS to HomeView and HeroSlideshow');

