import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  LayoutDashboard,
  BookOpen,
  Briefcase,
  Wand2,
  FolderSearch,
  BarChart3,
  Users,
  Award,
  GraduationCap,
  Bot,
  Search,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "AI Curriculum", path: "/curriculum", icon: BookOpen },
  { label: "Career Explorer", path: "/academy/careers", icon: Briefcase },
  { label: "AI Creation Studio", path: "/ai-tools", icon: Wand2 },
  { label: "Resource Finder", path: "/resources", icon: FolderSearch },
  { label: "Impact Dashboard", path: "/impact", icon: BarChart3 },
  { label: "Mentor Network", path: "/academy/mentors", icon: Users },
  { label: "Achievements", path: "/achievements", icon: Award },
  { label: "STAAR Test Prep", path: "/academy/staar-prep", icon: GraduationCap },
  { label: "Spark AI", path: "/ai-companion", icon: Bot },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleNavigate = useCallback(
    (path: string) => {
      setLocation(path);
      setOpen(false);
      setQuery("");
    },
    [setLocation]
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  function handleInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        handleNavigate(filtered[selectedIndex].path);
      }
    }
  }

  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="p-0 gap-0 max-w-md"
        data-testid="dialog-command-palette"
        aria-label="Command palette"
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <div className="flex items-center gap-2 border-b px-3" data-testid="container-command-search" aria-label="Search container">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search pages..."
            className="border-0 focus-visible:ring-0 shadow-none"
            data-testid="input-command-search"
            aria-label="Search pages"
          />
        </div>
        <ul
          ref={listRef}
          className="max-h-72 overflow-y-auto p-2"
          role="listbox"
          data-testid="list-command-results"
          aria-label="Navigation results"
        >
          {filtered.length === 0 && (
            <li
              className="px-3 py-6 text-center text-sm text-muted-foreground"
              data-testid="text-command-no-results"
              aria-label="No results found"
            >
              No results found
            </li>
          )}
          {filtered.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selectedIndex;
            return (
              <li
                key={item.path}
                role="option"
                aria-selected={isSelected}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm cursor-pointer hover-elevate ${
                  isSelected ? "bg-accent text-accent-foreground" : ""
                }`}
                onClick={() => handleNavigate(item.path)}
                data-testid={`item-command-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                aria-label={item.label}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span data-testid={`text-command-label-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>{item.label}</span>
                <span className="ml-auto text-xs text-muted-foreground" data-testid={`text-command-path-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>{item.path}</span>
              </li>
            );
          })}
        </ul>
        <div
          className="border-t px-3 py-2 text-xs text-muted-foreground flex items-center gap-4 flex-wrap"
          data-testid="container-command-hints"
          aria-label="Keyboard shortcuts"
        >
          <span data-testid="text-command-hint-navigate">Use arrow keys to navigate</span>
          <span data-testid="text-command-hint-select">Enter to select</span>
          <span data-testid="text-command-hint-close">Esc to close</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
