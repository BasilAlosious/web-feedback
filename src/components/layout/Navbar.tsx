"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
    const pathname = usePathname()

    const navItems = [
        { key: "D", label: "Dashboard", href: "/" },
        { key: "F", label: "Feedback", href: "/feedback" },
        { key: "P", label: "Projects", href: "/projects" },
        { key: "S", label: "Settings", href: "/settings" },
    ]

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/"
        return pathname.startsWith(href)
    }

    return (
        <header className="sticky top-0 z-50 w-full h-12 border-b border-[#E0E0E0] bg-[#F5F5F5]">
            <div className="flex h-full items-center px-8">
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
            </div>
        </header>
    )
}
