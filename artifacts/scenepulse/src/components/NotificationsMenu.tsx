import { useState } from "react";
import { Bell, CalendarClock, Music4, Users, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type SceneNotification = {
  id: string;
  icon: typeof Bell;
  title: string;
  body: string;
  time: string;
  accent: string;
};

const SEED_NOTIFICATIONS: SceneNotification[] = [
  {
    id: "n1",
    icon: CalendarClock,
    title: "Live tonight near you",
    body: "Neon Tigers are playing The Humming Tree at 9 PM.",
    time: "2h ago",
    accent: "text-[hsl(330_85%_60%)]",
  },
  {
    id: "n2",
    icon: Users,
    title: "New artist in your scene",
    body: "Basswala just joined ScenePulse in Bengaluru.",
    time: "5h ago",
    accent: "text-[hsl(280_80%_58%)]",
  },
  {
    id: "n3",
    icon: Music4,
    title: "Mood match",
    body: "3 new artists match your “ethereal · soulful” vibe.",
    time: "1d ago",
    accent: "text-[hsl(190_80%_52%)]",
  },
];

export function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const unreadCount = SEED_NOTIFICATIONS.filter(
    (n) => !readIds.has(n.id),
  ).length;

  const markAllRead = () =>
    setReadIds(new Set(SEED_NOTIFICATIONS.map((n) => n.id)));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="group relative h-11 w-11 rounded-2xl glass border border-white/10 transition-all duration-200 hover:border-primary/50 hover:text-primary active:scale-90"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-6" />
          {unreadCount > 0 && (
            <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-secondary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="glass-card w-80 border-white/10 p-0"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="rounded-full bg-secondary/20 px-2 py-0.5 text-[10px] font-bold text-secondary">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {SEED_NOTIFICATIONS.map((n) => {
            const Icon = n.icon;
            const unread = !readIds.has(n.id);
            return (
              <button
                key={n.id}
                onClick={() =>
                  setReadIds((prev) => new Set(prev).add(n.id))
                }
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5",
                  unread && "bg-white/[0.03]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/5",
                    n.accent,
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium leading-tight text-foreground">
                      {n.title}
                    </span>
                    {unread && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                    )}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {n.body}
                  </span>
                  <span className="mt-1 block text-[10px] uppercase tracking-wide text-muted-foreground/70">
                    {n.time}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
