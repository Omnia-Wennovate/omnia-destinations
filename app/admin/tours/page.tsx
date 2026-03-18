"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  DollarSign,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Search,
  ArrowLeft,
  Plus,
  RefreshCw,
  Filter,
  Tag,
} from "lucide-react";
import {
  getToursFromFirestore,
  updateTourStatus,
  deleteTour,
  type FirestoreTour,
} from "@/lib/services/tours.service";
import { useAuthStore } from "@/store/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StatusFilter = "all" | "published" | "draft" | "archived";

export default function AdminToursPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [tours, setTours] = useState<FirestoreTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<FirestoreTour | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTours = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getToursFromFirestore();
      setTours(data);
    } catch {
      console.error("[v0] Failed to fetch tours");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push("/login");
      return;
    }
    fetchTours();
  }, [isAuthenticated, user, router, fetchTours]);

  const handleTogglePublish = async (tour: FirestoreTour) => {
    setActionLoading(tour.id);
    try {
      const newStatus = tour.status === "published" ? "draft" : "published";
      await updateTourStatus(tour.id, newStatus);
      setTours((prev) =>
        prev.map((t) => (t.id === tour.id ? { ...t, status: newStatus } : t))
      );
    } catch {
      console.error("[v0] Failed to update tour status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!tourToDelete) return;
    setActionLoading(tourToDelete.id);
    try {
      await deleteTour(tourToDelete.id);
      setTours((prev) => prev.filter((t) => t.id !== tourToDelete.id));
    } catch {
      console.error("[v0] Failed to delete tour");
    } finally {
      setActionLoading(null);
      setDeleteDialogOpen(false);
      setTourToDelete(null);
    }
  };

  const filteredTours = tours.filter((tour) => {
    const matchesSearch =
      tour.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tour.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || tour.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: tours.length,
    published: tours.filter((t) => t.status === "published").length,
    draft: tours.filter((t) => t.status === "draft").length,
    archived: tours.filter((t) => t.status === "archived").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800">
            Published
          </Badge>
        );
      case "draft":
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800">
            Draft
          </Badge>
        );
      case "archived":
        return (
          <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800/30 dark:text-gray-400 border-gray-200 dark:border-gray-700">
            Archived
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTagBadge = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "top":
        return (
          <Badge
            key={tag}
            variant="outline"
            className="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs"
          >
            Top
          </Badge>
        );
      case "new":
        return (
          <Badge
            key={tag}
            variant="outline"
            className="bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border-rose-200 dark:border-rose-800 text-xs"
          >
            New
          </Badge>
        );
      case "popular":
        return (
          <Badge
            key={tag}
            variant="outline"
            className="bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400 border-orange-200 dark:border-orange-800 text-xs"
          >
            Popular
          </Badge>
        );
      default:
        return (
          <Badge key={tag} variant="outline" className="text-xs">
            {tag}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-80 mb-8" />
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="space-y-1">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-8 w-8 ml-auto" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="bg-transparent"
            >
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Dashboard</span>
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                Manage Tours
              </h1>
              <p className="text-muted-foreground mt-1">
                View, edit, and manage all tours from Firestore
              </p>
            </div>
            <Button className="gap-2" asChild>
              <Link href="/admin/tours/create">
                <Plus className="h-4 w-4" />
                Add Tour
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {(
            [
              { label: "All Tours", key: "all" as StatusFilter, color: "text-foreground" },
              { label: "Published", key: "published" as StatusFilter, color: "text-emerald-600" },
              { label: "Drafts", key: "draft" as StatusFilter, color: "text-amber-600" },
              { label: "Archived", key: "archived" as StatusFilter, color: "text-gray-500" },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`p-4 rounded-xl border text-left transition-all ${statusFilter === item.key
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-primary/30"
                }`}
            >
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>
                {statusCounts[item.key]}
              </p>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tours by title or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as StatusFilter)}
          >
            <SelectTrigger className="w-full sm:w-44">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchTours}
            className="bg-transparent shrink-0"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>

        {/* Tours Table */}
        <Card className="border-border/50">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-lg">Tours Collection</CardTitle>
            <CardDescription>
              {filteredTours.length} tour{filteredTours.length !== 1 && "s"}{" "}
              found
              {statusFilter !== "all" && ` with status "${statusFilter}"`}
              {searchQuery && ` matching "${searchQuery}"`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredTours.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  No tours found
                </h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  {tours.length === 0
                    ? 'No tours in your Firestore "tours" collection yet. Add your first tour to get started.'
                    : "No tours match your current search or filter criteria."}
                </p>
                {tours.length > 0 && (
                  <Button
                    variant="outline"
                    className="mt-4 bg-transparent"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-12 pl-6">#</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Bookings</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="w-12 pr-6">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTours.map((tour, index) => (
                      <TableRow
                        key={tour.id}
                        className="group"
                      >
                        <TableCell className="pl-6 font-medium text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {tour.title}
                            </span>
                            {tour.duration && (
                              <span className="text-xs text-muted-foreground">
                                {tour.duration}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>{tour.country}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 font-semibold text-foreground">
                            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                            {tour.price.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(tour.status)}</TableCell>
                        <TableCell className="text-right font-medium text-foreground">
                          {tour.bookingCount}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 flex-wrap">
                            {tour.tags.length > 0 ? (
                              tour.tags.map((tag: string) => getTagBadge(tag))
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                --
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="pr-6">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="bg-transparent opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                disabled={actionLoading === tour.id}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem className="gap-2 cursor-pointer" asChild>
                                <Link href={`/admin/tours/${tour.id}/edit`}>
                                  <Pencil className="h-4 w-4" />
                                  Edit Tour
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => handleTogglePublish(tour)}
                              >
                                {tour.status === "published" ? (
                                  <>
                                    <EyeOff className="h-4 w-4" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4" />
                                    Publish
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => {
                                  setTourToDelete(tour);
                                  setDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Tour
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table Footer Summary */}
        {filteredTours.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 text-sm text-muted-foreground gap-2">
            <span>
              Showing {filteredTours.length} of {tours.length} tours
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Total Bookings:{" "}
                <strong className="text-foreground">
                  {filteredTours
                    .reduce((sum, t) => sum + t.bookingCount, 0)
                    .toLocaleString()}
                </strong>
              </span>
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5" />
                Avg Price:{" "}
                <strong className="text-foreground">
                  $
                  {filteredTours.length > 0
                    ? Math.round(
                      filteredTours.reduce((sum, t) => sum + t.price, 0) /
                      filteredTours.length
                    ).toLocaleString()
                    : 0}
                </strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tour</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{tourToDelete?.title}</strong>? This action cannot be
              undone and will permanently remove the tour from Firestore.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="bg-transparent"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={actionLoading === tourToDelete?.id}
            >
              {actionLoading === tourToDelete?.id
                ? "Deleting..."
                : "Delete Tour"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
