import { SharePageClient } from "@/components/share/share-page";
import { getSnapshotByToken } from "@/lib/queries/stack";

interface SharePageProps {
	params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
	const { token } = await params;

	// Check if token exists (don't leak snapshot data before passcode check)
	const snapshot = await getSnapshotByToken(token);

	return <SharePageClient token={token} exists={snapshot !== null} />;
}
