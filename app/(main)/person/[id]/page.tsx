"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Link } from "next-view-transitions";
import {
  Loader2,
  Instagram,
  Twitter,
  Link as LinkIcon,
  Film,
  Tv,
  Star,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SidebarTrigger } from "@/components/ui/sidebar";

interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday: string;
  deathday: string | null;
  place_of_birth: string;
  profile_path: string;
  known_for_department: string;
  also_known_as: string[];
  gender: number;
  popularity: number;
  homepage: string | null;
  credits: {
    cast: CreditItem[];
    crew: CreditItem[];
  };
  images: { file_path: string }[];
  external_ids: {
    instagram_id?: string;
    twitter_id?: string;
    facebook_id?: string;
    imdb_id?: string;
  };
}

interface CreditItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  media_type: string;
  character?: string;
  job?: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

function calculateAge(birthday: string, deathday?: string | null): number {
  const endDate = deathday ? new Date(deathday) : new Date();
  const birthDate = new Date(birthday);
  let age = endDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = endDate.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && endDate.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function PersonPage() {
  const params = useParams();
  const personId = params.id as string;
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPerson = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tmdb/person/${personId}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setPerson(data);
      } catch (err) {
        setError("Failed to load person details");
      } finally {
        setIsLoading(false);
      }
    };

    if (personId) {
      fetchPerson();
    }
  }, [personId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !person) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || "Person not found"}</p>
        <Link href="/search">
          <Button variant="outline">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
        </Link>
      </div>
    );
  }

  const knownFor = person.credits.cast.slice(0, 20);
  const allCredits = [...person.credits.cast].sort((a, b) => {
    const dateA = a.release_date || a.first_air_date || "";
    const dateB = b.release_date || b.first_air_date || "";
    return dateB.localeCompare(dateA);
  });

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="w-px h-4 bg-border/50 mx-2" />
        <div className="flex items-center gap-2 font-medium">
          Person Details
        </div>
      </header>
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="min-h-full pb-10">
          {/* Back button */}
          <div className="fixed top-20 left-6 z-50 md:top-6 md:left-20 lg:hidden">
            <Link href="/search">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full bg-background/80 backdrop-blur-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              {/* Profile Image */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div className="relative w-[250px] h-[375px] md:w-[300px] md:h-[450px] rounded-2xl overflow-hidden shadow-2xl">
                  {person.profile_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/h632${person.profile_path}`}
                      alt={person.name}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Film className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    {person.name}
                  </h1>

                  {/* Biography */}
                  {person.biography && (
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-3xl">
                      {person.biography.length > 800
                        ? `${person.biography.slice(0, 800)}...`
                        : person.biography}
                    </p>
                  )}
                </div>

                {/* Meta Info */}
                <div className="space-y-3">
                  {person.known_for_department && (
                    <div className="flex items-start gap-4">
                      <span className="text-muted-foreground text-sm w-28 flex-shrink-0">
                        Known For
                      </span>
                      <span className="text-foreground text-sm font-medium">
                        {person.known_for_department}
                      </span>
                    </div>
                  )}

                  {person.birthday && (
                    <div className="flex items-start gap-4">
                      <span className="text-muted-foreground text-sm w-28 flex-shrink-0">
                        Born
                      </span>
                      <span className="text-foreground text-sm font-medium">
                        {formatDate(person.birthday)} (age{" "}
                        {calculateAge(person.birthday, person.deathday)})
                      </span>
                    </div>
                  )}

                  {person.deathday && (
                    <div className="flex items-start gap-4">
                      <span className="text-muted-foreground text-sm w-28 flex-shrink-0">
                        Died
                      </span>
                      <span className="text-foreground text-sm font-medium">
                        {formatDate(person.deathday)}
                      </span>
                    </div>
                  )}

                  {person.place_of_birth && (
                    <div className="flex items-start gap-4">
                      <span className="text-muted-foreground text-sm w-28 flex-shrink-0">
                        Place of Birth
                      </span>
                      <span className="text-foreground text-sm font-medium">
                        {person.place_of_birth}
                      </span>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-3 pt-2">
                  {person.external_ids.instagram_id && (
                    <a
                      href={`https://instagram.com/${person.external_ids.instagram_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                  {person.external_ids.twitter_id && (
                    <a
                      href={`https://twitter.com/${person.external_ids.twitter_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Twitter className="h-5 w-5" />
                    </a>
                  )}
                  {person.external_ids.imdb_id && (
                    <a
                      href={`https://imdb.com/name/${person.external_ids.imdb_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <Film className="h-5 w-5" />
                    </a>
                  )}
                  {person.homepage && (
                    <a
                      href={person.homepage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <LinkIcon className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="known-for" className="mt-12">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger
                  value="known-for"
                  className="data-[state=active]:bg-background"
                >
                  Known For
                </TabsTrigger>
                <TabsTrigger
                  value="credits"
                  className="data-[state=active]:bg-background"
                >
                  Credits
                </TabsTrigger>
                <TabsTrigger
                  value="photos"
                  className="data-[state=active]:bg-background"
                >
                  Photos
                </TabsTrigger>
              </TabsList>

              {/* Known For Tab */}
              <TabsContent value="known-for" className="mt-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {knownFor.map((item) => (
                    <Link
                      key={`${item.media_type}-${item.id}`}
                      href={`/${item.media_type === "tv" ? "series" : "movie"}/${
                        item.id
                      }`}
                      className="group"
                    >
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-md transition-all group-hover:shadow-xl group-hover:-translate-y-1">
                        {item.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                            alt={item.title || item.name || ""}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {item.media_type === "tv" ? (
                              <Tv className="h-8 w-8 text-muted-foreground/30" />
                            ) : (
                              <Film className="h-8 w-8 text-muted-foreground/30" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="mt-2">
                        <p className="text-sm font-medium line-clamp-1">
                          {item.title || item.name}
                        </p>
                        {item.character && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {item.character}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </TabsContent>

              {/* Credits Tab */}
              <TabsContent value="credits" className="mt-6">
                <div className="space-y-2">
                  {allCredits.slice(0, 50).map((item, index) => (
                    <Link
                      key={`${item.id}-${index}`}
                      href={`/${item.media_type === "tv" ? "series" : "movie"}/${
                        item.id
                      }`}
                      className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="relative w-12 h-18 flex-shrink-0 rounded overflow-hidden bg-muted">
                        {item.poster_path ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                            alt={item.title || item.name || ""}
                            width={48}
                            height={72}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-12 h-18 flex items-center justify-center">
                            {item.media_type === "tv" ? (
                              <Tv className="h-5 w-5 text-muted-foreground/30" />
                            ) : (
                              <Film className="h-5 w-5 text-muted-foreground/30" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium group-hover:text-primary transition-colors">
                          {item.title || item.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {item.character && <span>as {item.character}</span>}
                          {(item.release_date || item.first_air_date) && (
                            <span>
                              •{" "}
                              {new Date(
                                item.release_date || item.first_air_date || "",
                              ).getFullYear()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span>{item.vote_average?.toFixed(1) || "N/A"}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </TabsContent>

              {/* Photos Tab */}
              <TabsContent value="photos" className="mt-6">
                {person.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {person.images.map((image, index) => (
                      <div
                        key={index}
                        className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted shadow-md hover:shadow-xl transition-shadow"
                      >
                        <Image
                          src={`https://image.tmdb.org/t/p/w500${image.file_path}`}
                          alt={`${person.name} photo ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No photos available
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
