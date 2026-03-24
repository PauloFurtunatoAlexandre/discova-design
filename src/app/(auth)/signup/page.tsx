import type { Metadata } from "next";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
	title: "Create Account — Discova",
};

export default function SignupPage() {
	return (
		<div>
			<div className="text-center mb-10">
				<img src="/discova-lockup-dark.svg" alt="Discova" className="logo-dark" style={{ height: "36px", width: "auto", display: "inline-block" }} />
				<img src="/discova-lockup-light.svg" alt="Discova" className="logo-light" style={{ height: "36px", width: "auto", display: "none" }} />
				<p className="mt-3 text-sm" style={{ color: "var(--color-text-muted)" }}>
					Create your account
				</p>
			</div>

			<SignupForm />

			<p className="text-center mt-8 text-sm" style={{ color: "var(--color-text-muted)" }}>
				Already have an account?{" "}
				<a href="/login" className="underline" style={{ color: "var(--color-accent-gold)" }}>
					Sign in
				</a>
			</p>
		</div>
	);
}
