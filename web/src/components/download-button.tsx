type DownloadButtonProps = {
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  releaseTag?: string;
  setupSize?: string;
  label?: string;
};

export function DownloadButton({
  className = "",
  variant = "primary",
  size = "md",
  releaseTag,
  setupSize,
  label = "Скачать для Windows",
}: DownloadButtonProps) {
  const meta = [releaseTag, setupSize].filter(Boolean).join(" · ");

  return (
    <a
      href="/api/download/windows"
      className={`btn btn-download btn-download--${variant} btn-download--${size} ${className}`.trim()}
    >
      <span className="btn-download-icon" aria-hidden>
        ⬇
      </span>
      <span className="btn-download-body">
        <span className="btn-download-label">{label}</span>
        {meta ? <span className="btn-download-meta">{meta}</span> : null}
      </span>
    </a>
  );
}
