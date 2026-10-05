import { Link } from "wouter";
import { WORKSPACES } from "@shared/workspace-catalog";
import { useWorkspace } from "@/lib/workspace-context";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function WorkspaceChooser() {
  const { setWorkspace } = useWorkspace();
  return <div className="min-h-full bg-[#eef2ec] text-[#203b38] px-5 py-10">
    <div className="mx-auto max-w-4xl">
      <Link href="/" className="inline-flex items-center gap-2 min-h-11 text-sm" aria-label="All starting points"><ArrowLeft size={16} aria-hidden="true" />All starting points</Link>
      <h1 className="text-3xl sm:text-4xl font-semibold mt-6">Choose your workspace.</h1>
      <p className="mt-4 max-w-xl text-[#63776f]">Choose the perspective that fits what you want to do today. This organizes tools; it does not change your account permissions.</p>
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        {WORKSPACES.map(item => <Link key={item.id} href={`/workspace/${item.id}`} onClick={() => setWorkspace(item.id)} aria-label={item.label} data-testid={`chooser-${item.id}`} className="rounded-2xl border border-[#d5dfd9] bg-[#fbfaf6] p-6 min-h-40 hover:border-[#83aa9c] focus-visible:ring-2 focus-visible:ring-[#28786d]">
          <h2 className="font-semibold text-xl">{item.label}</h2>
          <p className="mt-2 text-sm text-[#63776f]">{item.audience}</p>
          <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#24756b]">{item.purpose}<ArrowRight size={16} aria-hidden="true" /></span>
        </Link>)}
      </div>
    </div>
  </div>;
}