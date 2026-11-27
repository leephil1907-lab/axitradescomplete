import type { ViewType } from '../types';

export const productRoutes = {
  cfds: '/int/trade/cfds',
  perpetuals: '/int/trade/perpetual-futures',
  spot: '/int/trade/cryptocurrencies/spot',
} as const;
export type ProductView = keyof typeof productRoutes;
export const isProductView = (view: ViewType): view is ProductView => Object.prototype.hasOwnProperty.call(productRoutes, view);
export function productFromPath(path: string): ProductView | undefined {
  return (Object.keys(productRoutes) as ProductView[]).find(view => productRoutes[view] === path.replace(/\/$/, ''));
}

const pageRoutes: Partial<Record<ViewType, string>> = {
  home: '/', login: '/login', accounts: '/signup', admin: '/admin',
  markets: '/markets', platforms: '/platforms', tools: '/tools', about: '/about',
  select: '/select', blog: '/insights', support: '/support', legal: '/legal',
  academy: '/academy', partners: '/partners', promotions: '/promotions',
  forex_vps: '/forex-vps', economic_calendar: '/economic-calendar',
  dashboard: '/dashboard', funds: '/funds', settings: '/settings',
};
export function viewFromPath(path: string): ViewType {
  const clean = path.replace(/\/$/, '') || '/';
  return productFromPath(clean) ?? (Object.keys(pageRoutes) as ViewType[]).find(view => pageRoutes[view] === clean) ?? 'home';
}
export function pathForView(view: ViewType): string | undefined {
  return isProductView(view) ? productRoutes[view] : pageRoutes[view];
}
