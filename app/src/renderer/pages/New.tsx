import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { StaticImage } from '../components/AssetImage';

export default function New() {
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

    return () => document.body.classList.remove(...bodyClasses);
  }, []);

  return (
    <>
      <div className="text-center">
        <StaticImage
          className="h-[194rem] w-[152rem] m-auto my-[193rem] mb-[33rem]"
          src="/common/icons/splash/cloud.svg"
          alt="Image"
        />
        <div className="w-[320rem] m-auto text-center text-white text-custom-lg leading-tight mb-[32rem]">
          Make informed and strategic stock investing choices, actively nurture your financial well-being, and work towards achieving a state of prosperity.
        </div>
        <NavLink
          to="/profile"
          className="text-center inline-block m-auto border-white border-[1px] border-solid rounded-[80rem] px-[48rem] py-[17rem] text-white text-[14rem] font-bold hover:border-[#95aeed] active:border-cloudy-blue uppercase"
        >
          Create portfolio
        </NavLink>
      </div>
    </>
  );
}
