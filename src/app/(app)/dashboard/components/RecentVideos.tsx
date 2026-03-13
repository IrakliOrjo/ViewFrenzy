import Image from "next/image";
import { Eye, Heart, MoreHorizontal, Play, VideoOff } from "lucide-react";
import type { IRecentVideo } from "@/types/dashboard";
import { formatNumber } from "@/helpers/formatNumber";
import { formatRelativeTime } from "@/helpers/date";
import { ActionButton } from "@/components/Common/ActionButton";

interface RecentVideosProps {
  videos: IRecentVideo[];
}

export function RecentVideos({ videos }: RecentVideosProps) {
  return (
    <div className="bg-card p-6 rounded-xl shadow-sm border border-primary/5 transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold">Recent Uploads</h3>
        <MoreHorizontal className="size-5 text-muted-foreground" />
      </div>

      {videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
          <VideoOff className="size-8 mb-2" />
          <p className="text-sm">No videos uploaded yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {videos.map((video) => (
              <div key={video.id} className="flex gap-4 group cursor-pointer">
                <div className="w-32 h-18 shrink-0 bg-muted rounded-lg overflow-hidden flex items-center justify-center relative">
                  {video.thumbnailUrl ? (
                    <Image
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="128px"
                    />
                  ) : (
                    <Play className="size-6 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold truncate group-hover:text-primary transition-colors">
                    {video.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Eye className="size-3" />
                      {formatNumber(video.viewCount)}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Heart className="size-3" />
                      {formatNumber(video.likeCount)}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {formatRelativeTime(video.publishedAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <ActionButton variant="outline" className="w-full mt-6 text-xs">
            View Content Studio
          </ActionButton>
        </>
      )}
    </div>
  );
}
