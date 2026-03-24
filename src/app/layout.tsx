import type { Metadata } from "next";
import { ThemeProvider } from "@/hooks/useTheme";
import { fontVariables } from "@/lib/fonts";
import "@/styles/globals.css";

export const metadata: Metadata = {
	title: "Discova — Product Discovery Platform",
	description:
		"The missing layer between what your users say and what your team decides to build.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" data-theme="dark" className={fontVariables} suppressHydrationWarning>
			<body>
				<ThemeProvider>{children}</ThemeProvider>
			</body>
		</html>
	);
}
