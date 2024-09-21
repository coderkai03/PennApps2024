"use client"

import { useState } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function VideoInputScreen({ onNext }: { onNext: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleNext = () => {
    if (file) {
      onNext(file)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-4 bg-card rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center">Upload Video</h1>
        <div className="space-y-2">
          <Label htmlFor="video-upload">Select a video file</Label>
          <Input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>
        {file && (
          <p className="text-sm text-muted-foreground">
            Selected file: {file.name}
          </p>
        )}
        <Button
          onClick={handleNext}
          disabled={!file}
          className="w-full"
        >
          <Upload className="w-4 h-4 mr-2" />
          Next
        </Button>
      </div>
    </div>
  )
}