export type RebalanceAction = {
  action: 'buy' | 'sell';
  symbol: string;
  quantity: number;
  color: string;
};
