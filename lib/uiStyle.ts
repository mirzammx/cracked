import type { CSSProperties } from "react";

/**
 * Every side spelled out as a pure longhand (no `border`, `borderColor`,
 * `borderWidth`, or `borderLeft` shorthands). React's DOM renderer warns
 * — correctly — when a style object mixes a multi-side shorthand with a
 * single-side longhand across renders, because `borderLeftColor` set once
 * and then `borderColor` set the next render leaves the DOM in an
 * ambiguous state. Cards here have a 1px border on three sides and a
 * thicker branch-colored accent on the left, so all eight properties are
 * given explicitly, every render, to sidestep that entirely.
 */
export function sideBorder(color: string, accentColor: string, width = 1, accentWidth = 3): CSSProperties {
  return {
    borderTopStyle: "solid",
    borderRightStyle: "solid",
    borderBottomStyle: "solid",
    borderLeftStyle: "solid",
    borderTopWidth: width,
    borderRightWidth: width,
    borderBottomWidth: width,
    borderLeftWidth: accentWidth,
    borderTopColor: color,
    borderRightColor: color,
    borderBottomColor: color,
    borderLeftColor: accentColor,
  };
}
