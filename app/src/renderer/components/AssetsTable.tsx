import type { Asset } from '../../types/asset';
import AssetImage from './AssetImage';

interface Props {
  assets: Asset[];
}

export default function AssetsTable({ assets }: Props) {
  return (
    <table>
      <thead className="border-b-solid  border-b-[1rem]">
        <tr className="text-left h-[60rem]">
          <th className="uppercase w-[60rem]" />
          <th className="uppercase  w-[126rem] text-style-5">Symbol</th>
          <th className="uppercase text-style-5 pr-[40rem]">Name</th>
          <th className="uppercase text-style-5 text-right">Shares</th>
        </tr>
      </thead>
      <tbody className="assets-table">
        {assets.map((asset, idx) => {
          const name = String(asset.name || '')
            .toLowerCase()
            .split(' ')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');
          return (
            <tr key={idx}>
              <td className="py-[14rem] w-[60rem] h-[45rem]">
                <AssetImage
                  src={asset.image}
                  alt="Image"
                  width={18}
                  className={asset.image ? "" : "placeholder"}
                  isAssetImage={true}
                />
              </td>
              <td className="text-[18rem] uppercase w-[126rem] font-[500]">{asset.symbol}</td>
              <td className="text-style-6 pr-[40rem]">{name}</td>
              <td className="text-style-6 text-[18rem] text-right">
                <div>{asset.quantity}</div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
