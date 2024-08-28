import {
  conversionRates,
  Currency,
} from '../../features/integrations/payments/api/models/enums/currency-type';

export const convertToCents = (amount: number, currency: Currency) => {
  const rate = conversionRates[currency];
  if (!rate) {
    throw new Error(`Conversion rate not found for currency: ${currency}`);
  }
  const amountInUSD = amount / rate;
  return Math.round(amountInUSD * 100);
};
