import { ConceptCardShell } from "@/components/concepts/concept-card-shell";
import { WingSim } from "@/components/concepts/wing-sim";

export default function AirplaneWingConceptPage() {
  return (
    <ConceptCardShell
      lane="aerospace"
      hook="Why does a 400-ton airplane stay up?"
      title="The wing — bending air, paying with pressure, until it asks too much."
      subtitle="Tilt the wing and see lift climb. Tilt too far and the air stops cooperating — that's stall."
      metaTitle="How an airplane wing makes lift — ThriveUp Concepts"
      metaDescription="Live simulator of an airfoil at different angles of attack. See streamlines, lift coefficient, and the cliff that happens at stall."
      simulator={<WingSim />}
      explainer={
        <>
          <p>
            A 747 weighs about 400 tons. There is no string holding it up. Nothing it pushes
            against. It's standing on the air. And the air doesn't really care — it's pretty thin.
            So how does the wing pull this off?
          </p>
          <p>
            The wing is shaped — curved on top, flatter on the bottom — and it's tilted slightly
            upward into the oncoming air. That tilt is called the <strong>angle of attack</strong>.
            As the airplane moves forward, air has to flow around the wing. The air on top has to
            go a little farther and faster than the air on the bottom. Faster-moving air has{" "}
            <strong>lower pressure</strong>. The wing has higher pressure underneath and lower
            pressure on top. The pressure difference, summed across the whole wing, is the lift.
          </p>
          <p>
            Increase the angle of attack — tilt the wing's leading edge up more — and the lift
            goes up almost linearly. Pilots use this on every takeoff and landing: when the plane
            is going slow, the wing has to work harder per square foot, so the nose tilts up.
            Easy. Up to a point.
          </p>
          <p>
            Around <strong>15 to 16 degrees</strong>, something dramatic happens. The smooth air
            flow over the top of the wing gives up. It "separates" — peels away from the wing into
            messy, swirling turbulence. The pressure difference collapses. Lift falls off a cliff.
            This is <strong>stall</strong>. Every wing has it. It's not a malfunction; it's
            geometry. The whole job of a pilot is to keep the wing on the friendly side of stall,
            especially at low altitude where you can't recover.
          </p>
          <p className="font-medium border-l-4 border-amber-500 pl-4 my-6">
            More tilt, more lift — but only up to about 16°. Past that, the air stops playing along.
            Every flight you've ever taken was the pilot keeping the wing right under that number.
          </p>
        </>
      }
    />
  );
}
