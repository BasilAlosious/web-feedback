import Link from "next/link"
import { Monitor, Smartphone, Tablet } from "lucide-react"

interface MarkupItemProps {
    id: string
    projectId: string
    name: string
    url: string
    viewport: "desktop" | "tablet" | "mobile"
    commentCount: number
    thumbnail?: string
    type?: "website" | "image"
}

export function MarkupItem({ id, name, url, viewport, commentCount, type }: MarkupItemProps) {
    const Icon = viewport === "mobile" ? Smartphone : viewport === "tablet" ? Tablet : Monitor

    // Status based on comment count
    const status = commentCount === 0 ? "new" : commentCount < 5 ? "open" : "active"
    const statusLabels = {
        new: "NEW",
        open: "OPEN",
        active: "ACTIVE"
    }

    return (
        <Link
            href={`/markup/${id}`}
            className="list-row grid-cols-[auto_1fr_100px_80px_60px] group"
        >
            {/* Thumbnail */}
            <div className="w-16 h-10 border border-border overflow-hidden flex-shrink-0">
                {type === "image" || url.startsWith("data:") || url.startsWith("blob:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={url}
                        alt={name}
                        className="h-full w-full object-cover object-top"
                    />
                ) : (
                    <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground">
                        <Icon className="h-4 w-4" />
                    </div>
                )}
            </div>

            {/* Name & URL */}
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-medium text-foreground group-hover:text-accent transition-colors truncate">
                    {name}
                </span>
                <span className="text-xs text-muted-foreground font-mono truncate">
                    {type === "image" ? "Uploaded image" : url}
                </span>
            </div>

            {/* Status Badge */}
            <span className="status-badge justify-self-center">
                {statusLabels[status]}
            </span>

            {/* Viewport */}
            <span className="font-mono text-xs text-muted-foreground flex items-center gap-1">
                <Icon className="h-3 w-3" />
                {viewport}
            </span>

            {/* Comment Count */}
            <span className="font-mono text-xs text-muted-foreground text-right">
                {commentCount}
            </span>
        </Link>
    )
}
