import {
  useDiscoverArtists,
  getDiscoverArtistsQueryKey,
  useListDiscoveryTags,
  getListDiscoveryTagsQueryKey,
} from "@workspace/api-client-react";
import type { DiscoverArtistsParams } from "@workspace/api-client-react";
import { Link, useSearch, useLocation } from "wouter";
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Music2, Sparkles, Tag, X } from "lucide-react";

const TYPE_META: Record<
  string,
  {
    label: string;
    param: keyof DiscoverArtistsParams;
    cls: string;
    icon: typeof Tag;
  }
> = {
  genre: {
    label: "Genres",
    param: "genre",
    cls: "bg-primary/10 text-primary",
    icon: Music2,
  },
  mood: {
    label: "Moods",
    param: "mood",
    cls: "bg-secondary/10 text-secondary",
    icon: Sparkles,
  },
  theme: {
    label: "Themes",
    param: "theme",
    cls: "bg-accent/10 text-accent-foreground",
    icon: Tag,
  },
};

export default function Discover() {
  const search = useSearch();
  const [, navigate] = useLocation();

  const params = useMemo(() => {
    const sp = new URLSearchParams(search);
    return {
      q: sp.get("q") ?? "",
      genre: sp.get("genre") ?? "",
      mood: sp.get("mood") ?? "",
      theme: sp.get("theme") ?? "",
    };
  }, [search]);

  const query: DiscoverArtistsParams = {};
  if (params.q) query.q = params.q;
  if (params.genre) query.genre = params.genre;
  if (params.mood) query.mood = params.mood;
  if (params.theme) query.theme = params.theme;

  const { data: artists, isLoading } = useDiscoverArtists(query, {
    query: { queryKey: getDiscoverArtistsQueryKey(query) },
  });
  const { data: tags } = useListDiscoveryTags(undefined, {
    query: { queryKey: getListDiscoveryTagsQueryKey(undefined) },
  });

  const setParam = (key: string, value: string) => {
    const sp = new URLSearchParams(search);
    if (value) sp.set(key, value);
    else sp.delete(key);
    const qs = sp.toString();
    navigate(qs ? `/discover?${qs}` : "/discover");
  };

  const activeFilters = (["genre", "mood", "theme"] as const).filter(
    (k) => params[k],
  );

  const grouped = useMemo(() => {
    const g: Record<string, { tag: string; count: number }[]> = {
      genre: [],
      mood: [],
      theme: [],
    };
    for (const t of tags ?? []) {
      if (g[t.type]) g[t.type].push({ tag: t.tag, count: t.count });
    }
    return g;
  }, [tags]);

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold mb-1 sm:mb-2">Discover</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Explore artists by genre, mood, and lyrical theme.
        </p>
      </div>

      {/* Search + clear */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
        <Input
          placeholder="Search by name..."
          value={params.q}
          onChange={(e) => setParam("q", e.target.value)}
          className="w-full sm:w-80 bg-background/50"
          data-testid="input-discover-search"
        />
        {(activeFilters.length > 0 || params.q) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/discover")}
            data-testid="button-clear-filters"
          >
            <X className="w-4 h-4 mr-1" /> Clear all
          </Button>
        )}
      </div>

      {/* Active filter pills */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
          {activeFilters.map((k) => {
            const meta = TYPE_META[k];
            return (
              <button
                key={k}
                onClick={() => setParam(k, "")}
                className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${meta.cls}`}
                data-testid={`active-filter-${k}`}
              >
                {params[k]}
                <X className="w-3.5 h-3.5" />
              </button>
            );
          })}
        </div>
      )}

      {/* On mobile: compact horizontal scroll filter strips; on lg+: sidebar */}
      <div className="grid lg:grid-cols-[240px_1fr] gap-6 sm:gap-8">
        {/* Sidebar / filter strips */}
        <aside>
          {/* Mobile: each category is a horizontal scroll strip */}
          <div className="space-y-4 lg:space-y-6">
            {(["genre", "mood", "theme"] as const).map((type) => {
              const meta = TYPE_META[type];
              const items = grouped[type];
              if (!items || items.length === 0) return null;
              const Icon = meta.icon;
              return (
                <section key={type}>
                  <h3 className="text-xs sm:text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2 sm:mb-3 flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {meta.label}
                  </h3>
                  {/* Horizontal scroll on mobile, wrap on lg */}
                  <div className="flex overflow-x-auto gap-1.5 sm:gap-2 scrollbar-none pb-0.5 lg:flex-wrap">
                    {items.map((item) => {
                      const active = params[type] === item.tag;
                      return (
                        <button
                          key={item.tag}
                          onClick={() => setParam(type, active ? "" : item.tag)}
                          className={`shrink-0 px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium hover-elevate ${
                            active ? meta.cls : "bg-muted text-muted-foreground"
                          }`}
                          data-testid={`tag-${type}-${item.tag}`}
                        >
                          {item.tag}
                          <span className="ml-1 opacity-60">{item.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </aside>

        {/* Results */}
        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="glass-card rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : artists && artists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
              {artists.map((artist) => (
                <Link key={artist.id} href={`/artists/${artist.id}`}>
                  <div className="glass-card rounded-2xl overflow-hidden hover-elevate transition-all cursor-pointer group">
                    <div className="aspect-square bg-muted relative">
                      {artist.imageUrl ? (
                        <img
                          src={artist.imageUrl}
                          alt={artist.artistName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <span className="text-3xl sm:text-4xl font-bold opacity-30">
                            {artist.artistName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 text-white">
                        <h3 className="font-bold text-sm sm:text-lg truncate leading-tight">
                          {artist.artistName}
                        </h3>
                        <p className="text-xs sm:text-sm opacity-80 truncate">
                          {artist.genres?.join(", ")}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="glass-card rounded-2xl text-center py-12 sm:py-16 text-muted-foreground">
              No artists match these filters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
