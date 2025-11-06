import type { RebalanceAction } from '../../types/action';

interface Props {
  actions: RebalanceAction[];
  isContributionEmpty?: boolean;
}

export default function ActionCards({ actions, isContributionEmpty = false }: Props) {
  const visibleActions = actions.filter((item) => item.quantity !== 0 && !Number.isNaN(item.quantity));


  const hasSellVisible = visibleActions.some((a) => a.action === 'sell');
  const actionsToRender = isContributionEmpty && !hasSellVisible
    ? visibleActions.filter((a) => a.action !== 'buy')
    : visibleActions;

  return (
    <div className="action-list m-auto px-[20rem] pb-[240rem] bg-white">
      <div className="flex flex-wrap gap-spacing-xl max-w-[808rem] m-auto">
        {actionsToRender.map((item, idx) => (
          <div key={idx} className="h-[160rem] min-w-[184rem] px-[10rem] relative border-cloudy-blue border-[1px] border-solid bg-white rounded-[8rem] flex items-center justify-center">
            <div className={`absolute top-[8rem] left-0 rounded-r-[10rem] ${item.color} w-[59rem] flex items-center justify-center text-white text-style-22 uppercase`}>
              {item.action}
            </div>
            <div className="text-center">
              <div className="text-style-12 uppercase mb-[4rem]">{item.quantity}</div>
              <div className="text-style-6 uppercase">{item.symbol}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
