"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBox } from "./SearchBox";

const links = [
  { href: "/", label: "Recalls" },
  { href: "/compare", label: "Shared supplier" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          <strong>TracePlate</strong>
          <span>farm → restaurant</span>
        </Link>
        <nav className="nav">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              data-active={
                link.href === "/"
                  ? pathname === "/" || pathname.startsWith("/recalls") || pathname.startsWith("/kitchens")
                  : pathname.startsWith(link.href)
              }
            >
              {link.label}
            </Link>
          ))}
          <SearchBox />
        </nav>
      </header>
      {children}
    </div>
  );
}
