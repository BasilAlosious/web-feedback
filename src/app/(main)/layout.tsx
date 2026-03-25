import { Navbar } from "@/components/layout/Navbar";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";
import { getCurrentUser } from "@/lib/auth";
import { UserProvider } from "@/lib/user-context";

export default async function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();

    return (
        <UserProvider user={user ? { id: user.id, name: user.name, email: user.email } : null}>
            <div className="relative flex h-screen flex-col overflow-hidden bg-background">
                <KeyboardShortcuts />
                <Navbar />
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </UserProvider>
    );
}
