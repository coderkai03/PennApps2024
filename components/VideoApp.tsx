"use client"

import { useState } from "react"
import VideoInputScreen from "./VideoInputScreen"
import VideoPlayerScreen from "./VideoPlayerScreen"

export default function VideoApp() {
  const [videoFile, setVideoFile] = useState<File | null>(null)

  const handleVideoUpload = (file: File) => {
    setVideoFile(file)
  }

  return (
    <div>
      {!videoFile ? (
        <VideoInputScreen onNext={handleVideoUpload} />
      ) : (
        <VideoPlayerScreen videoFile={videoFile} />
      )}
    </div>
  )
}