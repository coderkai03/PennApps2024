"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface Chapter {
  id: string
  title: string
  description: string
  startTime: number
}

export default function VideoPlayerScreen({ videoFile, chapters = [], onBack }: { videoFile: File, chapters?: Chapter[], onBack: () => void }) {
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  useEffect(() => {
    const src = URL.createObjectURL(videoFile)
    setVideoSrc(src)
    return () => URL.revokeObjectURL(src)
  }, [videoFile])

  const handleChapterClick = (startTime: number) => {
    const videoElement = document.querySelector("video")
    if (videoElement) {
      videoElement.currentTime = startTime
    }
  }

  if (!videoSrc) return null

  return (
    <div className="flex h-screen bg-background">
      <div className="flex-1 p-4">
        <video
          src={videoSrc}
          controls
          className="w-full h-auto max-h-[calc(100vh-2rem)]"
        />
      </div>
      <div className="w-80 p-4 bg-card border-l">
        <h2 className="text-xl font-bold mb-4">Chapters</h2>
        {chapters.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {chapters.map((chapter) => (
              <AccordionItem value={chapter.id} key={chapter.id}>
                <AccordionTrigger>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleChapterClick(chapter.startTime)}
                  >
                    {chapter.title}
                  </Button>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">{chapter.description}</p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="text-sm text-muted-foreground">No chapters available.</p>
        )}
        <Button onClick={onBack} className="mt-4">
          Back to Upload
        </Button>
      </div>
    </div>
  )
}