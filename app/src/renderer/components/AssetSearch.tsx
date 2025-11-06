import { useEffect, useRef, useState } from "react";
import fetchAssets from "../lib/fetchAssets";
import type { Asset as AssetTypeBase } from "../../types/asset";

interface AssetSearchProps {
  country: string | null;
  onSelect: (item: AssetTypeBase) => void;
}

export default function AssetSearch({ country, onSelect }: AssetSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<AssetTypeBase[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [inputFocused, setInputFocused] = useState(false);
  const blurTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!query || !country) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    (async () => {
      const data = await fetchAssets(query, country);
      if (active) setSuggestions(data.slice(0, 6));
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [query, country]);

  const handleSelect = (item: AssetTypeBase) => {
    setQuery("");
    setSuggestions([]);
    onSelect(item);
  };

  return (
    <div className="input-wrapper flex justify-center items-center mt-[16%] max-sm:px-[20rem]">
      <div className="relative border-b-[2rem] border-b-solid max-sm:w-full max-sm:px-[20rem]">
        {!loading && (
          <svg className="absolute top-[16rem]" height="29" width="29" viewBox="0 0 29 29">
            <path
              d="m20.833 18.333h-1.316l-.467-.45c2-2.333 3.033-5.516 2.467-8.9-.784-4.633-4.65-8.333-9.317-8.9-7.05-.866-12.983 5.067-12.117 12.117.567 4.667 4.267 8.533 8.9 9.317a10.834 10.834 0 0 0 8.9-2.467l.45.467v1.316l7.084 7.084a1.76 1.76 0 0 0 2.483 0 1.76 1.76 0 0 0 0-2.484zm-10 0a7.49 7.49 0 0 1 -7.5-7.5c0-4.15 3.35-7.5 7.5-7.5s7.5 3.35 7.5 7.5-3.35 7.5-7.5 7.5z"
              fill="#b8c4ce"
            />
          </svg>
        )}

        {loading && (
          <svg className="absolute top-[16rem]" viewBox="0 0 50 50" width="29" height="29">
            <circle
              cx="25"
              cy="25"
              r="20"
              fill="none"
              stroke="#3547a4"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="80 142"
              transform="rotate(-90 25 25)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="-90 25 25"
                to="270 25 25"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        )}

        <input
          ref={inputRef}
          className="typeahead pl-[50rem] w-[808rem] text-custom-3xl h-[60rem] bg-transparent font-[300]"
          type="text"
          placeholder="Enter a company's name or its ticker"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (blurTimeoutRef.current) {
              window.clearTimeout(blurTimeoutRef.current);
              blurTimeoutRef.current = null;
            }
            setInputFocused(true);
          }}
          onBlur={() => {
            // small delay to allow item selection handlers to run first
            blurTimeoutRef.current = window.setTimeout(() => {
              setInputFocused(false);
            }, 100);
          }}
        />

        {suggestions.length > 0 && inputFocused && (
          <div className="tt-menu absolute w-full mt-[4rem] bg-white border rounded shadow-lg z-50">
            {suggestions.map((item) => (
              <div
                key={item.symbol}
                className="tt-suggestion hover:bg-cornflower-blue px-[24rem] py-[10rem] flex items-center justify-between cursor-pointer"
                onMouseDown={() => handleSelect(item)}
              >
                <div className="flex items-center">
                  {item.image ? (
                    <img
                      src={item.image.replace("/vesple/optimalstocks/", "../common/")}
                      alt={item.symbol}
                      className="w-[20rem] h-[20rem] mr-[20rem]"
                    />
                  ) : (
                    <img
                      alt="Image"
                      width={18}
                      className="placeholder w-[20rem] h-[20rem] mr-[20rem]"
                      src="../common/icons/icon-256.png"
                    />
                  )}
                  <div className="w-[119rem] text-custom-lg font-semibold text-dark uppercase">
                    {item.symbol}
                  </div>
                  <div className="text-custom-lg text-dark">{item.name}</div>
                </div>
                <div className="flex items-center justify-end text-right">
                  <div className="text-custom-lg text-dark uppercase">{item.market}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state: show a small dropdown note when no suggestions */}
        {inputFocused && query.trim().length > 0 && !loading && country && suggestions.length === 0 && (
          <div className="tt-menu absolute w-full mt-[4rem] bg-white border rounded shadow-lg z-50">
            <div className="tt-suggestion px-[24rem] py-[12rem] text-custom-lg text-dark cursor-default">
              No assets found
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
