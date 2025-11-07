import React, { useEffect, useMemo, useRef, useState } from 'react';
import { electronAPI } from '../lib/electronAPI.ts';
import getFormattedPrice from '../lib/getFormattedPrice.ts';
import { StaticImage } from '../components/AssetImage';
import type { Asset } from '../../types/asset';
import type { RebalanceAction } from '../../types/action';
import { rebalancePortfolio } from '../lib/rebalancePortfolio.ts';
import PortfolioHeader from '../components/PortfolioHeader';
import AssetsTable from '../components/AssetsTable';
import PieDistribution from '../components/PieDistribution';
import PastPerformance from '../components/PastPerformance';
import RadarComparison from '../components/RadarComparison';
import ModeToggle from '../components/ModeToggle';
import ContributionInput from '../components/ContributionInput';
import ActionCards from '../components/ActionCards';


export default function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [optimalWeights, setOptimalWeights] = useState<number[]>([]);
  const [portfolioName, setPortfolioName] = useState<string>('My Portfolio');
  const [dateCreated, setDateCreated] = useState<string | null>(null);
  const [country, setCountry] = useState<string>('');
  const [showShares, setShowShares] = useState<boolean>(false);
  const [allowSells, setAllowSells] = useState<boolean>(true);
  const [contribution, setContribution] = useState<string>('');
  const [actions, setActions] = useState<RebalanceAction[]>([]);

  const comparisonBoxRef = useRef<HTMLDivElement>(null);

  const hasHoldings = useMemo(() => assets.some(a => (a.quantity || 0) > 0), [assets]);
  const effectiveAllowSells = hasHoldings ? allowSells : false;

  useEffect(() => {
    const bodyClasses = [
      'min-h-[100vh]',
      'bg-gradient-to-br',
      'from-dark-slate-blue',
      'to-denim-blue',
      'to-[106%]',
      'bg-no-repeat',
    ];
    document.body.classList.add(...bodyClasses);

    (async () => {
      const w = (await electronAPI.store.get('weights')) as number[];
      setOptimalWeights(w ?? []);

      const creationDate = await electronAPI.store.get('creationDate');
      setDateCreated(creationDate ? String(creationDate).replaceAll('-', '.') : null);

      const storedName = (await electronAPI.store.get('portfolioName')) as string | null;
      setPortfolioName(storedName ?? 'My Portfolio');

      const invCountry = (await electronAPI.store.get('investment')) as string | null;
      setCountry(invCountry ?? '');

      const a = (await electronAPI.store.get<Asset[]>('assets')) as Asset[] | null;
      setAssets(a ?? []);
    })();

    return () => {
      document.body.classList.remove(...bodyClasses);
    };
  }, []);

  const portfolioValue = useMemo(() => {
    return assets.reduce((sum, asset) => {
      const quantity = asset.quantity || 0;
      const currentPrice = asset.closePrices?.at?.(-1) ?? 0;
      return sum + quantity * currentPrice;
    }, 0);
  }, [assets]);

  const hasVisibleSell = useMemo(() => {
    if (!hasHoldings) return false;
    const hypotheticalActions = rebalancePortfolio(
      assets,
      optimalWeights,
      0,
      true,
      portfolioValue
    );
    return hypotheticalActions.some(a => a.action === 'sell' && a.quantity !== 0 && !Number.isNaN(a.quantity));
  }, [assets, optimalWeights, portfolioValue, hasHoldings]);

  const onContributionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const selectionStart = input.selectionStart ?? input.value.length;
    const rawValue = input.value;
    const digits = rawValue.replace(/\D/g, '');
    const number = parseFloat(digits) / 100 || 0;
    const formatted = getFormattedPrice(number, country, false);
    const diff = formatted.length - rawValue.length;

    setContribution(number === 0 ? '' : formatted);
    requestAnimationFrame(() => {
      try { input.setSelectionRange(Math.max(selectionStart + diff, 0), Math.max(selectionStart + diff, 0)); } catch { void 0; }
    });
    const cash = number;
    const next = rebalancePortfolio(assets, optimalWeights, cash, effectiveAllowSells, portfolioValue);
    setActions(next);
  };


  useEffect(() => {
    if (!assets.length || !optimalWeights.length) return;
    const digitsFromContribution = contribution.replace(/\D/g, '');
    const cash = parseFloat(digitsFromContribution) / 100 || 0;
    const initial = rebalancePortfolio(assets, optimalWeights, cash, effectiveAllowSells, portfolioValue);
    setActions(initial);
  }, [assets, optimalWeights, effectiveAllowSells, portfolioValue, contribution]);

  const noSharesAreSet = useMemo(() => !assets.some(a => (a.quantity || 0) > 0), [assets]);


  return (
    <>

      <div className="max-w-[1224rem] m-auto px-[20rem] relative top-[8rem]">
        <StaticImage className="pt-[22rem] w-[120rem]" src="/common/icons/logo-white.png" alt="Image" />
      </div>
      <div className="mt-[36rem] max-w-[1224rem] m-auto px-[20rem]">
        <div className="portfolio-container border-cloudy-blue border-[1rem] border-solid max-w-[1224rem] min-h-[618rem] bg-white rounded-[8rem]">
          <PortfolioHeader portfolioName={portfolioName} setPortfolioName={setPortfolioName} dateCreated={dateCreated} />
          <div className="flex justify-between items-end mb-[50rem] px-[40rem] min-h-[390rem]">
            <AssetsTable assets={assets} />
            <PieDistribution assets={assets} />
          </div>
        </div>
        <PastPerformance assets={assets} optimalWeights={optimalWeights} />
      </div>
      <div ref={comparisonBoxRef} className="border-cloudy-blue border-[1rem] border-solid max-w-[1180rem] bg-white rounded-[8rem] m-auto">
        <div className="comparison-box">
          <h2 className="text-custom-4xl font-semibold text-dark-three mb-[48rem]">Portfolio comparison</h2>
          <RadarComparison assets={assets} optimalWeights={optimalWeights} showShares={showShares} portfolioValue={portfolioValue} />
          <label className={`form-switch flex items-center ${noSharesAreSet ? 'disabled' : ''}`}>
            <span className="text-custom-lg text-dark-blue-grey-two">Percent</span>
            <input
              type="checkbox"
              className="shares-switch"
              checked={showShares}
              onChange={(e) => setShowShares(e.target.checked)}
            />
            <i className=" m-0" />
            <span className="text-custom-lg text-dark-blue-grey-two">Shares</span>
          </label>
        </div>
      </div>
      <div className="actions pt-[340rem] bg-white mt-[120rem] relative">
        {hasVisibleSell && (
          <ModeToggle allowSells={allowSells} onChange={setAllowSells} />
        )}
        <ContributionInput value={contribution} onChange={onContributionChange} />
      </div>
      <div className="action-list m-auto px-[20rem] bg-white">
        <div className="text-center text-style-19 mb-[56rem] max-w-[479rem] m-auto"> To reach the optimal portfolio, you
          need to buy or sell the following number of shares </div>
        <ActionCards actions={actions} isContributionEmpty={contribution === ''} />
      </div>
    </>
  )
}
