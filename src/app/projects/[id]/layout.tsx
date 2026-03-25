import { Navbar } from "@/components/layout/Navbar"
import { getCurrentUser } from "@/lib/auth"
import { UserProvider } from "@/lib/user-context"

interface ProjectLayoutProps {
    children: React.ReactNode
}

export default async function ProjectLayout({ children }: ProjectLayoutProps) {
    const user = await getCurrentUser()

    return (
        <UserProvider user={user ? { id: user.id, name: user.name, email: user.email } : null}>
            <div className="flex h-screen flex-col overflow-hidden bg-background">
                <Navbar />
                <div className="flex-1 overflow-hidden">{children}</div>
            </div>
        </UserProvider>
    )
}
