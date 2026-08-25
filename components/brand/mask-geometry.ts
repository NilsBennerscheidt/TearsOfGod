/**
 * Eye-hole centers as a % of the mask's own box — measured directly off
 * public/brand/mask.png (512×512): left hole ~(190,415), right ~(325,415).
 *
 * Shared rather than owned by MaskEyesGlow, because two unrelated
 * treatments now have to land on the same two holes (the ambient ember
 * glow, and the 404 page's tears). Two hardcoded copies of these numbers
 * would silently drift apart the day the artwork is ever re-cropped or
 * swapped for the vector called for in MaskGlyph's KNOWN GAP note.
 */
export const MASK_EYES = [
  { left: "37.1%", top: "81.4%" },
  { left: "63.5%", top: "81.4%" },
] as const;
