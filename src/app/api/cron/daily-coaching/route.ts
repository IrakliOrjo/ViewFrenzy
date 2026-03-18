import { NextResponse } from "next/server";
import { runDailyCoachingForUser, getActiveUsers } from "@/lib/domains/coaching/daily-coaching.service";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userIds = await getActiveUsers();

  const results = [];
  const errors = [];

  for (const userId of userIds) {
    try {
      const result = await runDailyCoachingForUser(userId);
      results.push(result);
      if (result.error) {
        errors.push({ userId, error: result.error });
      }
    } catch (error) {
      errors.push({
        userId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    errorCount: errors.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
