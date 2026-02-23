"use client"

import { Monitor, Smartphone, Tablet } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

interface ViewportControlsProps {
    viewport: "desktop" | "tablet" | "mobile"
    onViewportChange: (viewport: "desktop" | "tablet" | "mobile") => void
}

export function ViewportControls({ viewport, onViewportChange }: ViewportControlsProps) {
    return (
        <ToggleGroup
            type="single"
            value={viewport}
            onValueChange={(value) => {
                if (value) onViewportChange(value as "desktop" | "tablet" | "mobile")
            }}
            className="border rounded-md"
        >
            <ToggleGroupItem value="desktop" aria-label="Desktop">
                <Monitor className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="tablet" aria-label="Tablet">
                <Tablet className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="mobile" aria-label="Mobile">
                <Smartphone className="h-4 w-4" />
            </ToggleGroupItem>
        </ToggleGroup>
    )
}
