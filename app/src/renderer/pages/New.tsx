import { useEffect } from "react";
import { NavLink } from "react-router-dom";

export default function NewPage() {
  useEffect(() => {
    const body = document.body;
    const classes = [
      "min-h-[100vh]",
      "bg-gradient-to-br",
      "from-dark-slate-blue",
      "to-denim-blue",
      "to-[106%]",
      "bg-no-repeat",
    ];
    body.classList.add(...classes);
    return () => body.classList.remove(...classes);
  }, []);

  return (
    <>
      <div className="text-center">
        <img
          className="h-[194rem] w-[152rem] m-auto my-[193rem] mb-[33rem]"
          src="common/icons/splash/cloud.svg"
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
