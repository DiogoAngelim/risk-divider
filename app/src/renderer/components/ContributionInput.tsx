import React from 'react';

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ContributionInput({ value, onChange }: Props) {
  return (
    <div className="input-wrapper flex justify-center items-center">
      <div className="relative border-b-[2rem] border-b-solid mb-[50rem]">
        <svg className="absolute top-[16rem] max-sm:h-[20px] max-sm:w-[20px] max-sm:top-[20px]" height="29" viewBox="0 0 18 18" width="24">
          <g fill="none" fillRule="evenodd">
            <path d="m-6-3h24v24h-24z" />
            <path d="m5.8 7.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81v-2.19h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83v2.17h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" fill="#b8c4ce" />
          </g>
        </svg>
        <input
          className="pl-[30rem] w-[324rem] text-[22rem] h-[60rem] bg-transparent max-sm:text-[16px] max-sm:pl-[30rem] font-[300] text-right pr-[20rem]"
          type="text"
          placeholder="Enter your next contribution"
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}
