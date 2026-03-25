"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/app/logout/actions"
import { useUser } from "@/lib/user-context"

export function Navbar() {
    const pathname = usePathname()
    const user = useUser()

    const navItems = [
        { key: "P", label: "Projects", href: "/" },
        { key: "S", label: "Settings", href: "/settings" },
    ]

    const isActive = (href: string) => {
        if (href === "/") {
            // Projects is active on home AND when viewing individual projects
            return pathname === "/" || pathname.startsWith("/projects")
        }
        return pathname === href || pathname.startsWith(href)
    }

    return (
        <header className="sticky top-0 z-50 w-full h-12 border-b border-[#E0E0E0] bg-[#F5F5F5]">
            <div className="flex h-full items-center justify-between px-8">
                {/* Global nav links */}
                <nav className="flex items-center gap-8">
                    {navItems.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className="font-mono text-[11px] transition-colors"
                            style={{
                                color: isActive(item.href) ? "#050505" : "#888888",
                                fontWeight: isActive(item.href) ? 600 : "normal",
                            }}
                        >
                            [{item.key}] {item.label.toUpperCase()}
                        </Link>
                    ))}
                </nav>

                {/* User info and logout */}
                <div className="flex items-center gap-4">
                    {user && (
                        <span className="font-mono text-[11px] text-[#888888]">
                            {user.name}
                        </span>
                    )}
                    <form action={logout}>
                        <button
                            type="submit"
                            className="font-mono text-[11px] text-[#888888] hover:text-[#050505] transition-colors"
                        >
                            [X] LOGOUT
                        </button>
                    </form>
                </div>
            </div>
        </header>
    )
}
