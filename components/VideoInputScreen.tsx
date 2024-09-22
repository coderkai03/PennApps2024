"use client"

import { useState, useEffect } from "react"
import { Upload, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Chapter } from '@/lib/types'
import { auth } from "../lib/firebase"

interface InstagramReel {
  url: string;
}

export default function VideoInputScreen({ onNext }: { onNext: (file: File, chapters: Chapter[], reels: InstagramReel[]) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [reels, setReels] = useState<InstagramReel[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
    }
  }

  const handleAddReel = () => {
    if (reels.length < 3) {
      setReels([...reels, { url: '' }])
    }
  }

  const handleRemoveReel = (index: number) => {
    const newReels = reels.filter((_, i) => i !== index)
    setReels(newReels)
  }

  const handleReelUrlChange = (index: number, url: string) => {
    const newReels = [...reels]
    newReels[index].url = url
    setReels(newReels)
  }

  const handleUpload = async () => {
    if (file) {
      setIsUploading(true)
      setUploadProgress(0)
      const formData = new FormData()
      formData.append('video', file)

      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        return;
      }

      const userId = user.uid;
      console.log(userId)

      try {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload', true)

        const response = await fetch('http://127.0.0.1:5000/save-reels', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId,  
            reels: reels,    
          }),
        });

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            let progress = (event.loaded / event.total) * 100
            if (progress >= 95) {
              progress = 95 // Cap the progress at 95% during upload
            }
            setUploadProgress(progress)
          }
        }

        xhr.onload = async () => {
          if (xhr.status === 200) {
            try {
              // Split the response by '}' and parse the last valid JSON object
              const jsonStrings = xhr.responseText.split('}');
              const lastValidJson = jsonStrings[jsonStrings.length - 2] + '}';
              const response = JSON.parse(lastValidJson);

              if (response && response.videoUrl) {
                setIsUploading(false)
                setIsProcessing(true)
                await processVideo(response.videoUrl)
              } else {
                throw new Error('Invalid response format')
              }
            } catch (parseError) {
              console.error('Error parsing server response:', parseError)
              console.log('Server response:', xhr.responseText)
              setError('Failed to process server response. Please try again.')
              setIsUploading(false)
            }
          } else {
            throw new Error(`Upload failed with status ${xhr.status}`)
          }
        }

        xhr.onerror = () => {
          throw new Error('Network error during upload')
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

      // This is only a simulation for processing 
      for (let i = 0; i <= 100; i += 20) {
        setProcessingProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const result = await processResponse.json()
      onNext(file!, result.chapters, reels)
    } catch (error) {
      console.error('Error processing video:', error)
      setError('Failed to process video. Please try again.')
    } finally {
      setIsProcessing(false)
      setProcessingProgress(0)
    }
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background dark:bg-gray-900 transition-colors duration-200">
      <div className="w-full max-w-md p-8 space-y-4 bg-card dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-center text-foreground dark:text-white">Upload Video</h1>
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
        <div className="space-y-2">
          <Label className="text-foreground dark:text-white">Instagram Reels (Inspiration)</Label>
          {reels.map((reel, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                type="url"
                placeholder="Instagram Reel URL"
                value={reel.url}
                onChange={(e) => handleReelUrlChange(index, e.target.value)}
                className="flex-grow bg-background dark:bg-gray-700 text-foreground dark:text-white"
              />
              <Button onClick={() => handleRemoveReel(index)} variant="outline" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {reels.length < 3 && (
            <Button onClick={handleAddReel} variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add Instagram Reel
            </Button>
          )}
        </div>
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