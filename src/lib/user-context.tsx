'use client'

import { createContext, useContext, ReactNode } from 'react'

interface UserContextType {
    id: string
    name: string
    email: string
}

const UserContext = createContext<UserContextType | null>(null)

interface UserProviderProps {
    user: UserContextType | null
    children: ReactNode
}

export function UserProvider({ user, children }: UserProviderProps) {
    return <UserContext.Provider value={user}>{children}</UserContext.Provider>
}

export function useUser() {
    return useContext(UserContext)
}
