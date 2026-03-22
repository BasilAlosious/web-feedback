import { Navbar } from "@/components/layout/Navbar";
import { KeyboardShortcuts } from "@/components/layout/KeyboardShortcuts";

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="relative flex h-screen flex-col overflow-hidden bg-background">
            <KeyboardShortcuts />
            <Navbar />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}
