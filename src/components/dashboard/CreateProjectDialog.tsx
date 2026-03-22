"use client"

import { useState } from "react"

interface CreateProjectDialogProps {
    onCreate: (name: string, url: string) => void
}

export function CreateProjectDialog({ onCreate }: CreateProjectDialogProps) {
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const [url, setUrl] = useState("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onCreate(name, url)
        setOpen(false)
        setName("")
        setUrl("")
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="font-mono text-[11px] font-semibold px-4 py-2 bg-[#88FF66] border border-[#88FF66] text-[#050505] transition-colors hover:bg-[#6be043] hover:border-[#6be043]"
            >
                + NEW PROJECT
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
                        CREATE PROJECT
                    </span>
                    <button
                        onClick={() => setOpen(false)}
                        className="font-mono text-[11px] transition-colors hover:text-[#050505]"
                        style={{ color: "#888888" }}
                    >
                        [×] Close
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4">
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="font-mono text-[9px] uppercase" style={{ color: "#888888" }}>/ PROJECT NAME</label>
                            <input
                                type="text"
                                placeholder="Acme Corp Website"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full bg-transparent px-3 py-2 text-sm font-mono focus:outline-none"
                                style={{ border: "1px solid #E0E0E0", color: "#050505" }}
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="font-mono text-[9px] uppercase" style={{ color: "#888888" }}>/ WEBSITE URL (OPTIONAL)</label>
                            <input
                                type="text"
                                placeholder="https://example.com"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full bg-transparent px-3 py-2 text-sm font-mono focus:outline-none"
                                style={{ border: "1px solid #E0E0E0", color: "#050505" }}
                            />
                        </div>
                    </div>

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
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
