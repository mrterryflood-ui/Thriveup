import { ConceptCardShell } from "@/components/concepts/concept-card-shell";
import { BatterySim } from "@/components/concepts/battery-sim";

export default function LithiumBatteryConceptPage() {
  return (
    <ConceptCardShell
      lane="chemical"
      hook="What's actually moving inside the battery in your phone?"
      title="A lithium-ion cell — ions shuttling, electrons going the long way around."
      subtitle="Charging pushes ions one way. Discharging lets them slide back. The current you use is just electrons taking the scenic route."
      metaTitle="How a lithium-ion battery works — ThriveUp Concepts"
      metaDescription="Live simulator of a lithium-ion cell: watch Li⁺ ions move between anode and cathode while electrons flow through the external circuit."
      simulator={<BatterySim />}
      explainer={
        <>
          <p>
            Inside the battery in your phone, your laptop, and most electric cars, the same basic
            thing is happening: a small atom called <strong>lithium</strong> is shuffling back and
            forth between two materials. That's it. That's the whole product.
          </p>
          <p>
            On one side there's an <strong>anode</strong> made of graphite — layers of carbon
            stacked like a deck of cards, with little gaps between them where lithium atoms can
            slip in and live. On the other side there's a <strong>cathode</strong> made of a
            lithium-metal oxide. In the middle is a <strong>separator</strong>: a thin barrier
            soaked in electrolyte. It lets lithium ions (Li⁺ — lithium minus one electron) pass
            through, but it absolutely refuses to let electrons through.
          </p>
          <p>
            When you <strong>charge</strong> the battery, the charger pulls lithium out of the
            cathode. The Li⁺ ions float across the separator and tuck into the graphite gaps on
            the anode side. Their electrons can't follow them through the separator — so they
            travel through the wires of the charger instead. That's the current the charger has
            to supply.
          </p>
          <p>
            When you <strong>discharge</strong> — when your phone is doing anything — the process
            reverses. Lithium wants to be back on the cathode side. As each ion slides back across
            the separator, its electron has to take the long way around through the external
            circuit: through your phone's chip, your screen, your speakers. That's the current
            running your device. The battery isn't "storing electricity." It's storing the
            <strong> potential</strong> for electrons to take that walk.
          </p>
          <p className="font-medium border-l-4 border-amber-500 pl-4 my-6">
            Charging stores chemical potential. Discharging cashes it in. The ions move the easy way;
            the electrons have to detour through your device. That detour is the entire reason the
            battery is useful.
          </p>
        </>
      }
    />
  );
}
