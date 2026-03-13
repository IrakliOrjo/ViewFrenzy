import { getDashboardData } from "@/app/(app)/dashboard/data/getDashboardData";
import { getGrowthArticle } from "@/app/(app)/dashboard/data/getGrowthArticle";
import { StatCard } from "@/app/(app)/dashboard/components/StatCard";
import { WelcomeSection } from "@/app/(app)/dashboard/components/WelcomeSection";
import { CoachNote } from "@/app/(app)/dashboard/components/CoachNote";
import { RecommendedActions } from "@/app/(app)/dashboard/components/RecommendedActions";
import { MilestoneProgress } from "@/app/(app)/dashboard/components/MilestoneProgress";
import { RecentVideos } from "@/app/(app)/dashboard/components/RecentVideos";
import { GrowthArticle } from "@/app/(app)/dashboard/components/GrowthArticle";
import {
  MOCK_COACH_NOTE,
  MOCK_ACTION_ITEMS,
  MOCK_MILESTONES,
} from "@/app/(app)/dashboard/helpers/mockData";

export default async function DashboardPage() {
  const [dashboardData, article] = await Promise.all([
    getDashboardData(),
    getGrowthArticle(),
  ]);

  const { greeting, displayName, levelInfo, stats, recentVideos } = dashboardData;

  return (
    <div className="space-y-8">
      {/* Welcome + XP rank */}
      <WelcomeSection
        greeting={greeting}
        displayName={displayName}
        levelInfo={levelInfo}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* Coach's Note + Recommended Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CoachNote note={MOCK_COACH_NOTE} />
        <RecommendedActions actions={MOCK_ACTION_ITEMS} />
      </div>

      {/* Milestone Progress */}
      <MilestoneProgress milestones={MOCK_MILESTONES} />

      {/* Recent Videos + Growth Article */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentVideos videos={recentVideos} />
        <GrowthArticle article={article} />
      </div>
    </div>
  );
}
