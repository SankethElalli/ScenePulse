import { useListEvents } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Events() {
  const [status, setStatus] = useState<string>("all");
  const { data: events, isLoading } = useListEvents({
    status: status === "all" ? undefined : status,
  });

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">Events</h1>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[180px] bg-background/50">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="live">Live</SelectItem>
            <SelectItem value="past">Past</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl h-40 sm:h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {events?.map((event) => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="glass-card p-4 sm:p-6 rounded-2xl hover-elevate transition-all cursor-pointer group flex flex-col h-full">
                <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base sm:text-xl mb-1 group-hover:text-primary transition-colors leading-snug">
                      {event.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {new Date(event.eventDate).toLocaleDateString(undefined, {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div
                    className={`shrink-0 px-2 py-1 rounded-full text-xs font-semibold uppercase tracking-wider
                      ${event.status === "upcoming" ? "bg-primary/20 text-primary" : ""}
                      ${event.status === "live" ? "bg-chart-4/20 text-chart-4" : ""}
                      ${event.status === "past" ? "bg-muted text-muted-foreground" : ""}
                      ${event.status === "cancelled" ? "bg-destructive/20 text-destructive" : ""}
                    `}
                  >
                    {event.status}
                  </div>
                </div>
                <div className="mt-auto">
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                    {event.description || "No description provided."}
                  </p>
                </div>
              </div>
            </Link>
          ))}
          {events?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No events found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
