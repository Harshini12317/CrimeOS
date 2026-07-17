/**
 * CrimeOS "Maroon & Gold" theme tokens.
 *
 * Merge this object into `theme.extend` in your existing tailwind.config.ts.
 * Don't overwrite your config wholesale — just splice these keys in:
 *
 *   import { crimeOSTheme } from "./theme/tailwind.theme";
 *
 *   export default {
 *     theme: {
 *       extend: {
 *         ...crimeOSTheme,
 *       },
 *     },
 *   };
 */
export const crimeOSTheme = {
  colors: {
    maroon: {
      50: "#FBEEF0",
      100: "#F3D6DB",
      200: "#E3AEB8",
      300: "#CE7F8D",
      400: "#A94356",
      500: "#7A1B2B",
      600: "#5C0E1E",
      700: "#4A0C18",
      800: "#3D0A14", // sidebar / header background
      900: "#2B060E",
    },
    gold: {
      50: "#FDF8EC",
      100: "#FAEECB",
      200: "#F3DA96",
      300: "#E8C766",
      400: "#D9B33F",
      500: "#C9A227", // primary accent
      600: "#A9860F",
      700: "#7D630B",
      800: "#574508",
      900: "#332804",
    },
    ivory: "#FBF8F3", // page background
    ink: {
      600: "#5C5458", // secondary text
      900: "#211A1D", // primary text
    },
    risk: "#B23A2E", // high-risk badges — kept distinct from maroon brand color
  },
  fontFamily: {
    display: ["var(--font-display)", "Georgia", "serif"], // headings, stat numbers, wordmark
    sans: ["var(--font-sans)", "system-ui", "sans-serif"], // body / UI
    mono: ["var(--font-mono)", "monospace"], // case IDs, FIR numbers, timestamps
  },
};