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
