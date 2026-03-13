export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="dash-skeleton h-9 w-72 rounded-lg" />
          <div className="dash-skeleton h-5 w-96 max-w-full rounded-md" />
        </div>
        <div className="dash-skeleton h-[104px] w-full sm:w-64 rounded-2xl shrink-0" />
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border/40 p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="dash-skeleton size-9 rounded-xl" />
              <div className="dash-skeleton h-6 w-14 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="dash-skeleton h-4 w-24 rounded-md" />
              <div className="dash-skeleton h-8 w-20 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Coach + Actions skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Coach Note skeleton */}
        <div className="rounded-xl border border-border/40 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="dash-skeleton size-8 rounded-lg" />
            <div className="dash-skeleton h-6 w-32 rounded-md" />
          </div>
          <div className="space-y-2.5">
            <div className="dash-skeleton h-4 w-full rounded-md" />
            <div className="dash-skeleton h-4 w-4/5 rounded-md" />
            <div className="dash-skeleton h-4 w-3/5 rounded-md" />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <div className="dash-skeleton h-9 w-32 rounded-lg" />
            <div className="dash-skeleton h-4 w-28 rounded-md" />
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="rounded-xl border border-border/40 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="dash-skeleton size-8 rounded-lg" />
              <div className="dash-skeleton h-6 w-44 rounded-md" />
            </div>
            <div className="dash-skeleton h-4 w-14 rounded-md" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/30 p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="dash-skeleton size-2 rounded-full" />
                  <div className="dash-skeleton h-4 w-48 rounded-md" />
                </div>
                <div className="dash-skeleton h-5 w-14 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones skeleton */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="dash-skeleton h-7 w-48 rounded-md" />
          <div className="dash-skeleton h-4 w-20 rounded-md" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/40 p-5 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="dash-skeleton size-10 rounded-full" />
                <div className="space-y-1.5">
                  <div className="dash-skeleton h-4 w-36 rounded-md" />
                  <div className="dash-skeleton h-3 w-28 rounded-md" />
                </div>
              </div>
              <div className="dash-skeleton h-10 w-16 rounded-md" />
            </div>
            <div className="dash-skeleton h-2 w-full rounded-full" />
            <div className="flex justify-between">
              <div className="dash-skeleton h-3 w-28 rounded-md" />
              <div className="dash-skeleton h-3 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Videos skeleton */}
        <div className="rounded-xl border border-border/40 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="dash-skeleton h-5 w-32 rounded-md" />
            <div className="dash-skeleton size-5 rounded-md" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="dash-skeleton w-32 h-18 rounded-lg shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="dash-skeleton h-4 w-full rounded-md" />
                <div className="flex gap-3">
                  <div className="dash-skeleton h-3 w-12 rounded-md" />
                  <div className="dash-skeleton h-3 w-12 rounded-md" />
                </div>
                <div className="dash-skeleton h-3 w-20 rounded-md" />
              </div>
            </div>
          ))}
          <div className="dash-skeleton h-9 w-full rounded-lg" />
        </div>

        {/* Growth Article skeleton */}
        <div className="rounded-xl border border-border/40 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <div className="dash-skeleton size-5 rounded-md" />
            <div className="dash-skeleton h-5 w-32 rounded-md" />
          </div>
          <div className="dash-skeleton h-40 w-full rounded-lg" />
          <div className="dash-skeleton h-5 w-4/5 rounded-md" />
          <div className="dash-skeleton h-4 w-full rounded-md" />
          <div className="dash-skeleton h-4 w-2/3 rounded-md" />
          <div className="dash-skeleton h-3 w-40 rounded-md" />
        </div>
      </div>
    </div>
  );
}
