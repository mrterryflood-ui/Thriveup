import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, Sparkles, Hammer } from "lucide-react";
import { PumpjackSim } from "@/components/concepts/pumpjack-sim";
import pumpjackDiagram from "@assets/IMG_7754_1779333337877.png";

export default function OilPumpjackConceptPage() {
  const [simOpen, setSimOpen] = useState(false);

  useEffect(() => {
    const prev = document.title;
    document.title = "How a Pumpjack Lifts Oil — ThriveUp Concepts";
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" data-testid="link-back-home">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <Badge variant="outline" className="gap-1.5">
            <Sparkles className="w-3 h-3" />
            ThriveUp Concepts · Mechanical
          </Badge>
        </div>

        <header className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Do you know what engineering makes oil extraction possible?
          </p>
          <h1
            className="text-3xl md:text-4xl font-bold leading-tight mt-2"
            data-testid="text-concept-title"
          >
            It's an incredible system — and it's just four ideas stacked together.
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            90-second read · interactive simulator · no quiz, no grade
          </p>
        </header>

        <Card className="mb-6 overflow-hidden">
          <div className="bg-gradient-to-b from-sky-50 to-amber-50 dark:from-sky-950/30 dark:to-amber-950/20">
            <img
              src={pumpjackDiagram}
              alt="Labeled diagram of an oil pumpjack: walking beam, horsehead, crank, counterweight, pitman arm, polished rod, sucker rod, well casing, tubing, and oil reservoir."
              className="w-full h-auto"
              data-testid="img-pumpjack-diagram"
            />
          </div>
        </Card>

        <article className="prose prose-slate dark:prose-invert max-w-none mb-8">
          <p className="text-base leading-relaxed">
            Most of the world's oil sits a thousand feet or more underground, locked inside
            porous rock that hangs onto every drop. You can't just pipe it up — there's no
            pressure to push it. A <strong>pumpjack</strong> is the patient machine that lifts
            it, stroke by stroke.
          </p>

          <p className="text-base leading-relaxed">
            A motor at the base turns a <strong>crank</strong>. The crank carries a{" "}
            <strong>counterweight</strong> on the back side, so the motor doesn't fight gravity
            on every cycle — it only does about half the work. As the crank rotates, a long bar
            called the <strong>pitman arm</strong> rocks the giant horizontal beam above it: the{" "}
            <strong>walking beam</strong>. One side of the beam goes down; the other side goes
            up.
          </p>

          <p className="text-base leading-relaxed">
            The curved shape on the far end of the beam — the <strong>horsehead</strong> — was
            shaped that way for a reason. As the beam tips, the cable hanging off the horsehead
            stays vertical, even though the beam itself is rocking. That cable holds the{" "}
            <strong>polished rod</strong>, a steel shaft running straight down into the well.
            Below it, threaded together, hundreds of feet of <strong>sucker rods</strong> carry
            the motion down to a piston at the bottom.
          </p>

          <p className="text-base leading-relaxed">
            That piston, deep underground, has two simple valves. On the upstroke it lifts a
            column of oil; on the downstroke it lets new oil refill from below. Up, down, up,
            down — maybe 6 to 20 cycles a minute — and over a day each cycle adds up to barrels.
          </p>

          <p className="text-base leading-relaxed font-medium border-l-4 border-amber-500 pl-4 my-6">
            The whole thing is four ideas stacked together: rotation turned into oscillation, a
            counterweight to even the load, a pivoting beam to translate motion, and a one-way
            valve to keep what you lift.
          </p>
        </article>

        <Card className="mb-8 border-amber-300 dark:border-amber-700">
          <CardContent className="p-6">
            {!simOpen ? (
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-amber-600" />
                    Open the simulator
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Watch the four-bar linkage in motion. Speed it up, slow it down, hover any
                    part to see how it fits the system.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={() => setSimOpen(true)}
                  data-testid="button-open-sim"
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Open the simulator
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Hammer className="w-5 h-5 text-amber-600" />
                    Pumpjack — live mechanism
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSimOpen(false)}
                    data-testid="button-close-sim"
                  >
                    Close
                  </Button>
                </div>
                <PumpjackSim />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="rounded-lg border bg-muted/30 p-5 text-sm">
          <p className="font-semibold mb-2">Where this fits in the bigger picture</p>
          <p className="text-muted-foreground leading-relaxed">
            The four-bar linkage you just watched shows up everywhere — sewing machines, oil
            derricks, windshield wipers, the foot pedal on a piano, the suspension on some
            cars. Once you can see it once, you can see it in a hundred other machines.
          </p>
          <p className="text-muted-foreground leading-relaxed mt-3">
            This is the first of our Concept Cards — short, hands-on explainers about the
            engineering behind everyday things. No certification. No quiz. Just the satisfying
            feeling of finally understanding how something works.
          </p>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground">
          ThriveUp Academy · Concepts · v0.1 prototype
        </div>
      </div>
    </div>
  );
}
