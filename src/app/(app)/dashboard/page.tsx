import { getDashboardData } from "@/app/(app)/dashboard/data/getDashboardData";
import { StatCard } from "@/app/(app)/dashboard/components/StatCard";
import { WelcomeSection } from "@/app/(app)/dashboard/components/WelcomeSection";

export default async function DashboardPage() {
  const { greeting, displayName, levelInfo, stats } =
    await getDashboardData();

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
    </div>
  );
}
