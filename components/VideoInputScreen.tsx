"use client"

import { useState, useEffect } from "react"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTheme } from "next-themes"
import { Progress } from "@/components/ui/progress"

export default function VideoInputScreen({ onNext }: { onNext: (file: File, chapters: any) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleUpload = async () => {
    if (file) {
      setIsUploading(true)
      setUploadProgress(0)
      const formData = new FormData()
      formData.append('video', file)

      try {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload', true)

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            let progress = (event.loaded / event.total) * 100
            if (progress >= 95) {
              progress = 95 // Cap the progress at 99% during upload
            }
            setUploadProgress(progress)
          }
        }

        xhr.onload = async () => {
          if (xhr.status === 200) {
            const { videoUrl } = JSON.parse(xhr.responseText)
            setIsUploading(false)
            setIsProcessing(true)
            await processVideo(videoUrl)
          } else {
            throw new Error('Upload failed')
          }
        }

        xhr.onerror = () => {
          throw new Error('Upload failed')
        }

        xhr.send(formData)
      } catch (error) {
        console.error('Error uploading video:', error)
        setError('Failed to upload video. Please try again.')
        setIsUploading(false)
      }
    }
  }

  const processVideo = async (videoUrl: string) => {
    setProcessingProgress(0)
    try {
      const processResponse = await fetch('/api/process-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoUrl }),
      })

      if (!processResponse.ok) {
        throw new Error('Failed to process video')
      }

      // thiis is only a simulation for processing 
      for (let i = 0; i <= 100; i += 20) { 
        setProcessingProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200)) 
      }


      const result = await processResponse.json()
      onNext(file!, result.chapters)
    } catch (error) {
      console.error('Error processing video:', error)
      setError('Failed to process video. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
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
            disabled={isUploading || isProcessing}
          />
        </div>
        {file && (
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            Selected file: {file.name}
          </p>
        )}
        {isUploading && (
          <div className="space-y-2">
            <Label className="text-foreground dark:text-white">Uploading...</Label>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}
        {isProcessing && (
          <div className="space-y-2">
            <Label className="text-foreground dark:text-white">Processing...</Label>
            <Progress value={processingProgress} className="w-full" />
          </div>
        )}
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        <Button
          onClick={handleUpload}
          disabled={!file || isUploading || isProcessing}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isUploading ? (
            <>Uploading...</>
          ) : isProcessing ? (
            <>Processing...</>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload and Process
            </>
          )}
        </Button>
      </div>
    </div>
  )
}