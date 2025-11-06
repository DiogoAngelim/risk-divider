import type { Asset } from '../../types/asset';
import type { RebalanceAction } from '../../types/action';
export function rebalancePortfolio(
  assets: Asset[],
  targetWeights: number[],
  cash: number,
  allowSells: boolean,
  portfolioValue: number,
): RebalanceAction[] {
  cash = Number(cash) || 0;
  const normalized = assets.map(a => {
    const price = Number(a.closePrices?.at?.(-1)) || 0;
    const quantity = Number(a.quantity) || 0;
    const weight = Number(a.weight) || 0;
    return { ...a, price, quantity, weight };
  });
  const hasAnyHoldings = normalized.some(a => a.quantity > 0);
  const out: RebalanceAction[] = [];

  if (!hasAnyHoldings) {
    normalized.forEach((a, i) => {
      if (a.price <= 0) return;
      const allocation = cash * ((Number(targetWeights[i]) || 0));
      const quantity = Math.floor(allocation / a.price);
      if (quantity <= 0) return;
      out.push({ action: 'buy', symbol: a.symbol, quantity, color: 'bg-[#65ba8a]' });
    });
    return out;
  }

  if (allowSells) {
    const totalValue = portfolioValue + cash;
    const targetValues = targetWeights.map(w => (Number(w) || 0) * totalValue);
    const currentValues = normalized.map(a => a.price * a.quantity);
    normalized.forEach((a, i) => {
      if (a.price <= 0) return;
      const diff = targetValues[i] - currentValues[i];
      const quantity = Math.floor(Math.abs(diff) / a.price);
      if (quantity <= 0) return;
      const action = diff > 0 ? 'buy' : 'sell';
      out.push({ action, symbol: a.symbol, quantity, color: action === 'buy' ? 'bg-[#65ba8a]' : 'bg-[#cd6262]' });
    });
  } else {
    const targetValues = targetWeights.map(w => (Number(w) || 0) * (cash + 0));
    const currentValues = normalized.map(a => a.price * a.quantity);
    const buyValues = targetValues.map((t, i) => {
      const diff = t - currentValues[i];
      return diff > 0 ? diff : 0;
    });
    const totalBuy = buyValues.reduce((sum, v) => sum + v, 0);
    const scale = totalBuy > 0 ? Math.min(1, cash / totalBuy) : 0;
    normalized.forEach((a, i) => {
      if (a.price <= 0) return;
      const allocation = buyValues[i] * scale;
      const quantity = Math.floor(allocation / a.price);
      if (quantity <= 0) return;
      out.push({ action: 'buy', symbol: a.symbol, quantity, color: 'bg-[#65ba8a]' });
    });
  }

  return out;
}
