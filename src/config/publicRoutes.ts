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

const accountRoutes = { login: '/login', accounts: '/signup' } as const;
export function viewFromPath(path: string): ViewType {
  const clean = path.replace(/\/$/, '');
  if (clean === '/admin') return 'admin';
  if (clean === accountRoutes.login) return 'login';
  if (clean === accountRoutes.accounts) return 'accounts';
  return productFromPath(clean) ?? 'home';
}
export function pathForView(view: ViewType): string | undefined {
  if (view === 'login' || view === 'accounts') return accountRoutes[view];
  if (view === 'admin') return '/admin';
  if (isProductView(view)) return productRoutes[view];
}
