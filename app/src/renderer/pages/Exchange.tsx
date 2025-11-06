import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CountriesSelector from "../components/CountriesSelector";

interface CountryData {
  emoji: string;
  value: string;
  label: string;
}

interface Country extends CountryData {
  checked: boolean;
}

export default function ExchangePage() {
  const countriesData = useMemo<CountryData[]>(() => [
    { emoji: "🇺🇸", value: "US", label: "United States" },
    { emoji: "🇬🇧", value: "UK", label: "United Kingdom" },
    { emoji: "🇩🇪", value: "DE", label: "Germany" },
    { emoji: "🇮🇳", value: "IN", label: "India" },
    { emoji: "🇸🇦", value: "KSA", label: "Saudi Arabia" },
    { emoji: "🇨🇦", value: "CA", label: "Canada" },
    { emoji: "🇯🇵", value: "JP", label: "Japan" },
    { emoji: "🇭🇰", value: "HK", label: "Hong Kong" },
    { emoji: "🇨🇳", value: "CH", label: "China" },
    { emoji: "🇧🇷", value: "BR", label: "Brazil" },
    { emoji: "🏦", value: "forex", label: "Forex" },
    { emoji: "🚀", value: "crypto", label: "Crypto" },
  ], []);

  const [countries, setCountries] = useState<Country[]>(
    countriesData.map((c) => ({ ...c, checked: false }))
  );
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      document.body.classList.remove("current-tab__assets", "current-tab__portfolio");
      document.body.classList.add("current-tab__investment");

      if (!window.electronAPI) return;

      const storedCountry = await window.electronAPI.store.get<string>("investment");
      const countryValue = storedCountry || null;

      setSelectedCountry(countryValue);
      setCountries(
        countriesData.map((c) => ({
          ...c,
          checked: c.value === countryValue,
        }))
      );
    }

    init();
  }, [countriesData]);

  const handleCountrySelect = (value: string) => {
    setSelectedCountry(value);
    setCountries((prev) =>
      prev.map((c) => ({ ...c, checked: c.value === value }))
    );
  };

  const navigate = useNavigate();

  const handleLinkClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    await handleSubmit();
    navigate("/assets");
  };

  const handleSubmit = async () => {
    if (!selectedCountry || !window.electronAPI) return;

    const prev = await window.electronAPI.store.get<string>("investment");

    if (selectedCountry === prev) {
      return;
    }

    await window.electronAPI.store.delete("weights");
    await window.electronAPI.store.delete("assets");
    await window.electronAPI.store.set("investment", selectedCountry);
  };

  return (
    <section className="splash-screen pb-[60rem]">
      <div className="flex justify-end w-full pr-[20rem] pt-[20rem]">
        <button type="button" id="splash-close" aria-label="Close splash">
          <svg
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#202020"
            className="w-[35rem] h-[35rem]"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="profile-wrapper">
        <div id="splash-form">
          <div className="splash-step pb-[80rem] flex-col items-center max-w-[1100rem] rem-[20rem] m-auto">
            <h1 className="max-w-[1000rem] text-[40rem] leading-[48rem] mt-[130rem] text-center m-auto">
              Which market will you invest in?
            </h1>

            <CountriesSelector countries={countries} onSelect={handleCountrySelect} />

            <div className="text-center">
              <Link
                to="/assets"
                onClick={handleLinkClick}
                className={`investment-submit-button inline-block m-auto border-iris-two border-[1px] border-solid rounded-[30rem] px-[48rem] py-[17rem] text-iris-two text-[14rem] font-bold hover:border-[#95aeed] active:border-cloudy-blue uppercase ${!selectedCountry ? "disabled opacity-50 pointer-events-none" : ""
                  }`}
              >
                continue
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
