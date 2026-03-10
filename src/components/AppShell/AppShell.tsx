import { Header } from "@/components/Header/Header";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { ChatPanel } from "@/components/ChatPanel/ChatPanel";
import type { ILevelInfo } from "@/helpers/calculateLevel";

interface AppShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  levelInfo: ILevelInfo;
  children: React.ReactNode;
}

export function AppShell({ user, levelInfo, children }: AppShellProps) {
  return (
    <div className="relative flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header user={user} levelInfo={levelInfo} />
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
      <ChatPanel />
    </div>
  );
}
