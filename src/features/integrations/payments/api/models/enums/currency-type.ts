export enum Currency {
  USD = 'usd',
  EUR = 'eur',
  UAH = 'uah',
  RUB = 'rub',
  GEL = 'gel',
  BYN = 'byn',
}

export const conversionRates: Record<Currency, number> = {
  [Currency.USD]: 1,
  [Currency.EUR]: 1.1,
  [Currency.UAH]: 0.027,
  [Currency.RUB]: 0.013,
  [Currency.GEL]: 0.37,
  [Currency.BYN]: 0.4,
};

export enum PaymentSystemEnum {
  Paypal = 'paypal',
  Stripe = 'stripe',
  Tinkoff = 'tinkoff',
  Yandex = 'yandex',
  WebMoney = 'webmoney',
  Qiwi = 'qiwi',
  Robokassa = 'robokassa',
  Paybox = 'paybox',
}
