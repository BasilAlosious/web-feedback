"use client"

import { useState } from "react"
import Link from "next/link"

export function SettingsClient() {
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [taskNotifications, setTaskNotifications] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: Implement invite logic
        alert(`Invite sent to: ${inviteEmail}`)
        setInviteEmail("")
    }

    const shortcuts = [
        { key: "[D]", description: "Go to Dashboard" },
        { key: "[F]", description: "Go to Feedback" },
        { key: "[P]", description: "Go to Projects" },
        { key: "[S]", description: "Go to Settings" },
        { key: "[TAB]", description: "Switch Mode (Canvas: Browse/Comment)" },
        { key: "[Cmd+K]", description: "Quick Search" },
    ]

    return (
        <div className="flex flex-col h-full" style={{ backgroundColor: "#F5F5F5" }}>
            {/* Page Header */}
            <div className="p-12 flex items-center justify-between">
                <h1 className="font-mono text-[24px] font-semibold" style={{ color: "#050505" }}>
                    Settings
                </h1>
                <Link
                    href="/"
                    className="font-mono text-[11px] px-4 py-2 border transition-colors border-[#E0E0E0] bg-white text-[#050505] hover:bg-[#88FF66] hover:border-[#88FF66]"
                >
                    ← BACK TO PROJECTS
                </Link>
            </div>

            {/* Settings Sections */}
            <div className="flex-1 px-12 pb-12 overflow-y-auto">
                <div className="flex flex-col gap-12">
                    {/* Account Section */}
                    <div className="flex flex-col gap-4">
                        <div className="font-mono text-[11px] font-semibold uppercase" style={{ color: "#888888" }}>
                            ACCOUNT
                        </div>
                        <div
                            className="p-6 flex flex-col gap-4"
                            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0" }}
                        >
                            {/* Name Row */}
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px]" style={{ color: "#050505" }}>
                                    Name
                                </span>
                                <span className="font-mono text-[11px]" style={{ color: "#888888" }}>
                                    Basil Alosious
                                </span>
                            </div>

                            {/* Email Row */}
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px]" style={{ color: "#050505" }}>
                                    Email
                                </span>
                                <span className="font-mono text-[11px]" style={{ color: "#888888" }}>
                                    basil@example.com
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Keyboard Shortcuts Section */}
                    <div className="flex flex-col gap-4">
                        <div className="font-mono text-[11px] font-semibold uppercase" style={{ color: "#888888" }}>
                            KEYBOARD SHORTCUTS
                        </div>
                        <div
                            className="p-6 flex flex-col gap-3"
                            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0" }}
                        >
                            {shortcuts.map((shortcut, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <span className="font-mono text-[11px] font-semibold" style={{ color: "#050505" }}>
                                        {shortcut.key}
                                    </span>
                                    <span className="font-mono text-[11px]" style={{ color: "#888888" }}>
                                        {shortcut.description}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notifications Section */}
                    <div className="flex flex-col gap-4">
                        <div className="font-mono text-[11px] font-semibold uppercase" style={{ color: "#888888" }}>
                            NOTIFICATIONS
                        </div>
                        <div
                            className="p-6 flex flex-col gap-4"
                            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0" }}
                        >
                            {/* Email notifications for new comments */}
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px]" style={{ color: "#050505" }}>
                                    Email notifications for new comments
                                </span>
                                <button
                                    onClick={() => setEmailNotifications(!emailNotifications)}
                                    className="w-10 h-5 rounded-full transition-colors"
                                    style={{
                                        backgroundColor: emailNotifications ? "#88FF66" : "#E0E0E0"
                                    }}
                                />
                            </div>

                            {/* Email notifications for task assignments */}
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[11px]" style={{ color: "#050505" }}>
                                    Email notifications for task assignments
                                </span>
                                <button
                                    onClick={() => setTaskNotifications(!taskNotifications)}
                                    className="w-10 h-5 rounded-full transition-colors"
                                    style={{
                                        backgroundColor: taskNotifications ? "#88FF66" : "#E0E0E0"
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Team Section */}
                    <div className="flex flex-col gap-4">
                        <div className="font-mono text-[11px] font-semibold uppercase" style={{ color: "#888888" }}>
                            TEAM
                        </div>
                        <div
                            className="p-6 flex flex-col gap-4"
                            style={{ backgroundColor: "#FFFFFF", border: "1px solid #E0E0E0" }}
                        >
                            {/* Description */}
                            <p className="font-mono text-[11px]" style={{ color: "#888888" }}>
                                Invite team members to collaborate on projects
                            </p>

                            {/* Invite Form */}
                            <form onSubmit={handleInvite} className="flex items-center gap-3">
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="flex-1 h-9 px-3 font-mono text-[11px]"
                                    style={{
                                        backgroundColor: "#F5F5F5",
                                        border: "none",
                                        color: "#050505"
                                    }}
                                    required
                                />
                                <button
                                    type="submit"
                                    className="w-25 h-9 px-4 font-mono text-[11px] font-semibold transition-colors hover:opacity-90"
                                    style={{
                                        backgroundColor: "#88FF66",
                                        color: "#050505"
                                    }}
                                >
                                    INVITE
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
