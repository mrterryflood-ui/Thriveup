import { ConceptCardShell } from "@/components/concepts/concept-card-shell";
import { PacemakerSim } from "@/components/concepts/pacemaker-sim";

export default function PacemakerConceptPage() {
  return (
    <ConceptCardShell
      lane="biomedical"
      hook="What does an artificial heart-rhythm device actually do all day?"
      title="A pacemaker — patient, listening, only firing when the heart forgets."
      subtitle="It watches every beat. If the next one doesn't come in time, it sends a small electrical nudge. Otherwise it stays quiet."
      metaTitle="How a pacemaker works — ThriveUp Concepts"
      metaDescription="Live simulator of a demand pacemaker: set the intrinsic heart rate and pacing floor, watch the device fill in only when the natural beats run too slow."
      simulator={<PacemakerSim />}
      explainer={
        <>
          <p>
            A healthy heart has its own electrical pacemaker built in — a little patch of tissue
            called the <strong>sinoatrial node</strong> that fires roughly once a second and sends
            a wave of contraction across the muscle. When that natural pacemaker gets unreliable —
            from age, from a heart attack, from electrical disease in the conducting tissue — the
            heart can slow down, skip beats, or stop entirely for a few seconds at a time. People
            faint. Some people die.
          </p>
          <p>
            An artificial pacemaker is a coin-sized titanium computer implanted under the skin,
            usually below the collarbone. Thin insulated wires run from it down into the heart
            chambers. Most of the time, <strong>it does nothing</strong>. It listens. Every time
            the natural heartbeat fires, the wires pick up the small electrical signal that
            travels through the muscle, and the pacemaker resets a clock.
          </p>
          <p>
            If that clock ever runs past a programmed limit — say, more than one second without a
            beat — the pacemaker fires a tiny pulse of its own through the wire. The heart muscle,
            which is exquisitely sensitive to electrical signals, contracts. The beat happens. The
            clock resets. Then the device goes back to listening.
          </p>
          <p>
            This style is called a <strong>demand pacemaker</strong>. It only steps in when the
            heart doesn't manage on its own. If your natural rate climbs (you're running, you're
            scared, you're laughing), the device stays silent — your own heart is already beating
            faster than the floor it's set to. Modern devices also adjust the floor based on how
            active you are, and many can sense and correct more complex rhythm problems. But the
            core trick is just that: a clock that gets reset by every real beat, and a small
            backup pulse if the next beat takes too long.
          </p>
          <p className="font-medium border-l-4 border-amber-500 pl-4 my-6">
            A device whose entire job is to not be needed — but to be ready, every single second, for
            ten years on one battery. The technology is mostly patience.
          </p>
        </>
      }
    />
  );
}
