const fs = require('fs');
let code = fs.readFileSync('src/components/SupportView.tsx', 'utf8');

if (!code.includes('import { useSiteCMS }')) {
  code = "import { useSiteCMS } from '../hooks/useSiteCMS';\n" + code;
}

code = code.replace(
  "export default function SupportView() {",
  "export default function SupportView() {\n  const { cmsContent } = useSiteCMS();"
);

code = code.replace(
  "customersupport@axitrades.com",
  "{cmsContent.brand.contactEmail}"
);

fs.writeFileSync('src/components/SupportView.tsx', code);
console.log('Fixed SupportView CMS');
