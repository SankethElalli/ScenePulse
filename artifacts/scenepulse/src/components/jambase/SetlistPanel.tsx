import { useState, useEffect } from "react";
import { X, Calendar, Music2, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PastPerformer {
  name: string;
  identifier: string;
  url: string;
  isHeadliner: boolean;
}

interface PastEvent {
  identifier: string;
  name: string;
  url: string;
  startDate: string;
  performers: PastPerformer[];
}

interface Props {
  venueIdentifier: string;
  venueName: string;
  onClose: () => void;
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
}

export function SetlistPanel({ venueIdentifier, venueName, onClose }: Props) {
  const [events, setEvents] = useState<PastEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/jambase/venue-setlists?venueId=${encodeURIComponent(venueIdentifier)}`)
      .then((r) => r.json())
      .then((d: { events?: PastEvent[]; error?: string }) => {
        if (d.error) setError(d.error);
        else setEvents(d.events ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load setlist history");
        setLoading(false);
      });
  }, [venueIdentifier]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
        style={{ background: "rgba(10,8,20,0.97)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-white/10">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">
              Setlist History
            </p>
            <h2 className="text-white font-bold text-lg leading-tight">{venueName}</h2>
            <p className="text-white/40 text-xs mt-0.5">Past shows at this venue</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-full bg-white/5 border border-white/10 p-1.5 text-white/50 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-white/40" />
              <span className="text-sm text-white/40">Loading shows…</span>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-2 py-12 px-6 text-center">
              <Music2 className="h-8 w-8 text-white/20" />
              <p className="text-sm text-white/40">{error}</p>
            </div>
          )}
          {!loading && !error && events.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12 px-6 text-center">
              <Calendar className="h-8 w-8 text-white/20" />
              <p className="text-sm text-white/40">No past shows found for this venue</p>
            </div>
          )}
          {!loading && !error && events.length > 0 && (
            <div className="divide-y divide-white/5">
              {events.map((ev) => (
                <div key={ev.identifier} className="px-5 py-4 hover:bg-white/3 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/30 tabular-nums mb-1">
                        {formatDate(ev.startDate)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {ev.performers.map((p) => (
                          <span
                            key={p.identifier}
                            className={cn(
                              "rounded-full px-2.5 py-0.5 text-xs font-medium",
                              p.isHeadliner
                                ? "bg-primary/20 text-primary border border-primary/30"
                                : "bg-white/5 text-white/60 border border-white/10",
                            )}
                          >
                            {p.name}
                            {p.isHeadliner && (
                              <span className="ml-1 text-[9px] text-primary/70 uppercase tracking-wide">headliner</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/40 hover:text-white hover:border-white/20 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-white/5">
          <p className="text-[9px] text-white/20 uppercase tracking-widest text-center">
            Powered by JamBase
          </p>
        </div>
      </div>
    </div>
  );
}
