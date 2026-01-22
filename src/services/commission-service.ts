export interface CommissionCalculation {
  agreedPrice: number; // Anlaşılan fiyat
  commissionRate: 0.01; // %1 sabit
  commissionAmount: number; // Komisyon tutarı
  nakliyeciReceives: number; // Nakliyeci alacağı
  YolNextReceives: number; // YolNext alacağı
}

export interface PaymentFlow {
  stage: 'payment' | 'escrow' | 'release' | 'completed';
  amount: number;
  commission: number;
  netAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export class CommissionService {
  private static readonly COMMISSION_RATE = 0.01; // %1 sabit

  /**
   * Komisyon hesaplama - Sadece nakliyeci'den %1
   */
  static calculateCommission(agreedPrice: number): CommissionCalculation {
    const commissionAmount = agreedPrice * this.COMMISSION_RATE;
    const nakliyeciReceives = agreedPrice - commissionAmount;
    const YolNextReceives = commissionAmount;

    return {
      agreedPrice,
      commissionRate: this.COMMISSION_RATE,
      commissionAmount,
      nakliyeciReceives,
      YolNextReceives,
    };
  }

  /**
   * Ödeme akışı - Basit sistem
   */
  static createPaymentFlow(agreedPrice: number): PaymentFlow[] {
    const commission = this.calculateCommission(agreedPrice);

    return [
      {
        stage: 'payment',
        amount: agreedPrice,
        commission: 0, // Gönderen hiç komisyon ödemez
        netAmount: agreedPrice,
        status: 'pending',
      },
      {
        stage: 'escrow',
        amount: agreedPrice,
        commission: 0,
        netAmount: agreedPrice,
        status: 'processing',
      },
      {
        stage: 'release',
        amount: commission.nakliyeciReceives,
        commission: commission.commissionAmount, // Sadece nakliyeci'den kesilir
        netAmount: commission.nakliyeciReceives,
        status: 'pending',
      },
      {
        stage: 'completed',
        amount: commission.nakliyeciReceives,
        commission: commission.commissionAmount,
        netAmount: commission.nakliyeciReceives,
        status: 'completed',
      },
    ];
  }

  /**
   * Komisyon oranını getir
   */
  static getCommissionRate() {
    return `${this.COMMISSION_RATE * 100}%`; // %1
  }

  /**
   * Toplam komisyon hesaplama (aylık)
   */
  static calculateMonthlyCommission(
    transactions: Array<{ agreedPrice: number }>
  ) {
    let totalCommission = 0;
    let totalVolume = 0;

    transactions.forEach(transaction => {
      const commission = this.calculateCommission(transaction.agreedPrice);
      totalCommission += commission.commissionAmount;
      totalVolume += transaction.agreedPrice;
    });

    return {
      totalCommission,
      totalVolume,
      averageRate: totalVolume > 0 ? (totalCommission / totalVolume) * 100 : 0,
      transactionCount: transactions.length,
    };
  }

  /**
   * Komisyon örnekleri
   */
  static getCommissionExamples() {
    const examples = [100, 500, 1000, 5000, 10000];

    return examples.map(price => {
      const commission = this.calculateCommission(price);
      return {
        agreedPrice: price,
        nakliyeciReceives: commission.nakliyeciReceives,
        YolNextCommission: commission.commissionAmount,
        percentage: '1%',
      };
    });
  }
}

export default CommissionService;
