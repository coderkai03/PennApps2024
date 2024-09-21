"use client"

import { useState, useEffect } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { Progress } from "@/components/ui/progress"

interface Chapter {
  title: string;
  startTime: number;
  endTime: number;
}

export default function VideoInputScreen({ onNext }: { onNext: (file: File, chapters: Chapter[]) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (file) {
      setUploading(true)
      setUploadProgress(0)
      const formData = new FormData()
      formData.append('video', file)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const reader = response.body!.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const updates = chunk.split('\n').filter(Boolean).map(JSON.parse)

          for (const update of updates) {
            if (update.progress) {
              setUploadProgress(update.progress)
            }
            if (update.videoUrl) {
              // Video upload is complete, now process the video
              const processResponse = await fetch('/api/process-video', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ videoUrl: update.videoUrl }),
              })

              if (!processResponse.ok) {
                throw new Error('Failed to process video')
              }

              const result = await processResponse.json()
              onNext(file, result.chapters)
            }
          }
        }
      } catch (error) {
        console.error('Error uploading and processing video:', error)
        // Handle error (e.g., show error message to user)
      } finally {
        setUploading(false)
      }
    }
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-md p-8 space-y-4 bg-card dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-center text-foreground dark:text-white">Upload Video</h1>
          <Button onClick={toggleTheme} variant="outline" size="sm">
            {theme === 'dark' ? '🌞' : '🌙'}
          </Button>
        </div>
        <div className="space-y-2">
          <Label htmlFor="video-upload" className="text-foreground dark:text-white">Select a video file</Label>
          <Input
            id="video-upload"
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="cursor-pointer bg-background dark:bg-gray-700 text-foreground dark:text-white"
          />
        </div>
        {file && (
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Selected file: {file.name}
          </p>
        )}
        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {uploading ? (
            <>Uploading...</>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload and Process
            </>
          )}
        </Button>
        {uploading && (
          <div className="space-y-2">
            <Progress value={uploadProgress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground dark:text-gray-400">
              Upload progress: {uploadProgress}%
            </p>
          </div>
        )}
      </div>
    </div>
  )
}