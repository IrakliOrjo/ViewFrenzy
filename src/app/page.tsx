import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-8 px-6 py-32 text-center">
        <div className="flex flex-col items-center gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            ViewFrenzy
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Your AI-powered YouTube growth coach
          </p>
        </div>

        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Connect your YouTube channel and get strategic coaching, analytics
          insights, and proactive growth advice — all powered by AI.
        </p>

        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <Button size="lg" className="w-full min-w-[240px]">
            Sign in with Google
          </Button>
        </form>

        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          We&apos;ll request access to your YouTube Analytics so ViewFrenzy can coach
          you with real data.
        </p>
      </main>
    </div>
  );
}
