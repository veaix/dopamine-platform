type IconProps = {
  className?: string;
  filled?: boolean;
};

export function HeartIcon({ className, filled = false }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      {filled ? (
        <path
          d="M12 20.25l-1.08-1.004C6.87 15.36 4.5 12.706 4.5 9.75 4.5 7.682 6.182 6 8.25 6c1.072 0 2.07.428 2.813 1.179L12 8.118l.937-1.036A3.96 3.96 0 0116.5 6c2.068 0 3.75 1.682 3.75 3.75 0 2.956-2.37 5.61-6.42 9.496L12 20.25z"
          fill="currentColor"
        />
      ) : (
        <path
          d="M12 20.25l-1.08-1.004C6.87 15.36 4.5 12.706 4.5 9.75 4.5 7.682 6.182 6 8.25 6c1.072 0 2.07.428 2.813 1.179L12 8.118l.937-1.036A3.96 3.96 0 0116.5 6c2.068 0 3.75 1.682 3.75 3.75 0 2.956-2.37 5.61-6.42 9.496L12 20.25z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export function BrokenHeartIcon({ className, filled = false }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20.25l-1.08-1.004C6.87 15.36 4.5 12.706 4.5 9.75 4.5 7.682 6.182 6 8.25 6c1.072 0 2.07.428 2.813 1.179L12 8.118V20.25z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M12 8.118l.937-1.036A3.96 3.96 0 0116.5 6c2.068 0 3.75 1.682 3.75 3.75 0 2.956-2.37 5.61-6.42 9.496L12 20.25V8.118z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M10.5 7.5 L13.5 10.5 M13.5 7.5 L10.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
