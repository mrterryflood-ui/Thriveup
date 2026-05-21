import { ConceptCardShell } from "@/components/concepts/concept-card-shell";
import { BridgeSim } from "@/components/concepts/bridge-sim";

export default function SuspensionBridgeConceptPage() {
  return (
    <ConceptCardShell
      lane="civil"
      hook="How does a steel deck hang in the air over a river?"
      title="Suspension bridges — pulling cables, pushing towers, gravity playing fair."
      subtitle="Every pound on the deck becomes tension in a cable and compression in a tower. Drag the truck and watch the numbers move."
      metaTitle="How a suspension bridge works — ThriveUp Concepts"
      metaDescription="Live simulator of a suspension bridge: add trucks to the deck, move them, and watch real cable tension and tower compression numbers update."
      simulator={<BridgeSim />}
      explainer={
        <>
          <p>
            The trick of a suspension bridge is that the deck — the part you drive on — isn't
            actually holding itself up. It's <strong>hanging</strong> from cables. The cables are
            holding it up. And the cables are draped over two tall <strong>towers</strong>, with
            their ends anchored deep into the ground on either shore.
          </p>
          <p>
            Push down on any part of the deck and that weight has to go somewhere. It travels up
            a thin vertical "hanger" cable, into the big main cable, and from there it splits — some
            of it pulls one tower toward the load, some pulls the other. The towers are squeezed
            <strong> downward</strong> by the cables tugging on top of them, and they pass that
            squeeze straight into the bedrock below.
          </p>
          <p>
            So three different materials are doing three different jobs.{" "}
            <strong>Steel cables</strong> are being pulled — they're great at that, almost
            unbreakable in tension. <strong>The towers</strong>, usually concrete-and-steel, are
            being squeezed — they're great at that. <strong>The anchorages</strong> are being
            pulled outward at each shore, and they're huge blocks of concrete buried in the
            ground to resist it. Everyone gets a job they're good at.
          </p>
          <p>
            Move the truck toward one tower and that tower's job gets harder. Move it to the
            middle and both towers share the load. Add more trucks and you can watch the cable
            visibly sag a little — the geometry has to change to carry more force. Real bridges
            are designed with 3–5× the worst expected load built in. That's not over-engineering;
            that's the only reason a 70-year-old bridge in salt air is still safe.
          </p>
          <p className="font-medium border-l-4 border-amber-500 pl-4 my-6">
            Tension in the cables. Compression in the towers. Anchorages doing the pulling-back. The
            whole structure is one big handshake between three materials that each do one thing
            very well.
          </p>
        </>
      }
    />
  );
}
