import { ConceptCardShell } from "@/components/concepts/concept-card-shell";
import { WindTurbineSim } from "@/components/concepts/wind-turbine-sim";

export default function WindTurbineConceptPage() {
  return (
    <ConceptCardShell
      lane="energy"
      hook="How much electricity is really sitting in the wind?"
      title="A wind turbine — three blades, a gearbox, and a cubed wind speed."
      subtitle="Power scales with the cube of wind speed. Double the wind, get eight times the power — until the blades have to feather to survive."
      metaTitle="How a wind turbine works — ThriveUp Concepts"
      metaDescription="Live simulator of a utility-scale wind turbine: adjust wind speed and blade pitch, see power output, rotor speed, and cut-in/cut-out behavior."
      simulator={<WindTurbineSim />}
      explainer={
        <>
          <p>
            A modern utility wind turbine is taller than a 30-story building and its blades are
            longer than the wing of a 747. You'd think the engineering problem would be: how do
            you make it strong enough? The actual engineering problem is the opposite: how do you
            keep it from making <strong>too much</strong> power.
          </p>
          <p>
            The amount of power in moving air follows a brutal little formula:{" "}
            <strong>P = ½ · ρ · A · v³ · Cp</strong>. Most of that doesn't change. Air density
            (ρ) is roughly constant. The swept area (A — the circle the blades trace) is fixed
            once you've built the thing. The wind speed (v) is the only variable that really
            moves — and it's <strong>cubed</strong>. That cube is the heart of the story. Wind
            at 12 m/s carries eight times as much power as wind at 6 m/s.
          </p>
          <p>
            Below about <strong>3 m/s</strong> (cut-in), there's so little power that the rotor
            can't even overcome its own friction. The brake stays on. Once the wind picks up, the
            blades start turning, and power climbs with that cubic curve. At around 12 m/s the
            turbine hits its <strong>rated power</strong> — the maximum the generator and
            electronics are built to handle. If the wind keeps rising, the blades tilt (or
            "pitch") to spill some of the energy back into the air. Otherwise the generator would
            burn out and the gearbox would shear.
          </p>
          <p>
            Above about <strong>25 m/s</strong> (cut-out), the storm is dangerous. The blades
            feather all the way — turning edge-on to the wind so they catch almost nothing — and
            the rotor stops. Better to make zero power for an hour than to lose a $5M nacelle
            because someone wanted to squeeze out a little more.
          </p>
          <p className="font-medium border-l-4 border-amber-500 pl-4 my-6">
            The cube law is why wind farms cluster in windy places (not "kind of windy" places). The
            pitch system is why they survive storms. The cut-out is why you'll see them sometimes
            standing still on the worst weather days. All of it is the same physics.
          </p>
        </>
      }
    />
  );
}
