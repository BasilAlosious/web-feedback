"use client"

import Link from "next/link"
import { ArrowLeft, MessageSquare, MousePointer2, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ViewportControls } from "@/components/markup/ViewportControls"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface MarkupToolbarProps {
    projectId: string
    projectName: string
    viewport: "desktop" | "tablet" | "mobile"
    onViewportChange: (viewport: "desktop" | "tablet" | "mobile") => void
    mode: "browse" | "comment"
    onModeChange: (mode: "browse" | "comment") => void
    onToggleThread?: () => void
    isGuest?: boolean
    onShare?: () => void
}

export function MarkupToolbar({
    projectId,
    projectName,
    viewport,
    onViewportChange,
    mode,
    onModeChange,
    onToggleThread,
    isGuest = false,
    onShare
}: MarkupToolbarProps) {
    return (
        <div className="flex items-center justify-between border-b bg-background p-2 h-14">
            <div className="flex items-center gap-4">
                {!isGuest ? (
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/projects/${projectId}`}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                ) : (
                    <div className="w-10" /> // Spacer
                )}
                <span className="font-medium text-sm hidden sm:inline-block">
                    {projectName}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <ViewportControls viewport={viewport} onViewportChange={onViewportChange} />

                <Separator orientation="vertical" className="h-6 mx-2" />

                <ToggleGroup
                    type="single"
                    value={mode}
                    onValueChange={(value) => {
                        if (value) onModeChange(value as "browse" | "comment")
                    }}
                    className="border rounded-md"
                >
                    <ToggleGroupItem value="browse" aria-label="Browse Mode">
                        <MousePointer2 className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Browse</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="comment" aria-label="Comment Mode">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Comment</span>
                    </ToggleGroupItem>
                </ToggleGroup>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onToggleThread}>
                    <MessageSquare className="h-4 w-4" />
                </Button>
                {!isGuest && (
                    <Button variant="outline" size="sm" onClick={onShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                    </Button>
                )}
            </div>
        </div>
    )
}
