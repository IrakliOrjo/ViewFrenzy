import { getDashboardData } from "@/app/(app)/dashboard/data/getDashboardData";
import { getGrowthArticle } from "@/app/(app)/dashboard/data/getGrowthArticle";
import { StatCard } from "@/app/(app)/dashboard/components/StatCard";
import { WelcomeSection } from "@/app/(app)/dashboard/components/WelcomeSection";
import { CoachNote } from "@/app/(app)/dashboard/components/CoachNote";
import { RecommendedActions } from "@/app/(app)/dashboard/components/RecommendedActions";
import { RecentVideos } from "@/app/(app)/dashboard/components/RecentVideos";
import { GrowthArticle } from "@/app/(app)/dashboard/components/GrowthArticle";
import { DashboardEntrance } from "@/app/(app)/dashboard/components/DashboardEntrance";
import { OverviewMilestones } from "@/app/(app)/dashboard/components/OverviewMilestones";
import { SyncChannelButton } from "@/app/(app)/dashboard/components/sync-channel-button";

export default async function DashboardPage() {
  const [dashboardData, article] = await Promise.all([
    getDashboardData(),
    getGrowthArticle(),
  ]);

  const { greeting, displayName, levelInfo, stats, recentVideos, goals, coachNote, topTasks } =
    dashboardData;

  return (
    <DashboardEntrance className="space-y-8">
      {/* Welcome + XP rank */}
      <div
        className="dash-enter flex items-start justify-between gap-4"
        style={{ "--enter-delay": "0ms" } as React.CSSProperties}
      >
        <WelcomeSection
          greeting={greeting}
          displayName={displayName}
          levelInfo={levelInfo}
        />
        <SyncChannelButton />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="dash-enter"
            style={
              { "--enter-delay": `${100 + i * 75}ms` } as React.CSSProperties
            }
          >
            <StatCard stat={stat} />
          </div>
        ))}
      </div>

      {/* Coach's Note + Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          className="dash-enter"
          style={{ "--enter-delay": "400ms" } as React.CSSProperties}
        >
          <CoachNote note={coachNote} />
        </div>
        <div
          className="dash-enter"
          style={{ "--enter-delay": "475ms" } as React.CSSProperties}
        >
          <RecommendedActions tasks={topTasks} />
        </div>
      </div>

      {/* Milestone Progress with Goal Dialog */}
      <div
        className="dash-enter"
        style={{ "--enter-delay": "550ms" } as React.CSSProperties}
      >
        <OverviewMilestones goals={goals} />
      </div>

      {/* Recent Videos + Growth Article */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div
          className="dash-enter"
          style={{ "--enter-delay": "625ms" } as React.CSSProperties}
        >
          <RecentVideos videos={recentVideos} />
        </div>
        <div
          className="dash-enter"
          style={{ "--enter-delay": "700ms" } as React.CSSProperties}
        >
          <GrowthArticle article={article} />
        </div>
      </div>
    </DashboardEntrance>
  );
}
