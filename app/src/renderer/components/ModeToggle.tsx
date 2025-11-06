
interface Props {
  allowSells: boolean;
  onChange: (allowSells: boolean) => void;
}

export default function ModeToggle({ allowSells, onChange }: Props) {
  return (
    <div className="toggle-wrapper flex items-center justify-center -mt-[60rem] mb-[60rem]">
      <label htmlFor="modeToggle" className="relative flex items-center bg-[#e5e7eb] rounded-[50rem] w-[240rem] h-[40rem] p-[8rem] cursor-pointer select-none">
        <input
          type="checkbox"
          id="modeToggle"
          className="hidden peer"
          onChange={(e) => onChange(!e.target.checked)}
          checked={!allowSells}
        />
        <div className="absolute top-[3rem] left-[3rem] h-[calc(100%-6rem)] w-[calc(50%-6rem)] bg-white rounded-[50rem] shadow-sm transition-all duration-300 ease-in-out peer-checked:translate-x-[calc(100%-28rem)] peer-checked:shadow-md peer-checked:scale-95 peer-checked:w-[132rem]" />
        <span className="flex-1 text-center text-[16rem] font-medium text-gray-800 transition-colors duration-300 ease-in-out peer-checked:text-gray-500 relative z-1">
          Trade
        </span>
        <span className="flex-1 text-center text-[16rem] font-medium text-gray-500 transition-colors duration-300 ease-in-out peer-checked:text-gray-800 relative z-1">
          Buy &amp; Hold
        </span>
      </label>
    </div>
  );
}
