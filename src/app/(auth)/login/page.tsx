import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
	title: "Sign In — Discova",
};

export default function LoginPage() {
	return (
		<div>
			<div className="text-center mb-10">
				<h1
					className="text-3xl tracking-tight"
					style={{
						fontFamily: "var(--font-display)",
						color: "var(--color-text-primary)",
					}}
				>
					discova
				</h1>
				<p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
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
