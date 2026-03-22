import { Navbar } from "@/components/layout/Navbar"

interface ProjectLayoutProps {
    children: React.ReactNode
}

export default function ProjectLayout({ children }: ProjectLayoutProps) {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <Navbar />
            <div className="flex-1 overflow-hidden">{children}</div>
        </div>
    )
}
