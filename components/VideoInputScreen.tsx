"use client"

import { useState, useEffect } from "react"
import VideoInputForm from './VideoInputForm'
import { Chapter, InstagramReel } from '@/lib/types'

export default function VideoInputScreen({ onNext }: { onNext: (file: File, chapters: Chapter[], reels: InstagramReel[]) => void }) {
  const [mounted, setMounted] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (file: File, reels: InstagramReel[]) => {
    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('video', file)

      const uploadResponse = await fetch('/api/process-local-video', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload and process video')
      }

      const result = await uploadResponse.json()

      setIsUploading(false)
      setIsProcessing(false)

      // Assuming the API returns the cropped videos information
      // You might need to adjust this based on the actual response structure
      const chapters: Chapter[] = result.croppedVideos.map((video: { start_time: number, end_time: number }, index: number) => ({
        id: `${index + 1}`,
        title: `Chapter ${index + 1}`,
        startTime: video.start_time,
        endTime: video.end_time,
      }))

      onNext(file, chapters, reels)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setIsUploading(false)
      setIsProcessing(false)
    }
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-md p-8 space-y-4 bg-card dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-center text-foreground dark:text-white">Upload Video</h1>
        </div>
        <VideoInputForm 
          onSubmit={handleSubmit}
          isUploading={isUploading}
          isProcessing={isProcessing}
          uploadProgress={uploadProgress}
          processingProgress={processingProgress}
          error={error}
        />
      </div>
    </div>
  )
}