import { ConceptCardShell } from "@/components/concepts/concept-card-shell";
import { PubKeySim } from "@/components/concepts/pubkey-sim";

export default function PublicKeyEncryptionConceptPage() {
  return (
    <ConceptCardShell
      lane="software"
      hook="How can two strangers share a secret without ever exchanging a password?"
      title="Public-key encryption — a lock anyone can close, only one person can open."
      subtitle="Math you can do on paper, with primes small enough to follow. Type a message and watch RSA actually work."
      metaTitle="How public-key encryption works — ThriveUp Concepts"
      metaDescription="Live simulator of real RSA encryption with small primes. Type a message, see it locked with the public key and unlocked with the private key."
      simulator={<PubKeySim />}
      explainer={
        <>
          <p>
            Imagine you want to send me a secret. The old way needed us to share a password first
            — but how do we share that password without someone overhearing? In 1977, three
            cryptographers (Rivest, Shamir, and Adleman, hence "RSA") published a trick that
            sounded impossible: <strong>I'll publish a lock that anyone can use to seal a message
            to me, but only I have the key to open it.</strong>
          </p>
          <p>
            The math is elegant. I pick two prime numbers and multiply them together. Multiplying
            primes is fast — even with thousand-digit primes, a phone does it in milliseconds.
            But going the other direction — taking the product back apart into the original two
            primes — is so slow that even today's fastest computers can't do it inside the age of
            the universe. That asymmetry is the entire trick.
          </p>
          <p>
            With those two primes I can build two related numbers: a <strong>public key</strong>{" "}
            (which I publish on my website, on my email signature, anywhere) and a{" "}
            <strong>private key</strong> (which never leaves my machine). To encrypt a message
            for me, you raise its number to a power and take a remainder using my public key.
            That gives you a ciphertext. To decrypt, you raise the ciphertext to a different power
            using the private key. The math works out — the original message reappears.
          </p>
          <p>
            The simulator on this page uses tiny primes (11 and 13) so you can actually read the
            numbers and verify each step. Real-world RSA uses primes with 600+ digits. Same math,
            same procedure — just with numbers no human will ever factor. <strong>Every time you
            see a padlock in your browser, this exchange is happening</strong> in the first split
            second of every page load.
          </p>
          <p className="font-medium border-l-4 border-amber-500 pl-4 my-6">
            Multiplying primes is easy. Un-multiplying them is impossible at scale. The gap between
            those two facts is what makes the modern internet trustworthy enough to send a credit
            card number through.
          </p>
        </>
      }
    />
  );
}
