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
                className="btn-action-primary"
            >
                [+] Add Markup
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
            <div className="relative w-full max-w-md bg-background border border-border">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="font-mono text-xs uppercase font-medium">
                        Add New Markup
                    </span>
                    <button
                        onClick={() => setOpen(false)}
                        className="font-mono text-xs text-muted-foreground hover:text-foreground"
                    >
                        [×] Close
                    </button>
                </div>

                {/* Type Tabs */}
                <div className="flex border-b border-border">
                    <button
                        onClick={() => setType("website")}
                        className={`flex-1 px-4 py-2 font-mono text-xs uppercase ${
                            type === "website"
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        [W] Website
                    </button>
                    <button
                        onClick={() => setType("image")}
                        className={`flex-1 px-4 py-2 font-mono text-xs uppercase ${
                            type === "image"
                                ? "bg-accent text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        [I] Image
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-4">
                    {type === "website" ? (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="slash-label">Website URL</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/page"
                                    required
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="w-full bg-transparent border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-foreground"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="slash-label">Page Name</label>
                                <input
                                    type="text"
                                    placeholder="Homepage"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-transparent border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-foreground"
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="slash-label">Upload Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required
                                    className="w-full bg-transparent border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-foreground file:mr-4 file:py-1 file:px-2 file:border-0 file:text-xs file:font-mono file:bg-muted file:text-foreground"
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="slash-label">Name</label>
                                <input
                                    type="text"
                                    placeholder="Design Mockup V2"
                                    required
                                    value={imageName}
                                    onChange={(e) => setImageName(e.target.value)}
                                    className="w-full bg-transparent border border-border px-3 py-2 text-sm font-mono focus:outline-none focus:border-foreground"
                                />
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border-light">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="btn-action"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-action-primary"
                        >
                            Create Markup
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
