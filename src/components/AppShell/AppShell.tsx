import { Header } from "@/components/Header/Header";

interface AppShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  children: React.ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden">
      <Header user={user} />
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
