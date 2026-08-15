import { EIGHT_POINT_STAR_PATH } from "../../lib/star-path";

/** Subtle, theme-aware geometric backdrop. Opacity is driven entirely by
 *  the --pattern-opacity token (0.05 light / 0.07 dark) defined in
 *  globals.css, so it never needs to be tuned per-component. */
export function IslamicPatternBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <svg width="100%" height="100%" style={{ opacity: "var(--pattern-opacity)" }}>
        <defs>
          <pattern id="star-lattice" width="90" height="90" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
            <path d={EIGHT_POINT_STAR_PATH} transform="translate(-5,-5) scale(0.85)" fill="var(--gold)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#star-lattice)" />
      </svg>
    </div>
  );
}
