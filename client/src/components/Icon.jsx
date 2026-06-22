const ICON_MAP = {
  train: "bi-train-front",
  trainFill: "bi-train-front-fill",
  subway: "bi-subway",
  trophy: "bi-trophy",
  trophyFill: "bi-trophy-fill",
  warn: "bi-exclamation-triangle-fill",
  interchange: "bi-arrow-left-right",
  one: "bi-1-circle",
  two: "bi-2-circle",
  three: "bi-3-circle",
  lock: "bi-lock-fill",
  controller: "bi-controller",
  gold: "bi-award-fill text-warning",
  silver: "bi-award-fill text-secondary",
  bronze: "bi-award-fill text-danger",
  timer: "bi-hourglass-split",
  undo: "bi-arrow-counterclockwise",
  clear: "bi-trash",
  submit: "bi-rocket-takeoff-fill",
  coin: "bi-coin",
  success: "bi-patch-check-fill",
  failure: "bi-x-circle-fill",
  info: "bi-info-circle-fill",
};

/**
 * Reusable icon component to centralize and replace emojis with Bootstrap Icons.
 */
export default function Icon({ name, className = "", style = {} }) {
  const iconClass = ICON_MAP[name] || "";
  return (
    <span
      className="d-inline-flex align-items-center justify-content-center"
      style={{ verticalAlign: "middle", ...style }}
    >
      <i
        className={`bi ${iconClass} ${className}`}
        role="img"
        aria-label={name}
      />
    </span>
  );
}
