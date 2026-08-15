/**
 * An 8-point star (khatam) inscribed in a 100×100 box, centered at (50,50),
 * outer radius 46 / inner radius 20. This single path is reused as the
 * loading spinner, the tiled background lattice, and the app icon, so the
 * whole app is built around one deliberate geometric signature instead of
 * three unrelated decorative flourishes.
 */
export const EIGHT_POINT_STAR_PATH =
  "M50,4 L57.65,31.52 L82.53,17.47 L68.48,42.35 L96,50 L68.48,57.65 L82.53,82.53 L57.65,68.48 " +
  "L50,96 L42.35,68.48 L17.47,82.53 L31.52,57.65 L4,50 L31.52,42.35 L17.47,17.47 L42.35,31.52 Z";
