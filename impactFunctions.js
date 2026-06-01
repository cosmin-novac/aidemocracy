// impactFunctions.js — Kept for compatibility; main rendering is now in renderFunctions.js

/**
 * Format an impact value with sign and colour class.
 * @param {number} value
 * @returns {{ text: string, cssClass: string }}
 */
export function formatImpact(value) {
  const sign = value >= 0 ? "+" : "";
  const cssClass = value > 0 ? "good" : value < 0 ? "bad" : "neutral";
  return { text: `${sign}${value}`, cssClass };
}
