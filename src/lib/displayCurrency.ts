export type DisplayCurrencyId =
  | 'usd'
  | 'eur'
  | 'gbp'
  | 'jpy'
  | 'cad'
  | 'aud'
  | 'chf'
  | 'cny'
  | 'inr'
  | 'mxn'
  | 'brl'
  | 'krw'
  | 'sgd'
  | 'hkd'
  | 'nzd'
  | 'sek'
  | 'nok'
  | 'dkk'
  | 'pln'
  | 'try';

export type DisplayCurrencyOption = {
  id: DisplayCurrencyId;
  code: string;
  label: string;
  description: string;
};

export const DISPLAY_CURRENCY_OPTIONS: readonly DisplayCurrencyOption[] = [
  {
    id: 'usd',
    code: 'USD',
    label: 'US Dollar',
    description: 'Show balances and amounts in United States dollars.',
  },
  {
    id: 'eur',
    code: 'EUR',
    label: 'Euro',
    description: 'Show balances and amounts in euros.',
  },
  {
    id: 'gbp',
    code: 'GBP',
    label: 'British Pound',
    description: 'Show balances and amounts in pounds sterling.',
  },
  {
    id: 'jpy',
    code: 'JPY',
    label: 'Japanese Yen',
    description: 'Show balances and amounts in Japanese yen.',
  },
  {
    id: 'cad',
    code: 'CAD',
    label: 'Canadian Dollar',
    description: 'Show balances and amounts in Canadian dollars.',
  },
  {
    id: 'aud',
    code: 'AUD',
    label: 'Australian Dollar',
    description: 'Show balances and amounts in Australian dollars.',
  },
  {
    id: 'chf',
    code: 'CHF',
    label: 'Swiss Franc',
    description: 'Show balances and amounts in Swiss francs.',
  },
  {
    id: 'cny',
    code: 'CNY',
    label: 'Chinese Yuan',
    description: 'Show balances and amounts in Chinese yuan.',
  },
  {
    id: 'inr',
    code: 'INR',
    label: 'Indian Rupee',
    description: 'Show balances and amounts in Indian rupees.',
  },
  {
    id: 'mxn',
    code: 'MXN',
    label: 'Mexican Peso',
    description: 'Show balances and amounts in Mexican pesos.',
  },
  {
    id: 'brl',
    code: 'BRL',
    label: 'Brazilian Real',
    description: 'Show balances and amounts in Brazilian reals.',
  },
  {
    id: 'krw',
    code: 'KRW',
    label: 'South Korean Won',
    description: 'Show balances and amounts in South Korean won.',
  },
  {
    id: 'sgd',
    code: 'SGD',
    label: 'Singapore Dollar',
    description: 'Show balances and amounts in Singapore dollars.',
  },
  {
    id: 'hkd',
    code: 'HKD',
    label: 'Hong Kong Dollar',
    description: 'Show balances and amounts in Hong Kong dollars.',
  },
  {
    id: 'nzd',
    code: 'NZD',
    label: 'New Zealand Dollar',
    description: 'Show balances and amounts in New Zealand dollars.',
  },
  {
    id: 'sek',
    code: 'SEK',
    label: 'Swedish Krona',
    description: 'Show balances and amounts in Swedish kronor.',
  },
  {
    id: 'nok',
    code: 'NOK',
    label: 'Norwegian Krone',
    description: 'Show balances and amounts in Norwegian kroner.',
  },
  {
    id: 'dkk',
    code: 'DKK',
    label: 'Danish Krone',
    description: 'Show balances and amounts in Danish kroner.',
  },
  {
    id: 'pln',
    code: 'PLN',
    label: 'Polish Zloty',
    description: 'Show balances and amounts in Polish zloty.',
  },
  {
    id: 'try',
    code: 'TRY',
    label: 'Turkish Lira',
    description: 'Show balances and amounts in Turkish lira.',
  },
] as const;

export const DEFAULT_DISPLAY_CURRENCY_ID: DisplayCurrencyId = 'usd';

/** ISO codes for Frankfurter `to` parameter (excluding USD base). */
export const FIAT_RATE_CODES = DISPLAY_CURRENCY_OPTIONS
  .map((option) => option.code)
  .filter((code) => code !== 'USD');

export function getDisplayCurrencyOption(
  id: DisplayCurrencyId,
): DisplayCurrencyOption | undefined {
  return DISPLAY_CURRENCY_OPTIONS.find((option) => option.id === id);
}
