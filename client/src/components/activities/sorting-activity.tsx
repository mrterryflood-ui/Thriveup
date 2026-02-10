import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw, CheckCircle2, X } from "lucide-react";

interface SortingData {
  type: "sorting";
  categories: string[];
  items: { text: string; category: string }[];
  instructions: string;
}

export default function SortingActivity({ data }: { data: SortingData }) {
  const [sorted, setSorted] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    data.categories.forEach(c => { initial[c] = []; });
    return initial;
  });
  const [unsorted, setUnsorted] = useState<string[]>(() =>
    data.items.map(i => i.text).sort(() => Math.random() - 0.5)
  );
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);

  const allSorted = unsorted.length === 0;

  function handleCategoryClick(category: string) {
    if (!selectedItem) return;

    const item = data.items.find(i => i.text === selectedItem);
    if (!item) return;

    if (item.category === category) {
      setSorted(prev => ({
        ...prev,
        [category]: [...prev[category], selectedItem],
      }));
      setUnsorted(prev => prev.filter(i => i !== selectedItem));
      setFeedback({ text: `${selectedItem} goes in "${category}"!`, correct: true });
    } else {
      setFeedback({ text: `Not quite! Try another category for "${selectedItem}".`, correct: false });
    }
    setSelectedItem(null);
    setTimeout(() => setFeedback(null), 2000);
  }

  function reset() {
    const initial: Record<string, string[]> = {};
    data.categories.forEach(c => { initial[c] = []; });
    setSorted(initial);
    setUnsorted(data.items.map(i => i.text).sort(() => Math.random() - 0.5));
    setSelectedItem(null);
    setFeedback(null);
  }

  return (
    <Card className="p-6 my-6" data-testid="activity-sorting">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Sorting Activity</h3>
        <Badge variant="secondary" className="text-xs">{data.items.length - unsorted.length}/{data.items.length} sorted</Badge>
      </div>

      <p className="text-sm text-muted-foreground mb-5">{data.instructions}</p>

      {feedback && (
        <div className={`p-3 rounded-md mb-4 flex items-center gap-2 text-sm ${
          feedback.correct
            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
            : "bg-destructive/10 text-destructive"
        }`}>
          {feedback.correct ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <X className="h-4 w-4 shrink-0" />}
          {feedback.text}
        </div>
      )}

      {allSorted ? (
        <div className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <p className="font-bold text-lg mb-1">All sorted!</p>
          <p className="text-sm text-muted-foreground mb-4">You sorted everything correctly!</p>
          <Button variant="outline" size="sm" onClick={reset} data-testid="button-play-again-sorting">
            <RotateCcw className="mr-1 h-4 w-4" /> Play Again
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-2 font-medium">Pick an item to sort:</p>
            <div className="flex flex-wrap gap-2">
              {unsorted.map((item) => (
                <button
                  key={item}
                  onClick={() => setSelectedItem(item === selectedItem ? null : item)}
                  className={`px-3 py-2 rounded-md border text-sm transition-all ${
                    selectedItem === item
                      ? "bg-primary/10 border-primary ring-2 ring-primary/20 font-medium"
                      : "hover-elevate"
                  }`}
                  data-testid={`button-sort-item-${item.replace(/\s/g, '-').toLowerCase()}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className={`p-4 rounded-md border-2 border-dashed text-left transition-all ${
                  selectedItem
                    ? "hover-elevate cursor-pointer border-primary/30"
                    : "border-muted-foreground/20 cursor-default"
                }`}
                disabled={!selectedItem}
                data-testid={`button-sort-category-${category.replace(/\s/g, '-').toLowerCase()}`}
              >
                <p className="font-medium text-sm mb-2">{category}</p>
                <div className="flex flex-wrap gap-1 min-h-[32px]">
                  {sorted[category]?.map((item) => (
                    <Badge key={item} variant="secondary" className="text-xs">
                      {item}
                    </Badge>
                  ))}
                  {sorted[category]?.length === 0 && (
                    <span className="text-xs text-muted-foreground/50">Drop items here</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
