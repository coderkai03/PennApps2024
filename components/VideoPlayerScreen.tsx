"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronLeft, PlayCircle } from "lucide-react"
import { Chapter } from '@/lib/types';

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
    <div className="flex flex-col h-screen bg-background">
      <header className="flex items-center justify-between p-4 border-b">
        <Button variant="ghost" onClick={onBack} className="text-primary">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Upload
        </Button>
        <h1 className="text-2xl font-bold">Video Player</h1>
        <div className="w-[100px]" /> 
      </header>
      <div className="flex flex-1 gap-4 p-4 overflow-hidden">
        <Card className="flex-1">
          <CardContent className="p-0">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={videoSrc}
                controls
                className="w-full h-full"
              />
            </div>
          </CardContent>
        </Card>
        <Card className="w-80">
          <CardHeader>
            <CardTitle>Chapters</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-12rem)]">
              {chapters.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {chapters.map((chapter) => (
                    <AccordionItem value={chapter.id} key={chapter.id}>
                      <AccordionTrigger className="px-4 hover:no-underline">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-left"
                          onClick={() => handleChapterClick(chapter.startTime)}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          <span className="truncate">{chapter.title}</span>
                        </Button>
                      </AccordionTrigger>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="p-4 text-sm text-muted-foreground">No chapters available.</p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}