"use client"

import { useEffect, useState } from "react";
import VideoInputScreen from "@/components/VideoInputScreen";
import VideoPlayerScreen from "@/components/VideoPlayerScreen";
import { Chapter } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import { Clapperboard, LogOut, Menu, Home } from "lucide-react";
import { useAuth } from "@/lib/auth";


export default function VideoScreen() {
  const router = useRouter();
  const { signOut } = useAuth()

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showVideoInput] = useState(false);
  const resetUpload = () => {
    setVideoFile(null);
  };

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Failed to sign out', error)
    }
  }

  const handleVideoUpload = (file: File, processedChapters: Chapter[]) => {
    setVideoFile(file)
    setChapters(processedChapters)
  }

    useEffect(() => {

    }, [showVideoInput, videoFile])

    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white dark:from-gray-900 dark:to-black text-black dark:text-white">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <header className="flex justify-between items-center mb-8">
          <button className="flex items-center" onClick={() => router.push('/')}>
            <Clapperboard className="text-purple-400 mr-3 w-[1em] h-[1em] text-[2.5rem] md:text-[3.5rem]" />
            <h1 className="text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              Editly
            </h1>
          </button>
          <h1 className="text-2xl sm:text-4xl font-bold absolute left-1/2 transform -translate-x-1/2">
            {!videoFile ? (
              "Video Upload"
            ) : (
              "Final Edit"
            )}
            </h1>
          <div className="flex items-center space-x-2">
            <div className="hidden sm:block space-x-2">
              {/* <Button variant="outline" onClick={() => router.push('/')}>
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button> */}
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push('/')}>
                    <Home className="w-4 h-4 mr-2" />
                    Home
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div>
            {/* Video Input Section */}
            <section id="video-input" className="px-4 relative z-10">
              {!videoFile ? (
                <VideoInputScreen onNext={handleVideoUpload} />
              ) : (
                <VideoPlayerScreen videoFile={videoFile} chapters={chapters} onBack={resetUpload} />
              )}
            </section>
        </div>
      </div>
    </div>        
    );
}