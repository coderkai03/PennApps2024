"use client"

import { useState } from "react"
import VideoInputScreen from "./VideoInputScreen"
import VideoPlayerScreen from "./VideoPlayerScreen"

interface Chapter {
  id: string
  title: string
  description: string
  startTime: number
}

export default function VideoApp() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])

  const handleVideoUpload = (file: File, processedChapters: Chapter[]) => {
    setVideoFile(file)
    setChapters(processedChapters)
  }

  return (
    <div>
      {!videoFile ? (
        <VideoInputScreen onNext={handleVideoUpload} />
      ) : (
        <VideoPlayerScreen videoFile={videoFile} chapters={chapters} />
      )}
    </div>
  )
}