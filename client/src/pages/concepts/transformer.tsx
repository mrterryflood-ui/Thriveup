import { ConceptCardShell } from "@/components/concepts/concept-card-shell";
import { TransformerSim } from "@/components/concepts/transformer-sim";

export default function TransformerConceptPage() {
  return (
    <ConceptCardShell
      lane="electrical"
      hook="Why doesn't your wall outlet fry every appliance you plug into it?"
      title="Transformers — copper, iron, and the trick that runs the grid."
      subtitle="Voltage and current trade places through a shared magnetic field. Change the turns ratio, change the deal."
      metaTitle="How transformers work — ThriveUp Concepts"
      metaDescription="Live simulator of a transformer: primary and secondary coils around an iron core, with adjustable voltage and turns ratio. See step-up, step-down, and isolation in action."
      simulator={<TransformerSim />}
      related={[
        { url: "/academy/trade-sims/electrical", label: "Electrical Trade Sims", note: "Real circuit-solving lessons with the same MNA engine the pros use." },
      ]}
      explainer={
        <>
          <p>
            The wall outlet in your house carries roughly <strong>120 volts</strong>. The power line
            on the street outside it carries something like <strong>7,200 volts</strong>. The
            high-voltage transmission line connecting power plants to cities carries{" "}
            <strong>hundreds of thousands of volts</strong>. All of it is the same electricity.
            Something in the middle is doing the translation.
          </p>
          <p>
            That something is a <strong>transformer</strong>. Two coils of insulated copper wire,
            wrapped around the same lump of iron. There's no electrical connection between the two
            coils — they don't touch. The trick is that an alternating current in one coil creates
            a changing magnetic field in the iron, and a changing magnetic field through the other
            coil creates a voltage in that coil. The iron just keeps the field tidy.
          </p>
          <p>
            The ratio is dead simple: if the second coil has twice as many turns of wire as the
            first, you get twice the voltage out — but only half the current. If it has half as
            many turns, you get half the voltage and twice the current.{" "}
            <strong>Power in roughly equals power out.</strong> The transformer just rearranges
            which side of the equation is which.
          </p>
          <p>
            That's why the grid works. Power plants generate at moderate voltages. Transformers
            step it way up so it can travel hundreds of miles through thin wires without losing
            too much to heat. Other transformers step it back down at substations, and again on
            the pole outside your house. By the time it reaches your toaster, it's been
            transformed half a dozen times — without anyone ever touching the wire.
          </p>
          <p className="font-medium border-l-4 border-amber-500 pl-4 my-6">
            Two coils, one shared magnetic field, and the ratio of turns decides everything. No
            moving parts, no fuel, just iron and copper doing math.
          </p>
        </>
      }
    />
  );
}
