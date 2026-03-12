import { Progress } from "@/components/ui/Progress";
import { cn } from "@/lib/utils/utils";

interface SessionItem {
  id: string;
  title: string;
  type: "Video" | "PDF" | "Quiz";
  thumbnail: string;
  progress: number;
  timeAgo: string;
}

interface RecentActivityProps {
  sessions: SessionItem[];
  className?: string;
}

export function RecentActivity({ sessions, className }: RecentActivityProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-card-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Recent Sessions
        </h3>
        <button className="text-primary hover:bg-primary/5 p-1 cursor-pointer rounded-md transition-colors">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="4" cy="10" r="2" />
            <circle cx="10" cy="10" r="2" />
            <circle cx="16" cy="10" r="2" />
          </svg>
        </button>
      </div>
      <div className="space-y-4">
        {sessions.length > 0 ? (
          sessions.map((session) => {
            // Parse title if it's JSON
            let displayTitle = session.title;
            try {
              if (
                typeof session.title === "string" &&
                session.title.startsWith("{")
              ) {
                const parsed = JSON.parse(session.title);
                displayTitle = parsed.topicText || session.title;
              }
            } catch {
              displayTitle = session.title;
            }

            return (
              <a
                key={session.id}
                href="#"
                className="group flex gap-4 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors items-start"
              >
                {/* Thumbnail with text fallback */}
                <div className="w-20 h-14 rounded-lg shrink-0 shadow-sm group-hover:shadow-md transition-shadow relative overflow-hidden">
                  {session.thumbnail ? (
                    <>
                      <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url("${session.thumbnail}")`,
                        }}
                      />
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    </>
                  ) : (
                    // Text placeholder - show full topic name truncated
                    <div className="w-full h-full bg-linear-to-br from-primary/80 to-blue-600/80 flex items-center justify-center p-2">
                      <span className="text-white font-bold text-xs text-center leading-tight line-clamp-3">
                        {displayTitle || "?"}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-primary transition-colors">
                    {displayTitle}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {session.type} • {session.timeAgo}
                  </p>
                  {session.progress > 0 && session.progress < 100 && (
                    <Progress value={session.progress} className="mt-2" />
                  )}
                </div>
              </a>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No recent activity.
          </div>
        )}
      </div>
      <button className="w-full mt-6 py-2 text-sm cursor-pointer font-medium text-gray-500 hover:text-primary transition-colors border border-dashed border-gray-300 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5">
        View Full History
      </button>
    </div>
  );
}
