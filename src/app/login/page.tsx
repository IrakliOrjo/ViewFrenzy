"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">ViewFrenzy</CardTitle>
          <CardDescription>
            Your AI YouTube growth coach. Sign in to connect your channel and
            start growing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            className="w-full"
            size="lg"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Sign in with Google
          </Button>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            We&apos;ll request access to your YouTube Analytics so ViewFrenzy can
            coach you with real data.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
