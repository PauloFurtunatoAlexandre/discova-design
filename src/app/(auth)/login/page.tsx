import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
	title: "Sign In — Discova",
};

export default function LoginPage() {
	return (
		<div>
			<div className="text-center mb-10">
				<img
					src="/discova-lockup-dark.svg"
					alt="Discova"
					className="logo-dark"
					style={{ height: "36px", width: "auto", display: "inline-block" }}
				/>
				<img
					src="/discova-lockup-light.svg"
					alt="Discova"
					className="logo-light"
					style={{ height: "36px", width: "auto", display: "none" }}
				/>
				<p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
					Sign in to your account
				</p>
			</div>

			<LoginForm />

			<p className="text-center mt-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
				{"Don't have an account? "}
				<a href="/signup" className="underline" style={{ color: "var(--color-accent-gold)" }}>
					Create one
				</a>
			</p>
		</div>
	);
}
