import { RouterPaths } from '../../../src/infra/utils/routing';

export class PaymentsRouting {
  constructor(private readonly baseUrl = RouterPaths.integrations.stripe) {}
  handleSuccessPayment = () => `${this.baseUrl}/membership/success`;
  handleFailedPayment = () => `${this.baseUrl}/membership/failed`;
  forPaymentsHook = () => `${this.baseUrl}/webhook`;
  createProducts = (blogId: string) => `${this.baseUrl}/${blogId}/products`;
}
