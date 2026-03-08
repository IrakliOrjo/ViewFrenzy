import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const channel = await prisma.channel.findUnique({
    where: { userId: session.user.id },
    select: {
      title: true,
      thumbnailUrl: true,
      subscriberCount: true,
    },
  });

  return (
    <AppShell user={session.user} channel={channel}>
      {children}
    </AppShell>
  );
}
