export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-500 animate-pulse" />
              <div className="w-24 h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse hidden sm:block" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-20 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="w-20 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              <div className="w-32 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      {/* Main content skeleton */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Welcome header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="w-64 h-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
              <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>

          {/* Stats card skeleton */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="w-24 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 mx-auto bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse mb-2" />
                  <div className="w-8 h-8 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1" />
                  <div className="w-12 h-4 mx-auto bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Action cards skeleton */}
          <div className="grid sm:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
                  <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                </div>
                <div className="w-full h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-4" />
                <div className="w-full h-10 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
              </div>
            ))}
          </div>

          {/* Available Games skeleton */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                <div className="w-32 h-5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              </div>
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
            </div>
            <div className="p-6 pt-2 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
