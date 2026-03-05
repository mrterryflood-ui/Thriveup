import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft, Home, Target, Trash2, Trophy, Wrench,
  SmilePlus, CheckCircle2, XCircle, Star, HelpCircle,
  Copy, RotateCcw, Sparkles, Lightbulb, BookOpen,
  ChevronRight, Search, MessageSquare, ClipboardCheck
} from "lucide-react";

type ActiveView = "home" | "prompt-builder" | "sorting-game" | "prompt-improver" | "polite-quiz";

const STORAGE_KEY = "module-1-2-progress";

interface ModuleProgress {
  promptBuilderScore: number;
  sortingGameScore: number;
  promptImproverUsed: boolean;
  politeQuizScore: number;
}

function loadProgress(): ModuleProgress {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return { promptBuilderScore: 0, sortingGameScore: 0, promptImproverUsed: false, politeQuizScore: 0 };
}

function saveProgress(progress: ModuleProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

const NAV_ITEMS: { id: ActiveView; label: string; icon: typeof Home }[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "prompt-builder", label: "5 W's Builder", icon: Target },
  { id: "sorting-game", label: "Garbage or Gold", icon: Trash2 },
  { id: "prompt-improver", label: "Prompt Improver", icon: Wrench },
  { id: "polite-quiz", label: "Polite Prompts", icon: SmilePlus },
];

function PromptBuilderTool({ onScoreUpdate }: { onScoreUpdate: (score: number) => void }) {
  const [fields, setFields] = useState({ who: "", what: "", when: "", where: "", why: "" });
  const [copied, setCopied] = useState(false);

  const wLabels = [
    { key: "who" as const, label: "WHO", placeholder: "Who is this for? (e.g., a 4th grader)", icon: Target },
    { key: "what" as const, label: "WHAT", placeholder: "What do you need? (e.g., explain photosynthesis)", icon: Search },
    { key: "when" as const, label: "WHEN", placeholder: "When or time context? (e.g., for tomorrow's class)", icon: BookOpen },
    { key: "where" as const, label: "WHERE", placeholder: "Where or context? (e.g., for a science project)", icon: MessageSquare },
    { key: "why" as const, label: "WHY", placeholder: "Why do you need it? (e.g., to study for a test)", icon: HelpCircle },
  ];

  const filledCount = Object.values(fields).filter(v => v.trim().length > 0).length;
  const score = Math.round((filledCount / 5) * 100);

  useEffect(() => {
    onScoreUpdate(score);
  }, [score, onScoreUpdate]);

  const generatedPrompt = (() => {
    const parts: string[] = [];
    if (fields.what.trim()) parts.push(fields.what.trim());
    if (fields.who.trim()) parts.push(`for ${fields.who.trim()}`);
    if (fields.where.trim()) parts.push(`${fields.where.trim()}`);
    if (fields.when.trim()) parts.push(`${fields.when.trim()}`);
    if (fields.why.trim()) parts.push(`because ${fields.why.trim()}`);
    return parts.length > 0 ? parts.join(" ") : "";
  })();

  function handleCopy() {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClear() {
    setFields({ who: "", what: "", when: "", where: "", why: "" });
  }


  useEffect(() => { document.title = "Module Tools | AI Mastery Academy"; }, []);
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">5 W's Prompt Builder</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Build better prompts by filling in the 5 W's. The more details you add, the better AI can help you!
        </p>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Badge variant="secondary" data-testid="badge-quality-score">
            <Star className="h-3 w-3 mr-1" /> Quality: {score}%
          </Badge>
          <div className="flex gap-1">
            {wLabels.map(w => (
              <div
                key={w.key}
                className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                  fields[w.key].trim()
                    ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-muted text-muted-foreground"
                }`}
                data-testid={`indicator-${w.key}`}
              >
                {w.label.charAt(0)}
              </div>
            ))}
          </div>
        </div>

        <Progress value={score} className="h-2 mb-6" />

        <div className="space-y-4">
          {wLabels.map(w => (
            <div key={w.key}>
              <label className="text-sm font-medium flex items-center gap-1.5 mb-1.5">
                <w.icon className="h-3.5 w-3.5 text-primary" />
                {w.label}
              </label>
              <Input
                value={fields[w.key]}
                onChange={e => setFields(prev => ({ ...prev, [w.key]: e.target.value }))}
                placeholder={w.placeholder}
                data-testid={`input-${w.key}`}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 mt-6 flex-wrap">
          <Button onClick={handleCopy} disabled={!generatedPrompt} data-testid="button-copy-prompt">
            {copied ? <CheckCircle2 className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
            {copied ? "Copied!" : "Copy Prompt"}
          </Button>
          <Button variant="outline" onClick={handleClear} data-testid="button-clear-builder">
            <RotateCcw className="mr-1 h-4 w-4" /> Clear
          </Button>
        </div>
      </Card>

      {generatedPrompt && (
        <Card className="p-5 bg-gradient-to-br from-primary/5 to-accent/5">
          <p className="text-xs font-medium text-muted-foreground mb-2">Generated Prompt:</p>
          <p className="text-sm font-medium" data-testid="text-generated-prompt">{generatedPrompt}</p>
        </Card>
      )}

      <Card className="p-4">
        <div className="flex items-start gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Pro tip:</span> You don't need ALL 5 W's in every prompt - just the ones that help AI understand what you need!
          </p>
        </div>
      </Card>
    </div>
  );
}

const SORTING_CARDS = [
  { id: 1, text: "Tell me about space", category: "Garbage" as const, explanation: "Too vague - space is a huge topic! What specifically about space?" },
  { id: 2, text: "Explain how clouds form for a 3rd grader's science project in a short paragraph", category: "Gold" as const, explanation: "Specific audience, topic, purpose, and format." },
  { id: 3, text: "Help me", category: "Garbage" as const, explanation: "Help with what? AI needs more details to assist you." },
  { id: 4, text: "What are 5 fun outdoor activities for kids in Austin, Texas during spring?", category: "Gold" as const, explanation: "Specifies quantity, audience, location, and time." },
  { id: 5, text: "Find stuff about dogs", category: "Garbage" as const, explanation: "Too vague - what about dogs? Breeds? Care? Training?" },
  { id: 6, text: "Please suggest 3 books similar to Charlotte's Web for a 4th grader who loves animal stories", category: "Gold" as const, explanation: "Clear quantity, reference point, audience, and interest." },
  { id: 7, text: "Do my math homework", category: "Garbage" as const, explanation: "AI should help you learn, not do your work for you!" },
  { id: 8, text: "How do I solve 3x + 5 = 14? Please show steps.", category: "Gold" as const, explanation: "Specific problem with a clear request for step-by-step help." },
  { id: 9, text: "Tell me things", category: "Garbage" as const, explanation: "What things? This gives AI nothing to work with." },
  { id: 10, text: "Create a list of healthy breakfasts that take less than 10 minutes", category: "Gold" as const, explanation: "Specifies the type of food, health requirement, and time constraint." },
];

function SortingGameTool({ onScoreUpdate }: { onScoreUpdate: (score: number) => void }) {
  const [unsorted, setUnsorted] = useState(() =>
    SORTING_CARDS.map(c => c.id).sort(() => Math.random() - 0.5)
  );
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [sorted, setSorted] = useState<Record<string, number[]>>({ Garbage: [], Gold: [] });
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState<{ text: string; correct: boolean } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const correctCount = Object.values(results).filter(Boolean).length;
  const totalSorted = Object.values(results).length;

  useEffect(() => {
    if (totalSorted === 10) {
      onScoreUpdate(correctCount);
    }
  }, [correctCount, totalSorted, onScoreUpdate]);

  function handleCategoryClick(category: string) {
    if (selectedCard === null) return;
    const card = SORTING_CARDS.find(c => c.id === selectedCard);
    if (!card) return;

    const isCorrect = card.category === category;
    setResults(prev => ({ ...prev, [card.id]: isCorrect }));
    setSorted(prev => ({ ...prev, [category]: [...prev[category], card.id] }));
    setUnsorted(prev => prev.filter(id => id !== card.id));
    setFeedback({
      text: isCorrect
        ? `Correct! ${card.explanation}`
        : `Not quite. ${card.explanation}`,
      correct: isCorrect,
    });
    setSelectedCard(null);
    setTimeout(() => setFeedback(null), 3000);
  }

  function handleReset() {
    setUnsorted(SORTING_CARDS.map(c => c.id).sort(() => Math.random() - 0.5));
    setSelectedCard(null);
    setSorted({ Garbage: [], Gold: [] });
    setResults({});
    setFeedback(null);
    setShowResults(false);
  }

  const allSorted = unsorted.length === 0;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Trash2 className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Garbage or Gold</h2>
          <Badge variant="secondary" data-testid="badge-sorting-score">
            <Trophy className="h-3 w-3 mr-1" /> {correctCount}/{totalSorted} correct
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Sort each prompt card into "Garbage" (vague, unclear) or "Gold" (specific, detailed). Click a card, then click a category!
        </p>

        {feedback && (
          <div className={`p-3 rounded-md mb-4 flex items-start gap-2 text-sm ${
            feedback.correct
              ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 text-destructive"
          }`} data-testid="text-sorting-feedback">
            {feedback.correct ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" /> : <XCircle className="h-4 w-4 shrink-0 mt-0.5" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {allSorted && !showResults ? (
          <div className="text-center py-8">
            <Trophy className="h-12 w-12 text-amber-500 mx-auto mb-3" />
            <p className="font-bold text-lg mb-1">All cards sorted!</p>
            <p className="text-sm text-muted-foreground mb-4">You got {correctCount} out of 10 correct.</p>
            <div className="flex justify-center gap-2 flex-wrap">
              <Button onClick={() => setShowResults(true)} data-testid="button-check-answers">
                <ClipboardCheck className="mr-1 h-4 w-4" /> Check Answers
              </Button>
              <Button variant="outline" onClick={handleReset} data-testid="button-reset-sorting">
                <RotateCcw className="mr-1 h-4 w-4" /> Play Again
              </Button>
            </div>
          </div>
        ) : showResults ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-semibold">Results: {correctCount}/10</h3>
              <Button variant="outline" size="sm" onClick={handleReset} data-testid="button-play-again-sorting">
                <RotateCcw className="mr-1 h-4 w-4" /> Play Again
              </Button>
            </div>
            {SORTING_CARDS.map(card => (
              <div key={card.id} className={`p-3 rounded-md border text-sm flex items-start gap-2 ${
                results[card.id]
                  ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-900/10"
                  : "border-destructive/30 bg-destructive/5"
              }`} data-testid={`result-card-${card.id}`}>
                {results[card.id]
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  : <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />}
                <div>
                  <p className="font-medium">"{card.text}"</p>
                  <p className="text-muted-foreground text-xs mt-1">
                    Answer: <Badge variant="secondary" className="text-xs">{card.category}</Badge> - {card.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Pick a prompt card to sort:</p>
              <div className="space-y-2">
                {unsorted.map(id => {
                  const card = SORTING_CARDS.find(c => c.id === id)!;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelectedCard(selectedCard === id ? null : id)}
                      className={`w-full text-left p-3 rounded-md border text-sm transition-all ${
                        selectedCard === id
                          ? "bg-primary/10 border-primary ring-2 ring-primary/20 font-medium"
                          : "hover-elevate active-elevate-2"
                      }`}
                      data-testid={`button-sort-card-${id}`}
                    >
                      "{card.text}"
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(["Garbage", "Gold"] as const).map(category => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className={`p-4 rounded-md border-2 border-dashed text-left transition-all ${
                    selectedCard !== null
                      ? "hover-elevate cursor-pointer border-primary/30"
                      : "border-muted-foreground/20 cursor-default"
                  }`}
                  disabled={selectedCard === null}
                  data-testid={`button-sort-category-${category.toLowerCase()}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {category === "Garbage"
                      ? <Trash2 className="h-4 w-4 text-destructive" />
                      : <Star className="h-4 w-4 text-amber-500" />}
                    <p className="font-medium text-sm">{category}</p>
                    <Badge variant="secondary" className="text-xs">{sorted[category].length}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 min-h-[24px]">
                    {sorted[category].length === 0 && (
                      <span className="text-xs text-muted-foreground/50">Drop cards here</span>
                    )}
                    {sorted[category].map(id => (
                      <Badge key={id} variant="secondary" className="text-xs">Card {id}</Badge>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

const W_KEYWORDS: Record<string, string[]> = {
  who: ["student", "grader", "kid", "child", "teacher", "person", "beginner", "expert", "3rd", "4th", "5th", "adult", "boy", "girl", "class"],
  what: ["explain", "describe", "list", "create", "write", "show", "tell", "find", "help", "make", "give", "suggest", "compare", "define", "summarize"],
  when: ["today", "tomorrow", "morning", "afternoon", "spring", "summer", "fall", "winter", "week", "month", "year", "now", "before", "after", "during"],
  where: ["school", "home", "class", "project", "texas", "library", "online", "outside", "park", "classroom", "kitchen", "backyard"],
  why: ["because", "so that", "in order to", "to learn", "to understand", "to study", "to practice", "for fun", "for a project", "for homework"],
};

function analyzePrompt(text: string): { detected: Record<string, boolean>; score: number; suggestions: { key: string; tip: string }[] } {
  const lower = text.toLowerCase();
  const detected: Record<string, boolean> = { who: false, what: false, when: false, where: false, why: false };

  for (const [w, keywords] of Object.entries(W_KEYWORDS)) {
    detected[w] = keywords.some(kw => lower.includes(kw));
  }

  if (lower.length > 5 && !detected.what) {
    detected.what = true;
  }

  const filledCount = Object.values(detected).filter(Boolean).length;
  const score = text.trim().length === 0 ? 0 : Math.max(20, Math.round((filledCount / 5) * 100));

  const tipMap: Record<string, string> = {
    who: "Add WHO this is for - like 'for a 4th grader' or 'for a beginner'",
    what: "Be specific about WHAT you need - use action words like 'explain', 'list', or 'create'",
    when: "Add WHEN context - like 'for tomorrow' or 'during spring'",
    where: "Add WHERE context - like 'for a school project' or 'for class'",
    why: "Add WHY you need it - like 'to study for a test' or 'to understand better'",
  };

  const suggestions = Object.entries(detected)
    .filter(([, found]) => !found)
    .map(([key]) => ({ key, tip: tipMap[key] }));

  return { detected, score, suggestions };
}

function PromptImproverTool({ onUsed }: { onUsed: () => void }) {
  const [prompt, setPrompt] = useState("");
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const analysis = prompt.trim().length > 0 ? analyzePrompt(prompt) : null;

  useEffect(() => {
    if (analysis && !hasAnalyzed) {
      setHasAnalyzed(true);
      onUsed();
    }
  }, [analysis, hasAnalyzed, onUsed]);

  const examples = [
    "Tell me about animals",
    "Help with homework",
    "Find a video",
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Wrench className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Prompt Improver</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Type any prompt and see how you can make it better! The analyzer will check which W's are present and suggest improvements.
        </p>

        <Textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Type a prompt here... (e.g., 'Tell me about animals')"
          className="resize-none text-sm"
          rows={3}
          data-testid="input-prompt-improver"
        />

        <div className="flex gap-2 mt-3 flex-wrap">
          <p className="text-xs text-muted-foreground mr-1 self-center">Try:</p>
          {examples.map(ex => (
            <Button
              key={ex}
              variant="outline"
              size="sm"
              onClick={() => setPrompt(ex)}
              data-testid={`button-example-${ex.replace(/\s/g, "-").toLowerCase()}`}
            >
              {ex}
            </Button>
          ))}
        </div>
      </Card>

      {analysis && (
        <>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" /> Analysis
              </h3>
              <Badge variant="secondary" data-testid="badge-improver-score">
                <Star className="h-3 w-3 mr-1" /> Quality: {analysis.score}%
              </Badge>
            </div>

            <Progress value={analysis.score} className="h-2 mb-5" />

            <div className="grid grid-cols-5 gap-2 mb-5">
              {(["who", "what", "when", "where", "why"] as const).map(w => (
                <div
                  key={w}
                  className={`p-2 rounded-md text-center text-xs font-bold transition-colors ${
                    analysis.detected[w]
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-muted text-muted-foreground"
                  }`}
                  data-testid={`indicator-improver-${w}`}
                >
                  <div className="mb-1">
                    {analysis.detected[w]
                      ? <CheckCircle2 className="h-4 w-4 mx-auto text-emerald-500" />
                      : <XCircle className="h-4 w-4 mx-auto text-muted-foreground" />}
                  </div>
                  {w.toUpperCase()}
                </div>
              ))}
            </div>

            {analysis.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4 text-amber-500" /> Suggestions to improve:
                </p>
                {analysis.suggestions.map(s => (
                  <div key={s.key} className="flex items-start gap-2 text-sm p-2 rounded-md bg-amber-50/50 dark:bg-amber-900/10">
                    <ChevronRight className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{s.tip}</span>
                  </div>
                ))}
              </div>
            )}

            {analysis.suggestions.length === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Great prompt! You've covered all the W's.
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "Which is a more polite way to ask AI for help?",
    options: [
      { id: "a", text: "Do my homework now" },
      { id: "b", text: "Could you please help me understand this math problem?" },
      { id: "c", text: "Give me answers" },
      { id: "d", text: "Math. Now." },
    ],
    correct: "b",
    explanation: "Using 'Could you please' shows good communication habits and helps you write clearer prompts!",
  },
  {
    id: 2,
    question: "Why should we use polite words with AI?",
    options: [
      { id: "a", text: "Because AI has feelings" },
      { id: "b", text: "Because it builds good communication habits" },
      { id: "c", text: "Because AI won't work without please" },
      { id: "d", text: "Because our teacher said so" },
    ],
    correct: "b",
    explanation: "Being polite with AI helps you practice good communication skills that carry over to talking with real people!",
  },
  {
    id: 3,
    question: "Which prompt shows good manners AND is clear?",
    options: [
      { id: "a", text: "Please help" },
      { id: "b", text: "Hi! Could you explain how volcanoes work for a 4th grader? Thank you!" },
      { id: "c", text: "Volcanoes. Explain." },
      { id: "d", text: "Do the volcano thing" },
    ],
    correct: "b",
    explanation: "This prompt is polite (Hi, Could you, Thank you) AND specific (topic, audience). That's the winning combo!",
  },
  {
    id: 4,
    question: "What should you NOT ask AI to do?",
    options: [
      { id: "a", text: "Help you brainstorm ideas" },
      { id: "b", text: "Explain a concept you don't understand" },
      { id: "c", text: "Write your entire essay for you" },
      { id: "d", text: "Give you examples to learn from" },
    ],
    correct: "c",
    explanation: "AI is a learning helper, not a homework machine. Use it to learn and grow, not to skip the work!",
  },
  {
    id: 5,
    question: "Which greeting is best to start a prompt?",
    options: [
      { id: "a", text: "Hey you!" },
      { id: "b", text: "Listen up!" },
      { id: "c", text: "Hi! Could you please..." },
      { id: "d", text: "You don't need a greeting" },
    ],
    correct: "c",
    explanation: "Starting with a friendly greeting and 'Could you please' sets a positive tone and builds great communication habits!",
  },
];

function PoliteQuizTool({ onScoreUpdate }: { onScoreUpdate: (score: number) => void }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [showFinal, setShowFinal] = useState(false);

  const correctCount = QUIZ_QUESTIONS.filter(q => answers[q.id] === q.correct).length;

  function handleAnswer(questionId: number, optionId: string) {
    if (revealed[questionId]) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    setRevealed(prev => ({ ...prev, [questionId]: true }));

    const allAnswered = Object.keys({ ...answers, [questionId]: optionId }).length === QUIZ_QUESTIONS.length;
    if (allAnswered) {
      const finalCorrect = QUIZ_QUESTIONS.filter(q => {
        const ans = q.id === questionId ? optionId : answers[q.id];
        return ans === q.correct;
      }).length;
      onScoreUpdate(finalCorrect);
      setTimeout(() => setShowFinal(true), 500);
    }
  }

  function handleReset() {
    setAnswers({});
    setRevealed({});
    setShowFinal(false);
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <SmilePlus className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Polite Prompts Quiz</h2>
          <Badge variant="secondary" data-testid="badge-quiz-progress">
            {Object.keys(answers).length}/{QUIZ_QUESTIONS.length} answered
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Test your knowledge of polite and effective AI communication!
        </p>

        {showFinal && (
          <Card className="p-6 mb-6 text-center bg-gradient-to-br from-primary/5 to-accent/5">
            <Trophy className="h-10 w-10 text-amber-500 mx-auto mb-3" />
            <p className="text-lg font-bold mb-1" data-testid="text-quiz-final-score">
              You scored {correctCount} out of {QUIZ_QUESTIONS.length}!
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {correctCount === 5
                ? "Perfect score! You're a polite prompt pro!"
                : correctCount >= 3
                ? "Great job! You're on your way to mastering polite prompts!"
                : "Keep practicing! Review the explanations to learn more."}
            </p>
            <Button variant="outline" onClick={handleReset} data-testid="button-retake-quiz">
              <RotateCcw className="mr-1 h-4 w-4" /> Retake Quiz
            </Button>
          </Card>
        )}

        <div className="space-y-6">
          {QUIZ_QUESTIONS.map((q, qIndex) => {
            const isAnswered = revealed[q.id];
            const isCorrect = answers[q.id] === q.correct;
            return (
              <Card key={q.id} className="p-5" data-testid={`card-quiz-question-${q.id}`}>
                <p className="font-medium mb-4 text-sm flex items-start gap-2">
                  <Badge variant="secondary" className="shrink-0">{qIndex + 1}</Badge>
                  <span>{q.question}</span>
                </p>
                <div className="space-y-2">
                  {q.options.map(opt => {
                    const isSelected = answers[q.id] === opt.id;
                    const isCorrectOption = opt.id === q.correct;
                    let optionClass = "border-border hover-elevate active-elevate-2";
                    if (isAnswered && isCorrectOption) {
                      optionClass = "border-emerald-400 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/10";
                    } else if (isAnswered && isSelected && !isCorrect) {
                      optionClass = "border-destructive/50 bg-destructive/5";
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleAnswer(q.id, opt.id)}
                        disabled={isAnswered}
                        className={`w-full text-left p-3 rounded-md border-2 text-sm transition-colors ${optionClass} ${isAnswered ? "cursor-default" : ""}`}
                        data-testid={`button-quiz-${q.id}-option-${opt.id}`}
                      >
                        <div className="flex items-center gap-2">
                          {isAnswered && isCorrectOption && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                          {isAnswered && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                          {!isAnswered && <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                          <span>{opt.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {isAnswered && (
                  <div className={`mt-3 p-3 rounded-md text-sm flex items-start gap-2 ${
                    isCorrect
                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                  }`} data-testid={`text-quiz-feedback-${q.id}`}>
                    {isCorrect
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      : <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />}
                    <span>{q.explanation}</span>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {!showFinal && Object.keys(answers).length > 0 && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={handleReset} data-testid="button-reset-quiz">
              <RotateCcw className="mr-1 h-4 w-4" /> Reset
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function HomeView({ progress, onNavigate }: { progress: ModuleProgress; onNavigate: (view: ActiveView) => void }) {
  const tools = [
    {
      id: "prompt-builder" as ActiveView,
      title: "5 W's Prompt Builder",
      description: "Learn to build better AI prompts using WHO, WHAT, WHEN, WHERE, and WHY.",
      icon: Target,
      status: progress.promptBuilderScore > 0 ? `${progress.promptBuilderScore}% quality achieved` : "Not started",
      color: "text-primary",
    },
    {
      id: "sorting-game" as ActiveView,
      title: "Garbage or Gold",
      description: "Sort prompts to learn the difference between vague and specific AI requests.",
      icon: Trash2,
      status: progress.sortingGameScore > 0 ? `${progress.sortingGameScore}/10 correct` : "Not started",
      color: "text-amber-500",
    },
    {
      id: "prompt-improver" as ActiveView,
      title: "Prompt Improver",
      description: "Analyze any prompt and get tips on how to make it clearer and more effective.",
      icon: Wrench,
      status: progress.promptImproverUsed ? "Used" : "Not started",
      color: "text-accent",
    },
    {
      id: "polite-quiz" as ActiveView,
      title: "Polite Prompts Quiz",
      description: "Test your knowledge of polite and effective AI communication.",
      icon: SmilePlus,
      status: progress.politeQuizScore > 0 ? `${progress.politeQuizScore}/5 correct` : "Not started",
      color: "text-emerald-500",
    },
  ];

  const learnings = [
    "How to use the 5 W's (Who, What, When, Where, Why) to write clear prompts",
    "The difference between vague and specific AI prompts",
    "How to analyze and improve any prompt you write",
    "Why polite communication matters, even with AI",
  ];

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="secondary" className="mb-3">Module 1.2</Badge>
        <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-module-title">Talking to AI</h1>
        <p className="text-muted-foreground">
          Master the art of communicating with AI through 4 interactive tools. Learn to write clear, specific, and polite prompts!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map(tool => (
          <Card
            key={tool.id}
            className="p-5 hover-elevate cursor-pointer group"
            onClick={() => onNavigate(tool.id)}
            data-testid={`card-tool-${tool.id}`}
          >
            <div className="flex items-start gap-3">
              <div className="rounded-md flex items-center justify-center w-10 h-10 bg-primary/10 shrink-0">
                <tool.icon className={`h-5 w-5 ${tool.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1 flex items-center gap-2 flex-wrap">
                  {tool.title}
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform shrink-0" />
                </h3>
                <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                <Badge variant="outline" className="text-xs" data-testid={`badge-status-${tool.id}`}>
                  {tool.status}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> What You'll Learn
        </h3>
        <ul className="space-y-2">
          {learnings.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <span className="text-muted-foreground">{item}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function Module12ToolsPage() {
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [progress, setProgress] = useState<ModuleProgress>(loadProgress);

  const updateProgress = useCallback((key: keyof ModuleProgress, value: number | boolean) => {
    setProgress(prev => {
      const next = { ...prev, [key]: value };
      saveProgress(next);
      return next;
    });
  }, []);

  const handleBuilderScore = useCallback((s: number) => updateProgress("promptBuilderScore", s), [updateProgress]);
  const handleSortingScore = useCallback((s: number) => updateProgress("sortingGameScore", s), [updateProgress]);
  const handleImproverUsed = useCallback(() => updateProgress("promptImproverUsed", true), [updateProgress]);
  const handleQuizScore = useCallback((s: number) => updateProgress("politeQuizScore", s), [updateProgress]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link href="/curriculum">
        <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back-curriculum">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Curriculum
        </Button>
      </Link>

      <div className="flex gap-2 mb-6 flex-wrap">
        {NAV_ITEMS.map(item => (
          <Button
            key={item.id}
            variant={activeView === item.id ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveView(item.id)}
            data-testid={`button-nav-${item.id}`}
          >
            <item.icon className="mr-1 h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </div>

      {activeView === "home" && (
        <HomeView progress={progress} onNavigate={setActiveView} />
      )}

      {activeView === "prompt-builder" && (
        <PromptBuilderTool onScoreUpdate={handleBuilderScore} />
      )}

      {activeView === "sorting-game" && (
        <SortingGameTool onScoreUpdate={handleSortingScore} />
      )}

      {activeView === "prompt-improver" && (
        <PromptImproverTool onUsed={handleImproverUsed} />
      )}

      {activeView === "polite-quiz" && (
        <PoliteQuizTool onScoreUpdate={handleQuizScore} />
      )}
    </div>
  );
}
