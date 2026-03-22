"use client"

import { useState } from "react"

interface CreateMarkupDialogProps {
    onCreate: (name: string, url: string, type: "website" | "image", file?: File) => void
}

export function CreateMarkupDialog({ onCreate }: CreateMarkupDialogProps) {
    const [open, setOpen] = useState(false)
    const [type, setType] = useState<"website" | "image">("website")

    // Website state
    const [url, setUrl] = useState("")
    const [name, setName] = useState("")

    // Image state
    const [imageName, setImageName] = useState("")
    const [file, setFile] = useState<File | undefined>(undefined)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (type === "website") {
            onCreate(name, url, "website")
        } else {
            if (!file) return
            onCreate(imageName, "", "image", file)
        }

        setOpen(false)
        setUrl("")
        setName("")
        setImageName("")
        setFile(undefined)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
        }
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="font-mono text-[11px] font-semibold px-3 py-1.5 border transition-colors w-full border-[#E0E0E0] bg-white text-[#050505] hover:bg-[#88FF66] hover:border-[#88FF66]"
            >
                + ADD PAGE
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-foreground/20"
                onClick={() => setOpen(false)}
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md" style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0" }}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "#E0E0E0" }}>
                    <span className="font-mono text-[11px] uppercase font-semibold" style={{ color: "#050505" }}>
                        ADD NEW PAGE
                    </span>
                    <button
                        onClick={() => setOpen(false)}
                        className="font-mono text-[11px] transition-colors hover:text-[#050505]"
                        style={{ color: "#888888" }}
                    >
                        [×] Close
                    </button>
                </div>

                {/* Type Tabs */}
                <div className="flex border-b" style={{ borderColor: "#E0E0E0" }}>
                    <button
                        onClick={() => setType("website")}
                        className="flex-1 px-4 py-2 font-mono text-[11px] uppercase transition-colors"
                        style={{
                            backgroundColor: type === "website" ? "#88FF66" : "#FFFFFF",
                            color: "#050505",
                        }}
                    >
                        [W] WEBSITE
                    </button>
                    <button
                        onClick={() => setType("image")}
                        className="flex-1 px-4 py-2 font-mono text-[11px] uppercase transition-colors"
                        style={{
                            backgroundColor: type === "image" ? "#88FF66" : "#FFFFFF",
                            color: type === "image" ? "#050505" : "#888888",
                        }}
                    >
                        [I] IMAGE
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4">
                    {type === "website" ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="font-mono text-[9px] uppercase" style={{ color: "#888888" }}>/ WEBSITE URL</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/page"
                                    required
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full bg-transparent px-3 py-2 text-sm font-mono focus:outline-none"
                                    style={{ border: "1px solid #E0E0E0", color: "#050505" }}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-mono text-[9px] uppercase" style={{ color: "#888888" }}>/ PAGE NAME</label>
                                <input
                                    type="text"
                                    placeholder="Homepage"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-transparent px-3 py-2 text-sm font-mono focus:outline-none"
                                    style={{ border: "1px solid #E0E0E0", color: "#050505" }}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="font-mono text-[9px] uppercase" style={{ color: "#888888" }}>/ UPLOAD IMAGE</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                    className="w-full bg-transparent px-3 py-2 text-sm font-mono focus:outline-none file:mr-4 file:py-1 file:px-2 file:border-0 file:text-xs file:font-mono file:bg-[#F5F5F5] file:text-[#050505]"
                                    style={{ border: "1px solid #E0E0E0", color: "#050505" }}
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="font-mono text-[9px] uppercase" style={{ color: "#888888" }}>/ NAME</label>
                                <input
                                    type="text"
                                    placeholder="Design Mockup V2"
                                    required
                                    value={imageName}
                                    onChange={(e) => setImageName(e.target.value)}
                                    className="w-full bg-transparent px-3 py-2 text-sm font-mono focus:outline-none"
                                    style={{ border: "1px solid #E0E0E0", color: "#050505" }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t" style={{ borderColor: "#E0E0E0" }}>
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="font-mono text-[11px] px-4 py-2 border border-[#E0E0E0] text-[#888888] transition-colors hover:border-[#050505] hover:text-[#050505]"
                        >
                            CANCEL
                        </button>
                        <button
                            type="submit"
                            className="font-mono text-[11px] font-semibold px-4 py-2 bg-[#88FF66] border border-[#88FF66] text-[#050505] transition-colors hover:bg-[#6be043] hover:border-[#6be043]"
                        >
                            Create Page
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
