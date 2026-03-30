"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
} from "lucide-react";
import {
  getTourById,
  updateTour,
  type CreateTourData,
} from "@/lib/services/tours.service";
import { saveTourMedia } from "@/lib/services/storage.service";
import { useAuthStore } from "@/store/auth";
import { TourMediaUploader } from "@/components/admin/tour-media-uploader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
}

export default function EditTourPage() {
  const router = useRouter();
  const params = useParams();
  const tourId = params?.id as string;
  const { user, isAuthenticated } = useAuthStore();

  // Loading state
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [maxGuests, setMaxGuests] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  // Tags
  const [isTopDestination, setIsTopDestination] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [isPopular, setIsPopular] = useState(false);

  // Itinerary
  const [itinerary, setItinerary] = useState<ItineraryDay[]>([
    { day: 1, title: "", description: "", activities: [""] },
  ]);
  const [expandedDays, setExpandedDays] = useState<number[]>([]);

  // Price Includes/Excludes
  const [priceIncludes, setPriceIncludes] = useState<string[]>([""]);
  const [priceExcludes, setPriceExcludes] = useState<string[]>([""]);

  // Media
  const [media, setMedia] = useState<{ images: string[]; videos: string[] }>({
    images: [],
    videos: [],
  });

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }

    async function fetchTour() {
      try {
        setLoading(true);
        const tour = await getTourById(tourId);
        if (!tour) {
          setNotFound(true);
          return;
        }

        // Populate form fields
        setTitle(tour.title || "");
        setSlug(tour.slug || "");
        setCountry(tour.country || "");
        setCity(tour.city || "");
        setDescription(tour.description || "");
        setBasePrice(tour.price ? String(tour.price) : "");
        setMaxGuests(tour.maxGuests ? String(tour.maxGuests) : "");
        setStartDate(tour.startDate || "");
        setExpireDate(tour.expireDate || "");
        setStatus(tour.status === "published" ? "published" : "draft");

        // Tags
        const tags: string[] = tour.tags || [];
        setIsTopDestination(tags.includes("top"));
        setIsNew(tags.includes("new"));
        setIsPopular(tags.includes("popular"));

        // Itinerary
        if (tour.itinerary && Array.isArray(tour.itinerary) && tour.itinerary.length > 0) {
          setItinerary(
            tour.itinerary.map((d: any, i: number) => ({
              day: d.day || i + 1,
              title: d.title || "",
              description: d.description || "",
              activities: d.activities?.length ? d.activities : [""],
            }))
          );
        }

        // Price includes/excludes
        if (tour.priceIncludes?.length) {
          setPriceIncludes(tour.priceIncludes);
        }
        if (tour.priceExcludes?.length) {
          setPriceExcludes(tour.priceExcludes);
        }

        // Media
        if (tour.media) {
          setMedia({
            images: tour.media.images || [],
            videos: tour.media.videos || [],
          });
        }
      } catch (err: any) {
        setError(err?.message || "Failed to load tour");
      } finally {
        setLoading(false);
      }
    }

    fetchTour();
  }, [isAuthenticated, user, router, tourId]);

  // Auto-generate slug from title
  const generateSlug = useCallback((value: string) => {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }, []);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setSlug(generateSlug(value));
  };

  // Itinerary helpers
  const addItineraryDay = () => {
    const newDay = itinerary.length + 1;
    setItinerary([
      ...itinerary,
      { day: newDay, title: "", description: "", activities: [""] },
    ]);
    setExpandedDays([...expandedDays, newDay]);
  };

  const removeItineraryDay = (dayIndex: number) => {
    const updated = itinerary
      .filter((_, i) => i !== dayIndex)
      .map((item, i) => ({ ...item, day: i + 1 }));
    setItinerary(updated);
  };

  const updateItineraryField = (
    dayIndex: number,
    field: keyof ItineraryDay,
    value: any
  ) => {
    const updated = [...itinerary];
    (updated[dayIndex] as any)[field] = value;
    setItinerary(updated);
  };

  const addActivity = (dayIndex: number) => {
    const updated = [...itinerary];
    updated[dayIndex].activities.push("");
    setItinerary(updated);
  };

  const removeActivity = (dayIndex: number, actIndex: number) => {
    const updated = [...itinerary];
    updated[dayIndex].activities = updated[dayIndex].activities.filter(
      (_, i) => i !== actIndex
    );
    setItinerary(updated);
  };

  const updateActivity = (dayIndex: number, actIndex: number, value: string) => {
    const updated = [...itinerary];
    updated[dayIndex].activities[actIndex] = value;
    setItinerary(updated);
  };

  const toggleDayExpanded = (day: number) => {
    setExpandedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  // Price includes/excludes helpers
  const addInclude = () => setPriceIncludes([...priceIncludes, ""]);
  const removeInclude = (i: number) =>
    setPriceIncludes(priceIncludes.filter((_, idx) => idx !== i));
  const updateInclude = (i: number, val: string) => {
    const updated = [...priceIncludes];
    updated[i] = val;
    setPriceIncludes(updated);
  };

  const addExclude = () => setPriceExcludes([...priceExcludes, ""]);
  const removeExclude = (i: number) =>
    setPriceExcludes(priceExcludes.filter((_, idx) => idx !== i));
  const updateExclude = (i: number, val: string) => {
    const updated = [...priceExcludes];
    updated[i] = val;
    setPriceExcludes(updated);
  };

  // Validation
  const isValid =
    title.trim() &&
    slug.trim() &&
    country.trim() &&
    city.trim() &&
    description.trim() &&
    Number(basePrice) > 0 &&
    Number(maxGuests) > 0;

  // Submit
  const handleSubmit = async (submitStatus: "draft" | "published") => {
    if (!user) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const tourData: CreateTourData = {
        title: title.trim(),
        slug: slug.trim(),
        country: country.trim(),
        city: city.trim(),
        description: description.trim(),
        basePrice: Number(basePrice),
        maxGuests: Number(maxGuests),
        startDate,
        expireDate,
        itinerary: itinerary
          .filter((d) => d.title.trim())
          .map((d) => ({
            day: d.day,
            title: d.title.trim(),
            description: d.description.trim(),
            activities: d.activities.filter((a) => a.trim()),
          })),
        priceIncludes: priceIncludes.filter((p) => p.trim()),
        priceExcludes: priceExcludes.filter((p) => p.trim()),
        tags: { isTopDestination, isNew, isPopular },
        status: submitStatus,
      };

      await updateTour(tourId, tourData);
      await saveTourMedia(tourId, media);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err?.message || "Failed to update tour");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) return null;

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="border-b bg-background/95 backdrop-blur sticky top-0 z-30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-40 rounded-xl" />
            </div>
            <div>
              <Skeleton className="h-96 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (notFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto">
              <X className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Tour Not Found</h2>
            <p className="text-muted-foreground text-sm">
              The tour you are trying to edit does not exist or has been deleted.
            </p>
            <Button asChild>
              <Link href="/admin/tours">Back to Tours</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="bg-transparent">
              <Link href="/admin/tours">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Tours</span>
              </Link>
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground truncate">Edit Tour</h1>
                <Badge
                  variant="outline"
                  className={
                    status === "published"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
                  }
                >
                  {status === "published" ? "Published" : "Draft"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {title || "Untitled tour"} - ID: {tourId}
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                className="bg-transparent gap-2"
                disabled={!isValid || submitting}
                onClick={() => handleSubmit("draft")}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Draft
              </Button>
              <Button
                className="gap-2"
                disabled={!isValid || submitting}
                onClick={() => handleSubmit("published")}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Update & Publish
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Tour updated successfully!
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
                <CardDescription>
                  Core details about the tour listing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Tour Title <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g. Explore the Omo Valley"
                    value={title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    placeholder="auto-generated-from-title"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used in the tour URL: /tours/{slug || "your-slug-here"}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">
                      Country <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="country"
                      placeholder="e.g. Ethiopia"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="e.g. Addis Ababa"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this tour in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Pricing & Capacity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing & Capacity</CardTitle>
                <CardDescription>Set tour pricing and guest limits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">
                      Base Price (USD) <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        $
                      </span>
                      <Input
                        id="basePrice"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={basePrice}
                        onChange={(e) => setBasePrice(e.target.value)}
                        className="pl-7"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxGuests">
                      Max Guests <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="maxGuests"
                      type="number"
                      min="1"
                      placeholder="e.g. 12"
                      value={maxGuests}
                      onChange={(e) => setMaxGuests(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule</CardTitle>
                <CardDescription>
                  Tour availability start and end dates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expireDate">Expire Date</Label>
                    <Input
                      id="expireDate"
                      type="date"
                      value={expireDate}
                      onChange={(e) => setExpireDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Itinerary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Itinerary</CardTitle>
                    <CardDescription>
                      Day-by-day plan for this tour
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent gap-1.5"
                    onClick={addItineraryDay}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Day
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {itinerary.map((day, dayIdx) => {
                  const isExpanded = expandedDays.includes(day.day);
                  return (
                    <div
                      key={day.day}
                      className="border rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => toggleDayExpanded(day.day)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            Day {day.day}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {day.title || "Untitled day"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {itinerary.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="bg-transparent h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeItineraryDay(dayIdx);
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="p-4 space-y-4">
                          <div className="space-y-2">
                            <Label>Day Title</Label>
                            <Input
                              placeholder="e.g. Arrival in Addis Ababa"
                              value={day.title}
                              onChange={(e) =>
                                updateItineraryField(dayIdx, "title", e.target.value)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Description</Label>
                            <Textarea
                              placeholder="Describe this day's plan..."
                              value={day.description}
                              onChange={(e) =>
                                updateItineraryField(
                                  dayIdx,
                                  "description",
                                  e.target.value
                                )
                              }
                              rows={3}
                              className="resize-none"
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Label>Activities</Label>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="bg-transparent h-7 text-xs gap-1"
                                onClick={() => addActivity(dayIdx)}
                              >
                                <Plus className="h-3 w-3" />
                                Add
                              </Button>
                            </div>
                            {day.activities.map((activity, actIdx) => (
                              <div
                                key={actIdx}
                                className="flex items-center gap-2"
                              >
                                <span className="text-xs text-muted-foreground w-5 shrink-0">
                                  {actIdx + 1}.
                                </span>
                                <Input
                                  placeholder="e.g. Visit National Museum"
                                  value={activity}
                                  onChange={(e) =>
                                    updateActivity(dayIdx, actIdx, e.target.value)
                                  }
                                  className="flex-1"
                                />
                                {day.activities.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="bg-transparent h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => removeActivity(dayIdx, actIdx)}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Price Includes / Excludes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Price Includes</CardTitle>
                      <CardDescription>What is included in the tour price</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent gap-1.5"
                      onClick={addInclude}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {priceIncludes.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-emerald-500 text-sm shrink-0">+</span>
                      <Input
                        placeholder="e.g. Airport transfer"
                        value={item}
                        onChange={(e) => updateInclude(i, e.target.value)}
                        className="flex-1"
                      />
                      {priceIncludes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="bg-transparent h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeInclude(i)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Price Excludes</CardTitle>
                      <CardDescription>What is not included</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent gap-1.5"
                      onClick={addExclude}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {priceExcludes.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-destructive text-sm shrink-0">-</span>
                      <Input
                        placeholder="e.g. International flights"
                        value={item}
                        onChange={(e) => updateExclude(i, e.target.value)}
                        className="flex-1"
                      />
                      {priceExcludes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="bg-transparent h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeExclude(i)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Media Upload */}
            <TourMediaUploader
              tourId={tourId}
              existingMedia={media}
              onMediaChange={setMedia}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Publish Settings</CardTitle>
                <CardDescription>
                  Control visibility and categorization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val) =>
                      setStatus(val as "draft" | "published")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-amber-500" />
                          Draft
                        </div>
                      </SelectItem>
                      <SelectItem value="published">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          Published
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Tags */}
                <div className="space-y-4">
                  <Label>Tags</Label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Top Destination
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Featured in top destinations section
                        </p>
                      </div>
                      <Switch
                        checked={isTopDestination}
                        onCheckedChange={setIsTopDestination}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">New</p>
                        <p className="text-xs text-muted-foreground">
                          Show "New" badge on listing
                        </p>
                      </div>
                      <Switch checked={isNew} onCheckedChange={setIsNew} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Popular
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Show "Popular" badge on listing
                        </p>
                      </div>
                      <Switch
                        checked={isPopular}
                        onCheckedChange={setIsPopular}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Preview Tags */}
                {(isTopDestination || isNew || isPopular) && (
                  <div className="space-y-2">
                    <Label>Active Tags</Label>
                    <div className="flex flex-wrap gap-2">
                      {isTopDestination && (
                        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                          Top Destination
                        </Badge>
                      )}
                      {isNew && (
                        <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800">
                          New
                        </Badge>
                      )}
                      {isPopular && (
                        <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                          Popular
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <Separator />

                {/* Summary */}
                <div className="space-y-2">
                  <Label>Summary</Label>
                  <div className="text-sm space-y-1.5 text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Title</span>
                      <span className="text-foreground font-medium truncate ml-4 max-w-[160px]">
                        {title || "--"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location</span>
                      <span className="text-foreground font-medium">
                        {city && country ? `${city}, ${country}` : "--"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price</span>
                      <span className="text-foreground font-medium">
                        {basePrice ? `$${Number(basePrice).toLocaleString()}` : "--"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Max Guests</span>
                      <span className="text-foreground font-medium">
                        {maxGuests || "--"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Days</span>
                      <span className="text-foreground font-medium">
                        {itinerary.length}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    className="w-full gap-2"
                    disabled={!isValid || submitting}
                    onClick={() => handleSubmit(status)}
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full bg-transparent"
                    asChild
                  >
                    <Link href="/admin/tours">Cancel</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
