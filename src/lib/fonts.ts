import { DM_Sans, JetBrains_Mono, Lora } from "next/font/google";

export const lora = Lora({
	subsets: ["latin", "latin-ext"],
	variable: "--font-lora",
	display: "swap",
	weight: ["400", "500", "600"],
	style: ["normal", "italic"],
});

export const dmSans = DM_Sans({
	subsets: ["latin", "latin-ext"],
	variable: "--font-dm-sans",
	display: "swap",
	weight: ["300", "400", "500", "600"],
});

export const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin", "latin-ext"],
	variable: "--font-jetbrains-mono",
	display: "swap",
	weight: ["400", "500"],
});

/**
 * Combined font class string to apply on <html> or <body>.
 * Applies all three font CSS variables simultaneously.
 */
export const fontVariables = `${lora.variable} ${dmSans.variable} ${jetbrainsMono.variable}`;
