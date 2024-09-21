"use client"

import { useState, useEffect } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"

export default function VideoInputScreen({ onNext }: { onNext: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null)
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

  const handleNext = () => {
    if (file) {
      onNext(file)
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
          onClick={handleNext}
          disabled={!file}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Upload className="w-4 h-4 mr-2" />
          Next
        </Button>
      </div>
    </div>
  )
}