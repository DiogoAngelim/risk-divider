type PriceInput = number | string;

const localeMap = {
  AU: 'en-AU',
  BR: 'pt-BR',
  CA: 'en-CA',
  CH: 'de-CH',
  CN: 'zh-CN',
  DE: 'de-DE',
  HK: 'zh-HK',
  IN: 'en-IN',
  JP: 'ja-JP',
  KSA: 'ar-SA',
  UK: 'en-GB',
  US: 'en-US',
} as const;

const currencyMap = {
  AU: 'AUD',
  BR: 'BRL',
  CA: 'CAD',
  CH: 'CHF',
  CN: 'CNY',
  DE: 'EUR',
  HK: 'HKD',
  IN: 'INR',
  JP: 'JPY',
  KSA: 'SAR',
  UK: 'GBP',
  US: 'USD',
} as const;

export default function getFormattedPrice(
  value: PriceInput,
  country: string,
  includeSign: boolean = true
): string {
  const locale = (localeMap as Record<string, string>)[country] || 'en-US';
  const currency = (currencyMap as Record<string, string>)[country] || 'USD';
  const style: Intl.NumberFormatOptions['style'] = includeSign ? 'currency' : 'decimal';

  const options: Intl.NumberFormatOptions = includeSign
    ? { style, currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { style, minimumFractionDigits: 2, maximumFractionDigits: 2 };

  return Number(value).toLocaleString(locale, options);
}
