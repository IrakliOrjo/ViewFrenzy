import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncChannelButton } from "@/app/(app)/dashboard/components/sync-channel-button";

export default async function DashboardPage() {
  const session = await auth();
  const channel = session?.user?.id
    ? await prisma.channel.findUnique({ where: { userId: session.user.id } })
    : null;

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Connect your YouTube channel</CardTitle>
            <CardDescription>
              ViewFrenzy needs access to your YouTube data to provide personalized coaching.
              Your channel was authorized during sign-in — just click below to sync.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <SyncChannelButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome back, {channel.title}
      </p>
    </div>
  );
}
