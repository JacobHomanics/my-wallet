import { APP_NAME, APP_TAGLINE } from '@/lib/brand';

export function useAppBrand() {
  return {
    name: APP_NAME,
    tagline: APP_TAGLINE,
  };
}
