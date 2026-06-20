import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function Landing() {
  return (
    <div className="flex flex-col flex-1">
      <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/hero-concert.png"
            alt="Concert Hero"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="container relative z-10 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-4 sm:mb-6 text-foreground drop-shadow-lg">
              Culture Starts Small.
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 px-2">
              Discover it before the world does.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="sm"
                className="w-full sm:w-auto rounded-lg px-6 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30"
                asChild
              >
                <Link href="/signup">Join the Scene</Link>
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto rounded-lg px-6 py-2.5 glass transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground"
                asChild
              >
                <Link href="/">Explore Map</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background/50">
        <div className="container px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8">
            <div className="glass-card p-6 sm:p-8 rounded-3xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Artists</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Build your presence, connect with local venues, and find your fans.
              </p>
            </div>
            <div className="glass-card p-6 sm:p-8 rounded-3xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Venues</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Discover fresh talent to book and promote your upcoming events effortlessly.
              </p>
            </div>
            <div className="glass-card p-6 sm:p-8 rounded-3xl">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Fans</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Never miss a beat. Find out who's playing where and when.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
