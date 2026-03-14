import { Navbar } from "@/components/layout/Navbar"
import { ProjectTabs } from "./ProjectTabs"

interface ProjectLayoutProps {
    children: React.ReactNode
    params: Promise<{ id: string }>
}

export default async function ProjectLayout({ children, params }: ProjectLayoutProps) {
    const { id } = await params
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <Navbar />
            <ProjectTabs projectId={id} />
            <div className="flex-1 overflow-hidden">{children}</div>
        </div>
    )
}
