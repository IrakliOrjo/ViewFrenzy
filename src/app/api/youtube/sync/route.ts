import { auth } from "@/lib/auth";
import { syncYouTubeData } from "@/lib/domains/channel/channel.service";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await syncYouTubeData(session.user.id);

    if ("error" in result) {
      const status = result.error === "No YouTube access" ? 403 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json({
      success: true,
      channel: {
        ...result.channel,
        viewCount: Number(result.channel.viewCount),
      },
      videoCount: result.videoCount,
    });
  } catch (error) {
    console.error("YouTube sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync YouTube data" },
      { status: 500 }
    );
  }
}
