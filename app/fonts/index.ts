import localFont from "next/font/local";

/*
 * The site's fonts, bundled with the project rather than downloaded from Google Fonts
 * during the build, so a build never fails because Google can't be reached.
 * All are variable fonts from Google Fonts (Latin subset), each covering every weight used.
 */

export const sans = localFont({
  src: [{ path: "./InstrumentSans.woff2", weight: "400 700", style: "normal" }],
  display: "swap",
  variable: "--font-sans",
});

export const serif = localFont({
  src: [
    { path: "./Newsreader.woff2", weight: "200 800", style: "normal" },
    { path: "./Newsreader-Italic.woff2", weight: "200 800", style: "italic" },
  ],
  display: "swap",
  variable: "--font-serif",
});

/** Flowing script, for "Faith" and the gold accents. */
export const script = localFont({
  src: [{ path: "./GreatVibes.woff2", weight: "400", style: "normal" }],
  display: "swap",
});

/** Roman capitals, for "ART" and "EXHIBITION" in the hero. */
export const roman = localFont({
  src: [{ path: "./Cinzel.woff2", weight: "400 900", style: "normal" }],
  display: "swap",
});
