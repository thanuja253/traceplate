"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SearchHit } from "@/lib/types";

export function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setHits([]);
      setError("");
      return;
    }
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Search failed");
        setHits(data.hits ?? []);
        setError("");
        setOpen(true);
      } catch (err) {
        setHits([]);
        setError(err instanceof Error ? err.message : "Search failed");
        setOpen(true);
      }
    }, 180);
    return () => window.clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="search-wrap" ref={box}>
      <input
        type="search"
        placeholder="Search palak, paneer, Cafe Madras…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => {
          if (hits.length || error) setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && q.trim().length >= 2) {
            e.preventDefault();
            setOpen(false);
            router.push(`/search?q=${encodeURIComponent(q.trim())}`);
          }
        }}
        aria-label="Search the supply graph"
      />
      {open && (q.trim().length >= 2) && (
        <div className="search-results">
          {error && <div className="none">{error}</div>}
          {!error && hits.length === 0 && <div className="none">Nothing matched.</div>}
          {hits.map((hit) => (
            <Link
              key={`${hit.kind}-${hit.id}`}
              href={hit.href}
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
            >
              <span className="kind-chip">{hit.kind}</span>
              {hit.name}
              {hit.subtitle ? <div className="muted small">{hit.subtitle}</div> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
