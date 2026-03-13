import Link from "next/link"

interface ProjectCardProps {
    id: string
    name: string
    url: string
    markupCount: number
    updatedAt: string
}

export function ProjectCard({ id, name, url, markupCount, updatedAt }: ProjectCardProps) {
    // Calculate a fake progress for visual effect
    const progress = Math.min(100, Math.floor((markupCount / 20) * 100))
    const filledBars = Math.floor(progress / 10)
    const emptyBars = 10 - filledBars
    const progressBar = "#".repeat(filledBars) + "-".repeat(emptyBars)

    return (
        <Link
            href={`/projects/${id}`}
            className="list-row grid-cols-[1fr_120px_100px_80px] group"
        >
            {/* Project Name & URL */}
            <div className="flex flex-col gap-1">
                <span className="font-medium text-foreground group-hover:text-accent transition-colors">
                    {name}
                </span>
                <span className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                    {url}
                </span>
            </div>

            {/* Progress */}
            <span className="ascii-progress text-xs">
                [<span className="fill">{progressBar}</span>] {progress}%
            </span>

            {/* Markup Count */}
            <span className="font-mono text-xs text-muted-foreground">
                {markupCount} markup{markupCount !== 1 ? "s" : ""}
            </span>

            {/* Updated At */}
            <span className="font-mono text-xs text-muted-foreground text-right">
                {updatedAt}
            </span>
        </Link>
    )
}
