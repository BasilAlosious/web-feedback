"use client"

import { useState } from "react"
import { Plus, Globe, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
            // For image, we need a file
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Markup
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Markup</DialogTitle>
                    <DialogDescription>
                        Add a website URL or upload an image to start commenting.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="website" onValueChange={(v) => setType(v as "website" | "image")}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="website">
                            <Globe className="mr-2 h-4 w-4" />
                            Website
                        </TabsTrigger>
                        <TabsTrigger value="image">
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Image
                        </TabsTrigger>
                    </TabsList>
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                        <TabsContent value="website" className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="url">Website URL</Label>
                                <Input
                                    id="url"
                                    placeholder="https://example.com/pricing"
                                    required={type === "website"}
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Page Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Pricing Page"
                                    required={type === "website"}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        </TabsContent>
                        <TabsContent value="image" className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="image">Upload Image</Label>
                                <Input
                                    id="image"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    required={type === "image"}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="img-name">Name</Label>
                                <Input
                                    id="img-name"
                                    placeholder="Homepage Design V2"
                                    required={type === "image"}
                                    value={imageName}
                                    onChange={(e) => setImageName(e.target.value)}
                                />
                            </div>
                        </TabsContent>
                        <DialogFooter>
                            <Button type="submit">Create Markup</Button>
                        </DialogFooter>
                    </form>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
