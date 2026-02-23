import Link from "next/link"
import { MoreHorizontal, ExternalLink } from "lucide-react"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ProjectCardProps {
    id: string
    name: string
    url: string
    markupCount: number
    updatedAt: string
}

export function ProjectCard({ id, name, url, markupCount, updatedAt }: ProjectCardProps) {
    return (
        <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-semibold">
                        <Link href={`/projects/${id}`} className="hover:underline">
                            {name}
                        </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-1 text-xs">
                        {url}
                    </CardDescription>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Menu</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit Project</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Delete Project</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1 pb-2">
                {/* Preview image or statistics could go here */}
                <div className="h-24 w-full rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground text-sm">
                    Preview
                </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between pt-2">
                <div className="text-xs text-muted-foreground">
                    {markupCount} markups • {updatedAt}
                </div>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href={`/projects/${id}`}>
                        Open <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
