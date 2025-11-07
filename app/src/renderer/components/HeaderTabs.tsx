import { NavLink, useLocation } from "react-router-dom"
import { useEffect, useRef } from "react";
import { electronAPI } from "../lib/electronAPI";

export default function HeaderTabs() {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const location = useLocation();

  const getNextPagePath = () => {
    switch (location.pathname) {
      case '/profile':
        return '/assets';
      case '/assets':
        return '/portfolio';
      case '/portfolio':
        return '/dashboard';
      default:
        return '/dashboard';
    }
  };

  useEffect(() => {
    try {
      document.querySelectorAll(".steps-close-button").forEach((el) => {
        if (el !== closeBtnRef.current) {
          el.parentElement?.removeChild(el);
        }
      });
    } catch {
      void 0;
    }
  }, []);
  return (
    <div className="fixed header-wrapper top-0 left-0 w-full z-[100] bg-white">
      <div className="flex justify-between h-[64rem] border-b-pale-grey-two border-b-solid border-b-[1rem]">
        <div className="flex">
          <button
            type="button"
            ref={closeBtnRef}
            onClick={() => electronAPI.quit()}
            className="no-smoothState steps-close-button cursor-pointer flex justify-center items-center w-[72rem] h-full border-r-pale-grey-two border-r-solid border-r-[1rem]"
            aria-label="Quit"
            title="Quit"
          >
            <svg height="14" width="14" viewBox="0 0 14 14">
              <g fill="none" fillRule="evenodd">
                <path d="m-5-5h24v24h-24z" />
                <path
                  d="m13.3.71a.996.996 0 0 0 -1.41 0l-4.89 4.88-4.89-4.89a.996.996 0 1 0 -1.41 1.41l4.89 4.89-4.89 4.89a.996.996 0 1 0 1.41 1.41l4.89-4.89 4.89 4.89a.996.996 0 1 0 1.41-1.41l-4.89-4.89 4.89-4.89c.38-.38.38-1.02 0-1.4z"
                  fill="#b8c4ce"
                />
              </g>
            </svg>
          </button>

          <NavLink
            to="/profile"
            className="w-[207rem] tab text-style-5 tab__investment border-r-pale-grey-two border-r-solid border-r-[1rem] flex items-center justify-center gap-spacing-xxs"
          >
            <svg height="18" width="11" viewBox="0 0 11 18">
              <g fill="none" fillRule="evenodd">
                <path d="m-6-3h24v24h-24z" />
                <path
                  d="m5.8 7.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81v-2.19h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83v2.17h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"
                  fill="#b8c4ce"
                />
              </g>
            </svg>
            <span className="uppercase text-dark-two">exchange</span>
          </NavLink>

          <NavLink
            to="/assets"
            className="w-[207rem] tab text-style-5 tab__assets border-r-pale-grey-two border-r-solid border-r-[1rem] flex items-center justify-center gap-spacing-xxs"
          >
            <svg height="18" width="18" viewBox="0 0 18 18">
              <g fill="none">
                <path d="m-5-5h28v28h-28z" />
                <circle cx="4.463" cy="4.463" fill="#b8c4ce" r="3.63" />
                <circle cx="4.463" cy="13.537" fill="#212934" r="3.63" />
                <circle cx="13.537" cy="13.537" r="3.63" stroke="#212934" />
                <circle cx="13.537" cy="4.463" fill="#212934" r="3.63" />
              </g>
            </svg>
            <span className="uppercase text-dark-two">assets</span>
          </NavLink>

          <NavLink
            to="/portfolio"
            className={({ isActive }) => `w-[207rem] tab text-style-5 tab__portfolio border-r-pale-grey-two border-r-solid border-r-[1rem] flex items-center justify-center gap-spacing-xxs ${isActive ? 'active' : ''}`}
          >
            <svg height="18" width="18" viewBox="0 0 18 18">
              <g fill="none" fillRule="evenodd">
                <path d="m-5-5h28v28h-28z" />
                <path
                  d="m2.467 5.733h.233c.898 0 1.633.735 1.633 1.634v8.166c0 .899-.735 1.634-1.633 1.634h-.233a1.638 1.638 0 0 1 -1.634-1.634v-8.166c0-.899.735-1.634 1.634-1.634zm6.533-4.9c.898 0 1.633.735 1.633 1.634v13.066c0 .899-.735 1.634-1.633 1.634a1.638 1.638 0 0 1 -1.633-1.634v-13.066c0-.899.735-1.634 1.633-1.634zm6.533 9.334c.899 0 1.634.735 1.634 1.633v3.733c0 .899-.735 1.634-1.634 1.634a1.638 1.638 0 0 1 -1.633-1.634v-3.733c0-.898.735-1.633 1.633-1.633z"
                  fill="#b8c4ce"
                  fillRule="nonzero"
                />
              </g>
            </svg>
            <span className="uppercase text-dark-two">portfolio</span>
          </NavLink>
        </div>

        <NavLink
          to={getNextPagePath()}
          className="next-page hover:bg-iris active:bg-[#758ce0] rounded-bl-[30rem] bg-denim-blue flex gap-spacing-xs items-center justify-center w-[255rem] pl-[20rem] max-md:hidden"
        >
          <>
            <span className="text-style-18">Next</span>
          </>
          <svg height="28" width="28" viewBox="0 0 28 28">
            <g fill="none" fillRule="evenodd">
              <circle cx="14" cy="14" fill="#1e2c6d" r="14" />
              <path
                d="m11.293 8.294a.996.996 0 0 0 0 1.41l3.88 3.88-3.88 3.88a.996.996 0 1 0 1.41 1.41l4.59-4.59a.996.996 0 0 0 0-1.41l-4.59-4.59c-.38-.38-1.02-.38-1.41.01z"
                fill="#fff"
              />
              <path d="m2 2h24v24h-24z" />
            </g>
          </svg>
        </NavLink>
      </div>
    </div>
  );
}
