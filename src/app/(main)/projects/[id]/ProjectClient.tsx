"use client"

import { MarkupItem } from "@/components/project/MarkupItem"
import { CreateMarkupDialog } from "@/components/project/CreateMarkupDialog"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Settings } from "lucide-react"
import Link from "next/link"
import { Markup, Project } from "@/lib/db"
import { createMarkup } from "@/app/actions"

// Helper to convert file to base64
const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = (error) => reject(error)
    })
}

interface ProjectClientProps {
    projectId: string
    project?: Project
    initialMarkups: Markup[]
}

export function ProjectClient({ projectId, project, initialMarkups }: ProjectClientProps) {
    const handleCreateMarkup = async (name: string, url: string, type: "website" | "image", file?: File) => {
        let finalUrl = url

        if (type === "image" && file) {
            try {
                // Convert to base64 for local storage persistence (and now JSON server persistence)
                finalUrl = await convertFileToBase64(file)
            } catch (error) {
                console.error("Failed to convert image", error)
                return
            }
        }

        const formData = new FormData()
        formData.append("projectId", projectId)
        formData.append("name", name)
        formData.append("url", finalUrl)
        formData.append("type", type)
        formData.append("viewport", "desktop")

        // We need to pass prevState, but we can just call it directly if we don't care about validation errors in UI yet
        // Or use useFormState but CreateMarkupDialog is handling the form.
        // We'll just call the action.
        await createMarkup(null, formData)
    }

    return (
        <div className="flex flex-col gap-6 p-4 md:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href="/">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{project?.name || "Project"}</h1>
                        <p className="text-sm text-muted-foreground">Manage markups and feedback</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <CreateMarkupDialog onCreate={handleCreateMarkup} />
                </div>
            </div>

            {initialMarkups.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {initialMarkups.map((markup) => (
                        <MarkupItem key={markup.id} {...markup} />
                    ))}
                </div>
            ) : (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed text-center animate-in fade-in-50">
                    <p className="text-muted-foreground">No markups found. Add one to get started.</p>
                </div>
            )}
        </div>
    )
}
