import { motion } from 'framer-motion';

export function CardSkeleton() {
  return (
    <div className="card animate-pulse space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-beige-200" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-beige-200 rounded w-1/3" />
          <div className="h-2 bg-beige-100 rounded w-1/4" />
        </div>
      </div>
      <div className="h-48 bg-beige-100 rounded-xl" />
      <div className="space-y-2">
        <div className="h-3 bg-beige-200 rounded" />
        <div className="h-3 bg-beige-200 rounded w-2/3" />
      </div>
      <div className="flex justify-between pt-2 border-t border-beige-100">
        <div className="h-8 w-16 bg-beige-100 rounded-lg" />
        <div className="h-8 w-20 bg-beige-100 rounded-lg" />
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-beige-200 rounded w-1/3 mb-4" />
      <div className="h-64 bg-beige-100 rounded-xl" />
    </div>
  );
}

export function AnalyticsCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-beige-200" />
        <div className="h-8 w-16 bg-beige-200 rounded" />
      </div>
      <div className="h-4 bg-beige-100 rounded w-2/3" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="card animate-pulse space-y-3">
      <div className="flex gap-4 pb-3 border-b border-beige-100">
        <div className="h-4 bg-beige-200 rounded w-1/4" />
        <div className="h-4 bg-beige-200 rounded w-1/4" />
        <div className="h-4 bg-beige-200 rounded w-1/6" />
        <div className="h-4 bg-beige-200 rounded w-1/6" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          <div className="h-4 bg-beige-100 rounded w-1/4" />
          <div className="h-4 bg-beige-100 rounded w-1/4" />
          <div className="h-4 bg-beige-100 rounded w-1/6" />
          <div className="h-4 bg-beige-100 rounded w-1/6" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 bg-beige-200 rounded w-1/3" />
      <div className="h-4 bg-beige-100 rounded w-1/2" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-beige-200" />
              <div className="h-8 w-16 bg-beige-200 rounded" />
            </div>
            <div className="h-4 bg-beige-100 rounded w-2/3" />
          </div>
        ))}
      </div>
      <div className="h-12 bg-beige-100 rounded-xl" />
    </div>
  );
}

export function SkeletonLoader({ type = 'card', count = 1 }) {
  const components = { card: CardSkeleton, chart: ChartSkeleton, analytics: AnalyticsCardSkeleton, table: TableSkeleton, page: PageSkeleton };
  const Component = components[type] || CardSkeleton;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.1 }}
        >
          <Component />
        </motion.div>
      ))}
    </>
  );
}
