import { DashboardClient } from "./DashboardClient"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }
  const projects = await db.getProjects(user.id)
  const commentCounts = await db.getCommentCountsForProjects(projects.map(p => p.id))
  return <DashboardClient initialProjects={projects} commentCounts={commentCounts} />
}
