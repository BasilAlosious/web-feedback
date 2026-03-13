"use client"

import { useState } from "react"

interface FilterItem {
    id: string
    label: string
    count?: number
    active?: boolean
}

interface FilterGroup {
    id: string
    label: string
    expanded?: boolean
    items: FilterItem[]
}

interface SidebarProps {
    title?: string
    titleCount?: number
    filterGroups?: FilterGroup[]
    onFilterChange?: (groupId: string, itemId: string) => void
}

export function Sidebar({
    title = "Feedback",
    titleCount = 24,
    filterGroups: initialGroups,
    onFilterChange
}: SidebarProps) {
    const defaultGroups: FilterGroup[] = [
        {
            id: "status",
            label: "Status",
            expanded: true,
            items: [
                { id: "unread", label: "Unread", count: 12 },
                { id: "open", label: "Open", count: 24, active: true },
                { id: "in-progress", label: "In Progress", count: 8 },
                { id: "resolved", label: "Resolved", count: 102 },
            ]
        },
        {
            id: "pages",
            label: "Pages",
            expanded: false,
            items: []
        },
        {
            id: "urgency",
            label: "Urgency",
            expanded: false,
            items: []
        }
    ]

    const [filterGroups, setFilterGroups] = useState<FilterGroup[]>(initialGroups || defaultGroups)

    const toggleGroup = (groupId: string) => {
        setFilterGroups(groups =>
            groups.map(g =>
                g.id === groupId ? { ...g, expanded: !g.expanded } : g
            )
        )
    }

    const toggleFilter = (groupId: string, itemId: string) => {
        setFilterGroups(groups =>
            groups.map(g =>
                g.id === groupId
                    ? {
                        ...g,
                        items: g.items.map(item =>
                            item.id === itemId ? { ...item, active: !item.active } : item
                        )
                    }
                    : g
            )
        )
        onFilterChange?.(groupId, itemId)
    }

    const clearFilters = () => {
        setFilterGroups(groups =>
            groups.map(g => ({
                ...g,
                items: g.items.map(item => ({ ...item, active: false }))
            }))
        )
    }

    return (
        <aside className="w-60 border-r border-border flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                {/* Filter Section */}
                <div className="flex flex-col gap-3">
                    {/* Filter Header */}
                    <div className="flex justify-between items-center mb-1">
                        <span className="slash-label">Filter</span>
                        <button
                            onClick={clearFilters}
                            className="font-mono text-[10px] uppercase cursor-pointer underline text-muted-foreground hover:text-foreground"
                        >
                            Clear Filters
                        </button>
                    </div>

                    {/* Filter Groups */}
                    <div className="mt-2">
                        {filterGroups.map((group) => (
                            <div key={group.id} className="mb-4">
                                {/* Group Header */}
                                <button
                                    onClick={() => toggleGroup(group.id)}
                                    className="tree-item w-full"
                                >
                                    <span className="tree-icon">
                                        {group.expanded ? "−" : "+"}
                                    </span>
                                    <span>{group.label}</span>
                                </button>

                                {/* Group Items */}
                                {group.expanded && group.items.length > 0 && (
                                    <div className="pl-5 flex flex-col">
                                        {group.items.map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => toggleFilter(group.id, item.id)}
                                                className={`tree-item w-full ${item.active ? "active" : ""}`}
                                            >
                                                <span className={`tree-icon ${item.active ? "" : "border-[#ccc]"}`}>
                                                    {item.active && "✓"}
                                                </span>
                                                <span className={item.active ? "text-foreground" : "text-muted-foreground"}>
                                                    {item.label}
                                                </span>
                                                {item.count !== undefined && (
                                                    <span className="count-badge">({item.count})</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Status Widget at Bottom */}
            <div className="p-4 mt-auto">
                <div className="status-widget h-[120px]">
                    <div className="status-widget-header">[ SYSTEM_IDLE ]</div>
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 200 100"
                        preserveAspectRatio="none"
                        className="opacity-50"
                    >
                        {/* Animated wave path */}
                        <path
                            d="M0,100 C50,100 50,80 100,50 C150,20 150,80 200,80 L200,100 Z"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1"
                            opacity="0.5"
                            className="status-wave-animation"
                        />
                        {/* Grid lines */}
                        <line x1="0" y1="20" x2="200" y2="20" stroke="currentColor" strokeWidth="1" strokeDasharray="2,4" opacity="0.2" />
                        <line x1="0" y1="50" x2="200" y2="50" stroke="currentColor" strokeWidth="1" strokeDasharray="2,4" opacity="0.2" />
                        <line x1="0" y1="80" x2="200" y2="80" stroke="currentColor" strokeWidth="1" strokeDasharray="2,4" opacity="0.2" />
                    </svg>
                </div>
            </div>
        </aside>
    )
}
