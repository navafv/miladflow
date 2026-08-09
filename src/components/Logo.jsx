import { useId } from "react";

export default function Logo({ className = "w-6 h-6" }) {
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 266 266"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="50"
          y1="210"
          x2="210"
          y2="50"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#02A56A" />
          <stop offset="100%" stopColor="#21F1A8" />
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="56" fill="#171717" />
      <path
        d="M128 54C170 54 196 92 196 138C196 176 172 202 128 202C84 202 60 176 60 138C60 92 86 54 128 54ZM128 78C96 78 84 108 84 138C84 166 100 178 128 178C156 178 172 166 172 138C172 108 160 78 128 78Z"
        fill={`url(#${gradientId})`}
        fillRule="evenodd"
      />
      <path
        d="M128 92C140 108 148 122 148 136C148 150 139 160 128 160C117 160 108 150 108 136C108 122 116 108 128 92Z"
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}
