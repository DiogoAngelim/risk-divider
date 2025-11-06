export interface Asset {
  symbol: string;
  name?: string;
  market?: string;
  image?: string;
  closePrices: number[];
  dailyChange: number[];
  dates: string[];
  quantity?: number;
  currentPrice?: number;
  marketValue?: number;
  weight?: number;
  averageChange?: number;
}
