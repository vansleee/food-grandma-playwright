import { brand } from "../../config/brand";

export function GrandmaMark() {
  return (
    <svg className="grandma-mark" viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="31" fill="#f1dfca" />
      <circle cx="32" cy="13" r="9" fill="#ece7de" />
      <path d="M12 34C9 8 55 8 52 34" fill="#ece7de" />
      <ellipse cx="32" cy="33" rx="18" ry="20" fill="#eac3a6" />
      <path
        d="M13 29c2-16 16-20 20-13 8-7 19 1 19 13-8-2-13-6-19-11-5 6-12 9-20 11"
        fill="#faf7ef"
      />
      <g fill="none" stroke="#6a4a38" strokeWidth="2">
        <circle cx="24" cy="33" r="7" />
        <circle cx="41" cy="33" r="7" />
        <path d="M31 32h3M26 45q6 5 12 0" strokeLinecap="round" />
      </g>
      <circle cx="24" cy="33" r="1.5" fill="#6a4a38" />
      <circle cx="41" cy="33" r="1.5" fill="#6a4a38" />
      <path d="M12 63c0-15 40-15 40 0" fill="#a64b36" />
      <path d="M24 56h16v8H24z" fill="#faf7ef" />
    </svg>
  );
}

export default function Brand() {
  return (
    <>
      <GrandmaMark />
      <span className="brand-name">
        Food <span className="brand-accent">Grandma</span>
      </span>
      <i>{brand.chineseName}</i>
    </>
  );
}
