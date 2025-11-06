import { Link } from 'react-router-dom';
import { electronAPI } from '../lib/electronAPI.ts';

interface Props {
  portfolioName: string;
  setPortfolioName: (name: string) => void;
  dateCreated: string | null;
}

export default function PortfolioHeader({ portfolioName, setPortfolioName, dateCreated }: Props) {
  return (
    <div className="flex justify-between items-center mb-[20rem] py-[48rem] px-[40rem]">
      <div className="flex items-center gap-spacing-l">
        <div
          className="portfolio-name text-style-3"
          contentEditable
          suppressContentEditableWarning
          onBlur={async (e) => {
            const content = e.currentTarget.textContent?.trim() || 'My Portfolio';
            setPortfolioName(content);
            await electronAPI.store.set('portfolioName', content);
            if (!content) e.currentTarget.textContent = 'My Portfolio';
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          onPaste={(e) => {
            e.preventDefault();
            const text = (e.clipboardData ?? (window as unknown as { clipboardData?: DataTransfer }).clipboardData)?.getData('text')?.replace(/\n/g, ' ').trim() ?? '';
            document.execCommand('insertText', false, text);
          }}
        >{portfolioName}</div>
        <div className="date-created border-cloudy-blue border-[1rem] border-solid px-[24rem] py-[5rem] text-style-4 rounded-[80rem]">{dateCreated ?? ''}</div>
      </div>
      <div className="flex items-center gap-spacing-xl">
        <Link to="/assets" className="no-smoothState text-[14rem] text-white rounded-[80rem] bg-denim-blue px-[24rem] py-[13rem] text-center uppercase font-bold hover:bg-iris active:bg-cornflower-blue">update portfolio</Link>
      </div>
    </div>
  );
}
