// src/app/fonts.ts
import { Inter, Lato, Hanken_Grotesk as HankenGrotesk } from "next/font/google";
import localFont from "next/font/local";

/** INTER — títulos/menú (variable + italic) */
export const inter = Inter({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-inter",
});

/** LATO — subtítulos/botones (pesos + italic) */
export const lato = Lato({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["100", "300", "400", "700", "900"],
  display: "swap",
  variable: "--font-lato",
});

/** HANKEN GROTESK — párrafos (OFL, alternativa a HK Guise) */
export const hankenGrotesk = HankenGrotesk({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["100","200","300","400","500","600","700","800","900"],
  display: "swap",
  variable: "--font-hanken-grotesk",
});

/** OPCIÓN B (si adquieres HK Guise en MyFonts): descomenta y sube .woff2 a /public/fonts/hk-guise/ */
// export const hkGuise = localFont({
//   variable: "--font-hk-guise",
//   display: "swap",
//   src: [
//     { path: "/fonts/hk-guise/HKGuise-Hairline.woff2", weight: "100", style: "normal" },
//     { path: "/fonts/hk-guise/HKGuise-HairlineItalic.woff2", weight: "100", style: "italic" },
//     { path: "/fonts/hk-guise/HKGuise-Thin.woff2", weight: "200", style: "normal" },
//     { path: "/fonts/hk-guise/HKGuise-ThinItalic.woff2", weight: "200", style: "italic" },
//     { path: "/fonts/hk-guise/HKGuise-ExtraLight.woff2", weight: "200", style: "normal" },
//     { path: "/fonts/hk-guise/HKGuise-ExtraLightItalic.woff2", weight: "200", style: "italic" },
//     { path: "/fonts/hk-guise/HKGuise-Light.woff2", weight: "300", style: "normal" },
//     { path: "/fonts/hk-guise/HKGuise-LightItalic.woff2", weight: "300", style: "italic" },
//     { path: "/fonts/hk-guise/HKGuise-Regular.woff2", weight: "400", style: "normal" },
//     { path: "/fonts/hk-guise/HKGuise-Italic.woff2", weight: "400", style: "italic" },
//     { path: "/fonts/hk-guise/HKGuise-Medium.woff2", weight: "500", style: "normal" },
//     { path: "/fonts/hk-guise/HKGuise-MediumItalic.woff2", weight: "500", style: "italic" },
//     { path: "/fonts/hk-guise/HKGuise-SemiBold.woff2", weight: "600", style: "normal" },
//     { path: "/fonts/hk-guise/HKGuise-SemiBoldItalic.woff2", weight: "600", style: "italic" },
//     { path: "/fonts/hk-guise/HKGuise-Bold.woff2", weight: "700", style: "normal" },
//     { path: "/fonts/hk-guise/HKGuise-BoldItalic.woff2", weight: "700", style: "italic" },
//   ],
// });
