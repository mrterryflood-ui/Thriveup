import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, Trash2, Loader2 } from "lucide-react";
import { ErrorRetry } from "@/components/error-retry";
import { PageHeader } from "@/components/page-header";
import type { AcademyEvent } from "@shared/schema";

function getCategoryBadge(category: string) {
  switch (category) {
    case "competition":
      return <Badge variant="secondary" data-testid={`badge-category-${category}`}>{category}</Badge>;
    case "mentor":
      return <Badge variant="outline" data-testid={`badge-category-${category}`}>{category}</Badge>;
    case "quest":
      return <Badge variant="destructive" data-testid={`badge-category-${category}`}>{category}</Badge>;
    case "special":
      return <Badge className="bg-[#800000] text-white" data-testid={`badge-category-${category}`}>{category}</Badge>;
    default:
      return <Badge variant="default" data-testid={`badge-category-${category}`}>{category}</Badge>;
  }
}

function groupEvents(events: AcademyEvent[]) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));

  const todayStr = today.toISOString().split("T")[0];

  const sorted = [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate));

  const todayEvents: AcademyEvent[] = [];
  const thisWeekEvents: AcademyEvent[] = [];
  const upcomingEvents: AcademyEvent[] = [];

  for (const event of sorted) {
    const eventDate = new Date(event.eventDate + "T00:00:00");
    if (event.eventDate === todayStr) {
      todayEvents.push(event);
    } else if (eventDate > today && eventDate <= endOfWeek) {
      thisWeekEvents.push(event);
    } else if (eventDate > today) {
      upcomingEvents.push(event);
    }
  }

  return { todayEvents, thisWeekEvents, upcomingEvents };
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function formatTime(timeStr: string | null) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${minutes} ${ampm}`;
}

function EventCard({ event, isAdmin, onDelete }: { event: AcademyEvent; isAdmin: boolean; onDelete: (id: string) => void }) {
  return (
    <Card className="p-4" data-testid={`card-event-${event.id}`}>
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base" data-testid={`text-event-title-${event.id}`}>{event.title}</h3>
            {getCategoryBadge(event.category)}
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground" data-testid={`text-event-desc-${event.id}`}>{event.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(event.eventDate)}
            </span>
            {event.eventTime && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(event.eventTime)}
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(event.id)}
            data-testid={`button-delete-event-${event.id}`}
            aria-label="Delete event"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </Card>
  );
}

function EventSection({ title, events, isAdmin, onDelete }: { title: string; events: AcademyEvent[]; isAdmin: boolean; onDelete: (id: string) => void }) {
  if (events.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-bold" data-testid={`text-section-${title.toLowerCase().replace(/\s/g, "-")}`}>{title}</h2>
      {events.map((event) => (
        <EventCard key={event.id} event={event} isAdmin={isAdmin} onDelete={onDelete} />
      ))}
    </div>
  );
}

export default function AcademyCalendarPage() {
  useEffect(() => { document.title = 'Calendar | AI Mastery Academy'; }, []);
  const { user } = useAuth();
  const isAdmin = !!(user as any)?.isAdmin;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [category, setCategory] = useState("school");
  const [showForm, setShowForm] = useState(false);

  const { data: events = [], isLoading, error, refetch } = useQuery<AcademyEvent[]>({
    queryKey: ["/api/events"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; eventDate: string; eventTime: string; category: string }) => {
      const res = await apiRequest("POST", "/api/events", {
        ...data,
        createdByUserId: (user as any)?.id || "",
        createdByName: (user as any)?.firstName || "Admin",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setTitle("");
      setDescription("");
      setEventDate("");
      setEventTime("");
      setCategory("school");
      setShowForm(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const { todayEvents, thisWeekEvents, upcomingEvents } = groupEvents(events);
  const noEvents = todayEvents.length === 0 && thisWeekEvents.length === 0 && upcomingEvents.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <PageHeader
          title="Academy Calendar"
          description="Stay up to date with upcoming events, competitions, and activities."
          breadcrumbs={[
            { label: "Academy", href: "/academy" },
            { label: "Calendar" },
          ]}
        />
      </div>
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {isAdmin && (
          <div className="space-y-3">
            {!showForm ? (
              <Button onClick={() => setShowForm(true)} className="bg-[#800000]" data-testid="button-show-create-event">
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            ) : (
              <Card className="p-4 space-y-3" data-testid="card-create-event-form">
                <h2 className="font-semibold text-lg">New Event</h2>
                <Input
                  placeholder="Event title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-event-title"
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-event-description"
                />
                <div className="flex gap-3 flex-wrap">
                  <Input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-auto"
                    data-testid="input-event-date"
                  />
                  <Input
                    type="time"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="w-auto"
                    data-testid="input-event-time"
                  />
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-[160px]" data-testid="select-event-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="school">School</SelectItem>
                      <SelectItem value="competition">Competition</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="quest">Quest</SelectItem>
                      <SelectItem value="special">Special</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() => createMutation.mutate({ title, description, eventDate, eventTime, category })}
                    disabled={!title || !eventDate || createMutation.isPending}
                    className="bg-[#800000]"
                    data-testid="button-submit-event"
                  >
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create Event
                  </Button>
                  <Button variant="outline" onClick={() => setShowForm(false)} data-testid="button-cancel-event">
                    Cancel
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}

        {error ? (
          <div className="p-6"><ErrorRetry message="Failed to load calendar events. Please try again." onRetry={refetch} /></div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" data-testid="loading-events" />
          </div>
        ) : noEvents ? (
          <Card className="p-8 text-center" data-testid="card-no-events">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No upcoming events scheduled.</p>
          </Card>
        ) : (
          <div className="space-y-6">
            <EventSection title="Today" events={todayEvents} isAdmin={isAdmin} onDelete={(id) => deleteMutation.mutate(id)} />
            <EventSection title="This Week" events={thisWeekEvents} isAdmin={isAdmin} onDelete={(id) => deleteMutation.mutate(id)} />
            <EventSection title="Upcoming" events={upcomingEvents} isAdmin={isAdmin} onDelete={(id) => deleteMutation.mutate(id)} />
          </div>
        )}
      </div>
    </div>
  );
}
