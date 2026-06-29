"use client"

interface FigmaViewerProps {
    figmaUrl: string
}

function toFigmaEmbedUrl(url: string): string {
    // Already an embed URL
    if (url.includes('figma.com/embed')) return url
    return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}&scaling=min-zoom&hide-ui=1`
}

export function FigmaViewer({ figmaUrl }: FigmaViewerProps) {
    const embedUrl = toFigmaEmbedUrl(figmaUrl)

    return (
        <div className="absolute inset-0 bg-[#1E1E1E] flex flex-col">
            <div
                className="flex-shrink-0 h-6 flex items-center px-3 gap-2"
                style={{ backgroundColor: "#1E1E1E", borderBottom: "1px solid #333" }}
            >
                <span className="font-mono text-[9px] text-[#888]">FIGMA PROTOTYPE</span>
                <span className="font-mono text-[9px] text-[#555] truncate">{figmaUrl}</span>
            </div>
            <iframe
                src={embedUrl}
                className="flex-1 w-full border-0"
                title="Figma Prototype"
                allowFullScreen
            />
        </div>
    )
}
