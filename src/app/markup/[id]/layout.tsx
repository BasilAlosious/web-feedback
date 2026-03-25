import { getCurrentUser } from "@/lib/auth"
import { UserProvider } from "@/lib/user-context"

export default async function MarkupLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await getCurrentUser()

    return (
        <UserProvider user={user ? { id: user.id, name: user.name, email: user.email } : null}>
            <div className="h-screen w-screen overflow-hidden bg-background">
                {children}
            </div>
        </UserProvider>
    )
}
