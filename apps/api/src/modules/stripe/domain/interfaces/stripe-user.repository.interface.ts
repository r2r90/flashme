export interface IStripeUserRepository {
  saveCustomerId(userId: string, customerId: string): Promise<void>;
  findCustomerId(userId: string): Promise<string | null>;
}
