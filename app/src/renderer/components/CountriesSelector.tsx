
interface Country {
  emoji: string;
  value: string;
  label: string;
  checked: boolean;
}

interface CountriesSelectorProps {
  countries: Country[];
  onSelect: (value: string) => void;
}

export default function CountriesSelector({ countries, onSelect }: CountriesSelectorProps) {
  return (
    <div className="w-[1000rem] mx-auto mt-[50rem] mb-[50rem] text-[22rem] grid-cols-3 grid gap-[30rem]">
      {countries.map((item) => (
        <div key={item.value} className="flex items-center">
          <label
            className={`mr-[20px] text-[32px] border-[1px] border-solid border-[#e1e7eb] marketing-item rounded-[80rem] relative p-[15rem] bg-white h-[75rem] w-[75rem] flex items-center justify-center ${item.checked ? "active" : ""
              }`}
            onClick={() => onSelect(item.value)}
          >
            <input
              type="radio"
              name="country"
              value={item.value}
              className="invisible absolute w-full h-full top-0 left-0"
              checked={item.checked}
              onChange={() => onSelect(item.value)}
            />
            <div />
            {item.emoji}
          </label>
          <p className="opacity-[0.65] text-[18rem] mt-[10rem]">{item.label}</p>
        </div>
      ))}
    </div>
  );
}
