import { ConceptCardShell } from "@/components/concepts/concept-card-shell";
import { PumpjackSim } from "@/components/concepts/pumpjack-sim";
import { Card } from "@/components/ui/card";
import pumpjackDiagram from "@assets/pumpjack-diagram-optimized.webp";

export default function OilPumpjackConceptPage() {
  return (
    <ConceptCardShell
      lane="mechanical"
      hook="Do you know what engineering makes oil extraction possible?"
      title="An incredible system — just four ideas stacked together."
      subtitle="Rotation to oscillation, a counterweight to even the load, a pivoting beam, and a one-way valve at the bottom of the well."
      metaTitle="How a pumpjack lifts oil — ThriveUp Concepts"
      metaDescription="Live four-bar-linkage simulator of an oil pumpjack: walking beam, horsehead, crank, counterweight, polished rod, with a 90-second explainer."
      simulator={<PumpjackSim />}
      referenceDiagram={
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-b from-sky-50 to-amber-50 dark:from-sky-950/30 dark:to-amber-950/20">
            <img
              src={pumpjackDiagram}
              alt="Labeled diagram of an oil pumpjack: walking beam, horsehead, crank, counterweight, pitman arm, polished rod, sucker rod, well casing, tubing, and oil reservoir."
              className="w-full h-auto"
              data-testid="img-pumpjack-diagram"
            />
          </div>
        </Card>
      }
      explainer={
        <>
          <p>
            Most of the world's oil sits a thousand feet or more underground, locked inside
            porous rock that hangs onto every drop. You can't just pipe it up — there's no
            pressure to push it. A <strong>pumpjack</strong> is the patient machine that lifts
            it, stroke by stroke.
          </p>
          <p>
            A motor at the base turns a <strong>crank</strong>. The crank carries a{" "}
            <strong>counterweight</strong> on the back side, so the motor doesn't fight gravity
            on every cycle — it only does about half the work. As the crank rotates, a long bar
            called the <strong>pitman arm</strong> rocks the giant horizontal beam above it: the{" "}
            <strong>walking beam</strong>. One side of the beam goes down; the other side goes
            up.
          </p>
          <p>
            The curved shape on the far end of the beam — the <strong>horsehead</strong> — was
            shaped that way for a reason. As the beam tips, the cable hanging off the horsehead
            stays vertical, even though the beam itself is rocking. That cable holds the{" "}
            <strong>polished rod</strong>, a steel shaft running straight down into the well.
            Below it, threaded together, hundreds of feet of <strong>sucker rods</strong> carry
            the motion down to a piston at the bottom.
          </p>
          <p>
            That piston, deep underground, has two simple valves. On the upstroke it lifts a
            column of oil; on the downstroke it lets new oil refill from below. Up, down, up,
            down — maybe 6 to 20 cycles a minute — and over a day each cycle adds up to barrels.
          </p>
          <p className="font-medium border-l-4 border-amber-500 pl-4 my-6">
            The whole thing is four ideas stacked together: rotation turned into oscillation, a
            counterweight to even the load, a pivoting beam to translate motion, and a one-way
            valve to keep what you lift.
          </p>
          <p>
            The four-bar linkage you just watched shows up everywhere — sewing machines, oil
            derricks, windshield wipers, the foot pedal on a piano, the suspension on some cars.
            Once you can see it once, you can see it in a hundred other machines.
          </p>
        </>
      }
    />
  );
}
