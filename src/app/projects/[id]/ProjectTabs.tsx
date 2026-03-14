"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface ProjectTabsProps {
    projectId: string
}

export function ProjectTabs({ projectId }: ProjectTabsProps) {
    const pathname = usePathname()
    const isBoard = pathname.endsWith("/board")

    const tabs = [
        { label: "[C] Canvas", href: `/projects/${projectId}`, active: !isBoard },
        { label: "[B] Board", href: `/projects/${projectId}/board`, active: isBoard },
    ]

    return (
        <div className="flex items-center gap-0 border-b border-border bg-background flex-shrink-0">
            {tabs.map((tab) => (
                <Link
                    key={tab.href}
                    href={tab.href}
                    className={`font-mono text-xs uppercase px-4 py-2 border-r border-border transition-colors ${
                        tab.active
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                    {tab.label}
                </Link>
            ))}
        </div>
    )
}
