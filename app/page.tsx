import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Film,
  Users,
  Share2,
  Calendar,
  Star,
  CheckCircle2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Film className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              MovieScheduler
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button
              asChild
              className="rounded-full shadow-lg hover:shadow-primary/25 transition-all"
            >
              <Link href="/auth/login">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-start pt-20 lg:pt-32 pb-12">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[100px] rounded-full -z-10 opacity-50 dark:opacity-30" />
          <div className="absolute top-1/2 right-0 w-[600px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full -z-10 opacity-30" />

          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-start">
              <div className="flex flex-col gap-6 text-center lg:text-left pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium w-fit mx-auto lg:mx-0 border border-primary/20">
                  <Badge
                    variant="secondary"
                    className="bg-background text-primary shadow-sm"
                  >
                    New
                  </Badge>
                  <span className="flex items-center gap-1">
                    Collaborative Scheduling <ArrowRight className="h-3 w-3" />
                  </span>
                </div>

                <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
                  Your Movie Nights <br />
                  <span className="bg-gradient-to-r from-primary via-indigo-500 to-primary bg-clip-text text-transparent animate-gradient bg-300%">
                    Perfectly Planned
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                  Stop debating what to watch. Create groups, vote on movies,
                  and schedule your next watch party in seconds.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mt-4">
                  <Button
                    asChild
                    size="lg"
                    className="h-12 px-8 rounded-full text-base shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
                  >
                    <Link href="/auth/login">Start Scheduling Free</Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 rounded-full text-base hover:bg-muted/50"
                  >
                    <Link href="#features">See How It Works</Link>
                  </Button>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-6 mt-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Free Forever</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>No Credit Card</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>Unlimited Groups</span>
                  </div>
                </div>
              </div>

              <div className="relative mx-auto lg:mr-0 w-full max-w-[500px] lg:max-w-none perspective-1000">
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl animate-pulse" />

                <div className="relative grid grid-cols-2 gap-4 rotate-y-12 rotate-x-6 transform-style-3d hover:rotate-0 transition-transform duration-700 ease-out py-4">
                  <Card className="bg-card/50 backdrop-blur border-primary/20 shadow-2xl translate-y-4">
                    <CardContent className="p-2">
                      <img
                        src="https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg"
                        alt="Oppenheimer"
                        className="rounded-lg w-full aspect-[2/3] object-cover shadow-md mb-2"
                      />
                      <div className="px-1">
                        <div className="h-2 w-2/3 bg-foreground/20 rounded mb-1.5" />
                        <div className="h-1.5 w-1/2 bg-foreground/10 rounded" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/80 backdrop-blur border-primary/20 shadow-2xl -translate-y-4 z-10 scale-105">
                    <div className="absolute -top-3 -right-3 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg z-20">
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                    <CardContent className="p-2">
                      <img
                        src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
                        alt="Interstellar"
                        className="rounded-lg w-full aspect-[2/3] object-cover shadow-md mb-2"
                      />
                      <div className="px-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="text-[10px] h-4"
                          >
                            Scheduled
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            Fri 8PM
                          </span>
                        </div>
                        <div className="h-2 w-3/4 bg-foreground/20 rounded" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-20 lg:py-32 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">
                Everything needed for the perfect movie night
              </h2>
              <p className="text-muted-foreground text-lg">
                MovieScheduler handles the logistics so you can focus on the
                popcorn.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-8 rounded-2xl bg-background border hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Group Management</h3>
                <p className="text-muted-foreground">
                  Create dedicated groups for family, friends, or roommates.
                  Keep watchlists separate and organized.
                </p>
              </div>

              <div className="group p-8 rounded-2xl bg-background border hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Share2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Easy Sharing</h3>
                <p className="text-muted-foreground">
                  Invite members instantly with a unique link. No complicated
                  sign-up process required.
                </p>
              </div>

              <div className="group p-8 rounded-2xl bg-background border hover:border-primary/50 transition-all hover:shadow-lg">
                <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-bold mb-3">Interactive Schedule</h3>
                <p className="text-muted-foreground">
                  Collaboratively plan dates. Ensure everyone is on the same
                  page for when the movie starts.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="relative rounded-[2rem] bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden border border-slate-800 shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-soft-light"></div>
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 blur-[100px] rounded-full" />

              <div className="relative z-10 grid lg:grid-cols-2 gap-12 p-12 lg:p-20 items-center">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium border border-white/20">
                    <Zap className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>Powered by TMDB</span>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                    Discover movies you'll{" "}
                    <span className="text-primary">love</span>.
                  </h2>
                  <p className="text-slate-400 text-lg leading-relaxed">
                    Browse millions of movies, verify release dates, read
                    overviews, and add them directly to your group's watchlist.
                  </p>
                  <Button
                    asChild
                    className="rounded-full h-12 px-8 bg-white text-slate-900 hover:bg-slate-200"
                  >
                    <Link href="/auth/login">Explore Library</Link>
                  </Button>
                </div>

                <div className="relative">
                  <div className="grid grid-cols-2 gap-4 opacity-90">
                    <img
                      src="https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"
                      className="rounded-lg shadow-lg rotate-[-2deg] hover:rotate-0 transition-transform duration-500"
                      alt="Movie"
                    />
                    <img
                      src="https://image.tmdb.org/t/p/w500/r2J02Z2OpNTctfOSN1Ydgii51I3.jpg"
                      className="rounded-lg shadow-lg translate-y-8 rotate-[2deg] hover:rotate-0 transition-transform duration-500"
                      alt="Movie"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl font-bold tracking-tight">
                Ready to start watching?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of movie lovers organizing their watchlists
                today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  asChild
                  size="lg"
                  className="h-14 px-10 rounded-full text-lg shadow-xl shadow-primary/20"
                >
                  <Link href="/auth/login">Create Account for Free</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-14 px-10 rounded-full text-lg"
                >
                  <Link href="/auth/login">Log in</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Film className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg">MovieScheduler</span>
          </div>

          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} MovieScheduler. All rights
            reserved.
          </div>

          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Terms
            </a>
            <a href="#" className="hover:text-primary transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
