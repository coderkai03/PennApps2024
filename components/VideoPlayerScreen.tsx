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

const dummyChapters: Chapter[] = [
  { id: "1", title: "Introduction", description: "Brief overview of the video content", startTime: 0 },
  { id: "2", title: "Main Topic", description: "Detailed explanation of the main subject", startTime: 60 },
  { id: "3", title: "Examples", description: "Practical examples and demonstrations", startTime: 180 },
  { id: "4", title: "Conclusion", description: "Summary and closing thoughts", startTime: 300 },
]

export default function VideoPlayerScreen({ videoFile }: { videoFile: File }) {
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
        <Accordion type="single" collapsible className="w-full">
          {dummyChapters.map((chapter) => (
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
      </div>
    </div>
  )
}