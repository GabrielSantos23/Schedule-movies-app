"use client";

import { signUp, signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Film, ArrowLeft, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { Link, useTransitionRouter } from "next-view-transitions";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useTransitionRouter();
  const { data: session, isPending } = useSession();

  const backdrops = [
    "rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg", // Interstellar
    "xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", // Dune: Part Two
    "ilRyASD8yqsztHqnPzmExgrIViE.jpg", // Blade Runner 2049
    "fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", // Oppenheimer
    "4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", // Spider-Man: Across the Spider-Verse
    "5P8SmMzSNYikXpxil6BYzJ16611.jpg", // The Batman
    "yDHYTfA3R0jFYba16jBB1ef8oIt.jpg", // Deadpool & Wolverine
  ];

  const [bgImage, setBgImage] = useState(backdrops[0]);

  useEffect(() => {
    const randomBackdrop =
      backdrops[Math.floor(Math.random() * backdrops.length)];
    setBgImage(randomBackdrop);
  }, []);

  useEffect(() => {
    if (session && !isPending) {
      router.push("/groups");
    }
  }, [session, isPending, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({
        email,
        password,
        name,
        callbackURL: "/groups",
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
        setIsLoading(false);
      } else {
        router.push("/groups");
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      await signIn.social({
        provider: "google",
        callbackURL: "/groups",
      });
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsGoogleLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-10 lg:px-10">
        <div className="flex items-center justify-between lg:justify-start lg:gap-2 mb-10">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-primary/10 p-2 rounded-xl">
              <Film className="h-5 w-5 text-primary" />
            </div>
            MovieScheduler
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="mx-auto w-full max-w-sm space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Create an account
              </h1>
              <p className="text-muted-foreground">
                Start scheduling movies with friends
              </p>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm font-medium text-center">
                  {error}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full h-12 text-base font-medium relative hover:bg-muted/50 transition-colors"
                onClick={handleGoogleSignUp}
                disabled={isGoogleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg
                    className="mr-2 h-5 w-5"
                    aria-hidden="true"
                    focusable="false"
                    data-prefix="fab"
                    data-icon="google"
                    role="img"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 488 512"
                  >
                    <path
                      fill="currentColor"
                      d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                    ></path>
                  </svg>
                )}
                Sign up with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimum 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Account
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{" "}
              </span>
              <Link
                href="/auth/login"
                className="text-primary hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <Link
                href="/"
                className="hover:text-primary transition-colors flex items-center justify-center gap-1"
              >
                <ArrowLeft className="h-3 w-3" /> Back to Home
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} MovieScheduler
        </div>
      </div>

      <div className="hidden bg-muted lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/20 mix-blend-overlay z-10" />
        <img
          src={`https://image.tmdb.org/t/p/original/${bgImage}`}
          alt="Movie background"
          className="h-full w-full object-cover dark:brightness-[0.4] grayscale-20 transition-opacity duration-1000"
        />
        <div className="absolute bottom-10 left-10 right-10 z-20 text-white">
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              "Movies are a door to imagination. Open it with friends."
            </p>
            <footer className="text-sm opacity-80">MovieScheduler Team</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
