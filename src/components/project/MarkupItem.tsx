import Link from "next/link"
import { MoreHorizontal, ExternalLink, Monitor, Smartphone, Tablet } from "lucide-react"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface MarkupItemProps {
    id: string
    projectId: string
    name: string
    url: string
    viewport: "desktop" | "tablet" | "mobile"
    commentCount: number
    thumbnail?: string
    type?: "website" | "image"
}

export function MarkupItem({ id, projectId, name, url, viewport, commentCount, type }: MarkupItemProps) {
    const Icon = viewport === "mobile" ? Smartphone : viewport === "tablet" ? Tablet : Monitor

    return (
        <Card className="flex flex-col overflow-hidden group hover:shadow-lg transition-all duration-300">
            <div className="relative aspect-video w-full bg-muted/50 overflow-hidden">
                {type === "image" || url.startsWith("blob:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={url}
                        alt={name}
                        className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
                        <span className="text-sm">No Preview</span>
                    </div>
                )}
                <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                        <Icon className="h-3 w-3 mr-1" />
                        {viewport}
                    </Badge>
                </div>
            </div>
            <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between space-y-0">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-medium leading-none">
                            <Link href={`/markup/${id}`} className="hover:underline">
                                {name}
                            </Link>
                        </CardTitle>
                        <p className="text-xs text-muted-foreground line-clamp-1">{url}</p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="-mr-2 h-6 w-6 text-muted-foreground">
                                <MoreHorizontal className="h-3 w-3" />
                                <span className="sr-only">Menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardFooter className="p-4 pt-2 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                    {commentCount} comments
                </div>
                <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                    <Link href={`/markup/${id}`}>
                        View <ExternalLink className="ml-2 h-3 w-3" />
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
