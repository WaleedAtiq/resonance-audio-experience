"use client";

import { useState } from "react";
import { SECTIONS } from "@/lib/release";

// Every section except the hero gets a nav link (the logo links to the hero).
const LINKS = SECTIONS.filter((s) => s.id !== "hero");

// Fixed, blurred top bar (same structure as ECLIPSE / VOLT): links on desktop, a menu on mobile.
export default function Nav() {
  const [open, setOpen] = useState(false); // mobile menu

  return (
    <nav className={`fixed inset-x-0 top-0 z-50 border-b border-line backdrop-blur-md transition-colors ${open ? "bg-bg/90" : "bg-bg/55"}`}>
      <div className="flex items-center justify-between px-[22px] py-[16px] desktop:px-8">
        <a href="#hero" className="font-display text-[15px] font-bold tracking-[0.35em]">
          RES<span className="text-accent">O</span>NANCE
        </a>

        <ul className="hidden gap-7 desktop:flex">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} className="text-[13px] tracking-[0.08em] text-muted transition-colors hover:text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <a href="#presave" className="btn-outline" onClick={() => setOpen(false)}>
            Pre-save
          </a>
          <button
            className="text-[22px] desktop:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {open && (
        <ul className="flex flex-col gap-1 border-t border-line px-[22px] pb-6 pt-3 desktop:hidden">
          {LINKS.map((l) => (
            <li key={l.id}>
              <a href={`#${l.id}`} onClick={() => setOpen(false)} className="block py-3 text-lg text-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
