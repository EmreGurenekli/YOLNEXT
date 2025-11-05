// Currency utility exports
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('tr-TR').format(num);
};

