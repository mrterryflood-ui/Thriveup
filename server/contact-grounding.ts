// Contact grounding for the Navigator (III doctrine R1/R2/R4).
// applyNavigatorGrounding already redacts ungrounded statistics. Phone numbers and
// links were unchecked, although the prompt asks for "names, phone numbers, websites,
// addresses when available". For people seeking reentry, housing or crisis help, a
// wrong number is real harm. Any phone number not in the supplied context is
// withheld; links to domains not in the context get a visible verify note.
// 911, 988 (Suicide & Crisis Lifeline) and 211 (community services) are fixed
// national N11 numbers and always pass.
const PHONE = /(?:\+?1[\s.-]?)?\(?\b\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g;
const URL_RE = /\bhttps?:\/\/([a-z0-9.-]+\.[a-z]{2,})(?:\/[^\s)\]>"']*)?/gi;
const digits = (s: string) => s.replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
const host = (h: string) => h.toLowerCase().replace(/^www\./, "");

export const WITHHELD_PHONE = "[number withheld: not in a verified source — call 211 or check the provider's official site]";

export function groundContacts(text: string, context: string) {
  const allowedPhones = new Set((context.match(PHONE) ?? []).map(digits));
  const allowedHosts = new Set([...context.matchAll(URL_RE)].map((m) => host(m[1])));
  const ctxLower = context.toLowerCase();
  const withheldPhones: string[] = [];
  let out = text.replace(PHONE, (m) => {
    if (allowedPhones.has(digits(m))) return m;
    withheldPhones.push(m);
    return WITHHELD_PHONE;
  });
  const unverifiedHosts = Array.from(new Set([...out.matchAll(URL_RE)].map((m) => host(m[1]))
    .filter((h) => !allowedHosts.has(h) && !ctxLower.includes(h))));
  if (unverifiedHosts.length) {
    out += `\n\nSource check: ${unverifiedHosts.length} link(s) in this answer (${unverifiedHosts.join(", ")}) did not come from the resources retrieved for you. Verify them before relying on them.`;
  }
  return { text: out, withheldPhones, unverifiedHosts };
}
