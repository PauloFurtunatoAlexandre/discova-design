import { QueryProvider } from "@/components/providers/query-provider";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AppLayout({ children }: { children: ReactNode }) {
	const session = await auth();
	if (!session?.user?.id) {
		redirect("/login");
	}

	return <QueryProvider>{children}</QueryProvider>;
}
