import { useListVenues } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Venues() {
  const [search, setSearch] = useState("");
  const { data: venues, isLoading } = useListVenues({ q: search });

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold">Venues</h1>
        <Input
          placeholder="Search venues..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 bg-background/50"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl aspect-video animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
          {venues?.map((venue) => (
            <Link key={venue.id} href={`/venues/${venue.id}`}>
              <div className="glass-card rounded-2xl overflow-hidden hover-elevate transition-all cursor-pointer group">
                <div className="aspect-video bg-muted relative">
                  {venue.imageUrl ? (
                    <img
                      src={venue.imageUrl}
                      alt={venue.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary/10">
                      <span className="text-3xl sm:text-4xl font-bold opacity-30">
                        {venue.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 text-white">
                    <h3 className="font-bold text-sm sm:text-lg truncate leading-tight">
                      {venue.name}
                    </h3>
                    <p className="text-xs sm:text-sm opacity-80 truncate">{venue.city}</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
          {venues?.length === 0 && (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              No venues found matching your criteria.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
