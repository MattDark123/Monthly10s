"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListIcon, ArchiveIcon, PeopleIcon, SettingsIcon } from "./Icons";

const TABS = [
  { href: "/", label: "Month", Icon: ListIcon },
  { href: "/archive", label: "Look back", Icon: ArchiveIcon },
  { href: "/friends", label: "Friends", Icon: PeopleIcon },
  { href: "/settings", label: "Settings", Icon: SettingsIcon },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ href, label, Icon }) => {
          const active = pathname === href || (href === "/friends" && pathname === "/join");
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-1 pb-2 pt-3 text-[11px] font-medium transition-colors ${
                active ? "text-fg" : "text-muted"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
