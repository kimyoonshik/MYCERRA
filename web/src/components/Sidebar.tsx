"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/products", label: "Products" },
  { href: "/offers", label: "Offers" },
  { href: "/leads", label: "Leads / Customers" },
  { href: "/samples", label: "Sample Requests" },
  { href: "/proposals", label: "Proposals" },
  { href: "/content", label: "Content Board" },
  { href: "/risk", label: "Risk Review" },
  { href: "/wadiz", label: "Wadiz Board" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-4">
        <div className="text-lg font-bold text-brand">MYCERRA</div>
        <div className="text-xs text-gray-500">Agent OS · Internal</div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {NAV.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-brand-light text-brand-dark" : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-200 p-2">
        <button onClick={logout} className="btn-secondary w-full">
          Sign out
        </button>
      </div>
    </aside>
  );
}
