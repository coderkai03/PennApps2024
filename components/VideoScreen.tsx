"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import VideoInputScreen from "@/components/VideoInputScreen";
import VideoPlayerScreen from "@/components/VideoPlayerScreen";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Clapperboard, LogOut, Menu } from "lucide-react";
import { Chapter } from "@/lib/types";

export default function VideoScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const resetUpload = () => setVideoFile(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Failed to sign out', error);
    }
  };

  const handleVideoUpload = (file: File, processedChapters: Chapter[]) => {
    setVideoFile(file);
    setChapters(processedChapters);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <button className="flex items-center" onClick={() => router.push('/')}>
            <Clapperboard className="text-blue-600 mr-2" />
            <h1 className="text-2xl font-bold text-blue-600">Editly</h1>
          </button>
          <h2 className="text-xl font-semibold">
            {!videoFile ? "Video Upload" : "Final Edit"}
          </h2>
          <div className="hidden sm:block">
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main>
          {!videoFile ? (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <VideoInputScreen onNext={handleVideoUpload} />
            </div>
          ) : (
            <VideoPlayerScreen videoFile={videoFile} chapters={chapters} onBack={resetUpload} />
          )}
        </main>
      </div>
    </div>
  );
}