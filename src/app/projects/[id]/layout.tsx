import { Navbar } from "@/components/layout/Navbar"

export default function ProjectLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <Navbar />
            <div className="flex-1 overflow-hidden">{children}</div>
        </div>
    )
}
