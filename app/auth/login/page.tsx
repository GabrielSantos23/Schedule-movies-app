"use client"

import { createClient } from "@/lib/client"
import { Button } from "@/components/ui/button"
import { Film, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // List of high-quality movie backdrops
  const backdrops = [
    "rAiYTfKGqDCRIIqo664sY9XZIvQ.jpg", // Interstellar
    "xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg", // Dune: Part Two
    "ilRyASD8yqsztHqnPzmExgrIViE.jpg", // Blade Runner 2049
    "fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg", // Oppenheimer
    "4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", // Spider-Man: Across the Spider-Verse
    "5P8SmMzSNYikXpxil6BYzJ16611.jpg", // The Batman
    "yDHYTfA3R0jFYba16jBB1ef8oIt.jpg", // Deadpool & Wolverine
  ]

  const [bgImage, setBgImage] = useState(backdrops[0])

  useEffect(() => {
    // Select a random backdrop on client-side mount
    const randomBackdrop = backdrops[Math.floor(Math.random() * backdrops.length)]
    setBgImage(randomBackdrop)

    // Check if user is already logged in
    const checkSession = async () => {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            router.push("/groups")
        }
    }
    checkSession()
  }, [])

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
    }
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
              <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground">
                Sign in to continue to your shared schedules
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
                onClick={handleGoogleLogin} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                  </svg>
                )}
                Continue with Google
              </Button>
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
                <Link href="/" className="hover:text-primary transition-colors flex items-center justify-center gap-1">
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
          className="h-full w-full object-cover dark:brightness-[0.4] grayscale-[20%] transition-opacity duration-1000"
        />
        <div className="absolute bottom-10 left-10 right-10 z-20 text-white">
            <blockquote className="space-y-2">
                <p className="text-lg font-medium leading-relaxed">
                    "The best way to predict the future is to create it. The best way to watch movies is to schedule them."
                </p>
                <footer className="text-sm opacity-80">
                    MovieScheduler Team
                </footer>
            </blockquote>
        </div>
      </div>
    </div>
  )
}
