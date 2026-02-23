"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileImage, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ImageUploaderProps {
    onImageSelect: (file: File) => void
    onCancel?: () => void
    maxSize?: number // in bytes
}

export function ImageUploader({ onImageSelect, onCancel, maxSize = 5 * 1024 * 1024 }: ImageUploaderProps) {
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0) {
                onImageSelect(acceptedFiles[0])
            }
        },
        [onImageSelect]
    )

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            "image/jpeg": [],
            "image/png": [],
            "image/webp": [],
        },
        maxSize,
        multiple: false,
    })

    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center animate-in fade-in-50">
            <div
                {...getRootProps()}
                className={cn(
                    "relative flex flex-col items-center justify-center w-full max-w-lg rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/5 p-12 transition-all hover:bg-muted/10 cursor-pointer",
                    isDragActive && "border-primary bg-primary/5",
                    isDragReject && "border-destructive bg-destructive/5"
                )}
            >
                <input {...getInputProps()} />

                <div className="mb-4 rounded-full bg-muted p-4">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                </div>

                <h3 className="mb-1 text-lg font-semibold">
                    {isDragActive ? "Drop the image here" : "Upload an image"}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                    Drag and drop or click to browse (up to 5MB)
                </p>

                <div className="flex gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><FileImage className="h-3 w-3" /> PNG, JPG, WebP</span>
                </div>
            </div>

            {onCancel && (
                <Button variant="ghost" onClick={onCancel} className="mt-4">
                    Cancel
                </Button>
            )}
        </div>
    )
}
