import { DashboardClient } from "./DashboardClient"
import { db } from "@/lib/db"

export default async function DashboardPage() {
  const projects = db.getProjects()
  return <DashboardClient initialProjects={projects} />
}
