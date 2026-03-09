import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell/AppShell";
import { calculateLevel } from "@/helpers/calculateLevel";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totalXp: true },
  });

  const levelInfo = calculateLevel(user?.totalXp ?? 0);

  return (
    <AppShell user={session.user} levelInfo={levelInfo}>
      {children}
    </AppShell>
  );
}
