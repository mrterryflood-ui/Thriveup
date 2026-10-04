import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { WORKSPACES, type WorkspaceId } from "@shared/workspace-catalog";
import { PLATFORMS_PHRASE, AI_ENGINES_PHRASE, LANGUAGES_SHORT_PHRASE } from "@shared/canonical-claims";

/**
 * Home "why + what you'll experience" layer.
 * Photorealistic images are generated illustrations (not photos of real clients) — stated in the caption.
 * Copy stays descriptive of existing, working surfaces; no outcome or ROI claims.
 */

type Door = {
  image: string;
  alt: string;
  experience: string;
  firstStep: { label: string; href: string };
};

const DOORS: Record<WorkspaceId, Door> = {
  residents: {
    image: "/home/residents.jpg",
    alt: "A mother and her young son looking at a phone together at their kitchen table.",
    experience: "Search food, housing, and care near you; estimate benefits in minutes; pick a lesson or career path. Nothing requires an account, and your answers carry forward so you never repeat intake.",
    firstStep: { label: "Find food, housing or care", href: "/get-help" },
  },
  organizations: {
    image: "/home/organizations.jpg",
    alt: "A community health worker and case manager talking with a client in a community center office.",
    experience: "Make and track referrals, see which partners have capacity today, coordinate child care and health navigation, and find organizational funding. Staff tools keep their own access checks.",
    firstStep: { label: "Coordinate services", href: "/for-nonprofits" },
  },
  funders: {
    image: "/home/funders.jpg",
    alt: "Foundation and bank community-reinvestment staff reviewing a printed neighborhood data report.",
    experience: "Open a county or metro snapshot with every number labeled observed, modeled, or unavailable and traced to Census, CDC, or HUD. Review methods and disclosures before any claim of impact.",
    firstStep: { label: "Community bank impact view", href: "/community-banks" },
  },
  community: {
    image: "/home/community.jpg",
    alt: "Residents and a council member at a neighborhood town-hall meeting in a school gym.",
    experience: "Map local conditions for any U.S. county — poverty, vulnerability, housing, child-care supply — and explore evidence-based responses other places have tried.",
    firstStep: { label: "Explore community analysis", href: "/community-analysis" },
  },
};

export function HomeWhyStrip() {
  return (
    <section className="mt-8 grid gap-4 rounded-2xl border border-[#cfdbd3] bg-[#f8f8f2] p-4 sm:mt-12 sm:grid-cols-[1.2fr_1fr] sm:gap-6 sm:p-6" aria-labelledby="home-why-title" data-testid="home-why">
      <div className="flex flex-col justify-center">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#668078]">Why this exists</p>
        <h2 id="home-why-title" className="mt-1 font-[var(--font-display)] text-2xl font-semibold leading-tight tracking-[-.04em] text-[#203b38] sm:text-3xl">One front door for help, work, and community data.</h2>
        <p className="mt-3 text-sm leading-6 text-[#4b5f58]">
          People in need, the organizations serving them, and the funders and leaders deciding where resources go usually use different systems that never talk. ThriveUp puts them on one platform: a resident finds a next step, a practitioner sees capacity and makes the referral, and a funder sees the same neighborhood evidence — each from their own door.
        </p>
        <p className="mt-3 text-xs leading-5 text-[#62766e]" data-testid="home-why-strap">
          {PLATFORMS_PHRASE} · {AI_ENGINES_PHRASE} · {LANGUAGES_SHORT_PHRASE} · free to use; TCAF&apos;s hands-on coordination is optional and separately funded.
        </p>
      </div>
      <figure className="m-0 overflow-hidden rounded-xl">
        <img src="/home/learners.jpg" alt="A young adult apprentice learning hands-on trade skills with an instructor in a workshop." width={1024} height={1024} loading="lazy" decoding="async" className="aspect-[4/3] h-full w-full object-cover" />
        <figcaption className="sr-only">Illustrative image.</figcaption>
      </figure>
    </section>
  );
}

export function HomeDoorCard({ id, index, onChoose }: { id: WorkspaceId; index: number; onChoose: () => void }) {
  const ws = WORKSPACES.find(w => w.id === id);
  const door = DOORS[id];
  if (!ws || !door) return null;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-[#cfdbd3] bg-white transition hover:-translate-y-0.5 hover:shadow-[0_15px_30px_-24px_rgba(26,70,62,.45)]" data-testid={`home-door-${id}`}>
      <Link href={`/workspace/${id}`} onClick={onChoose} className="relative block aspect-[16/10] overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#24756b]" data-testid={`home-workspace-${id}`} aria-label={`${ws.label}: ${ws.purpose}`}>
        <img src={door.image} alt={door.alt} width={1024} height={1024} loading={index < 2 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[.15em] text-[#375c53]">Perspective 0{index + 1}</span>
      </Link>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="font-[var(--font-display)] text-lg font-semibold leading-tight text-[#203b38]">{ws.label}</h3>
        <p className="mt-0.5 text-xs leading-5 text-[#62766e]">{ws.audience}</p>
        <p className="mt-3 text-sm leading-6 text-[#4b5f58]"><span className="font-semibold text-[#203b38]">What you&apos;ll experience: </span>{door.experience}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          <Link href={door.firstStep.href} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#24756b] px-3.5 text-sm font-semibold text-white transition hover:bg-[#1c5f57] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b] focus-visible:ring-offset-2" data-testid={`home-door-step-${id}`}>
            {door.firstStep.label}
            <ArrowRight aria-hidden="true" size={15} />
          </Link>
          <Link href={`/workspace/${id}`} onClick={onChoose} className="inline-flex min-h-11 items-center text-xs font-semibold text-[#3c7065] underline decoration-[#9ab7a8] underline-offset-4 hover:text-[#174b45] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#24756b]" data-testid={`home-door-workspace-${id}`}>
            Open this perspective
          </Link>
        </div>
      </div>
    </article>
  );
}

export const HOME_IMAGE_NOTE = "Images are illustrative and do not depict ThriveUp clients.";
