"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
    const pathname = usePathname()

    const navItems = [
        { key: "D", label: "Dashboard", href: "/" },
        { key: "F", label: "Feedback", href: "/feedback" },
        { key: "P", label: "Projects", href: "/projects" },
    ]

    const rightNavItems = [
        { key: "?", label: "Help", href: "/help" },
        { key: "S", label: "Settings", href: "/settings" },
    ]

    const isActive = (href: string) => {
        if (href === "/") return pathname === "/"
        return pathname.startsWith(href)
    }

    return (
        <header className="sticky top-0 z-50 w-full h-10 border-b border-border bg-background">
            <div className="flex h-full items-center justify-between px-4">
                {/* Left nav links */}
                <nav className="flex items-center gap-6">
                    {navItems.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`nav-item ${isActive(item.href) ? "active pb-[11px] -mb-[12px]" : ""}`}
                        >
                            <span className="text-foreground">[{item.key}]</span> {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Right nav links */}
                <nav className="flex items-center gap-6">
                    {rightNavItems.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className="nav-item"
                        >
                            <span className="text-foreground">[{item.key}]</span> {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    )
}
