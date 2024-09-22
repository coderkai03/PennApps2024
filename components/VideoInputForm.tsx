import React, { useState } from "react";
import { Upload, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { InstagramReel } from '@/lib/types';
import { auth } from "../lib/firebase"
import { supabase } from "../lib/supabaseClient";

interface VideoInputFormProps {
  onSubmit: (file: File, reels: InstagramReel[]) => void;
  isUploading: boolean;
  isProcessing: boolean;
  uploadProgress: number;
  processingProgress: number;
  error: string | null;
}

export default function VideoInputForm({
  onSubmit,
  isUploading,
  isProcessing,
  uploadProgress,
  processingProgress,
  error
}: VideoInputFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [reels, setReels] = useState<InstagramReel[]>([]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleAddReel = () => {
    setReels([...reels, { url: '' }]);
  };

  const handleRemoveReel = (index: number) => {
    setReels(reels.filter((_, i) => i !== index));
  };

  const handleReelUrlChange = (index: number, url: string) => {
    const updatedReels = [...reels];
    updatedReels[index] = { url };
    setReels(updatedReels);
  };

  const handleSaveReels = async (userId: string, reels: InstagramReel[]) => {
    try {
      const { data, error } = await supabase
        .from('reels')
        .insert(reels.map(reel => ({
          user_id: userId,
          reel_url: reel.url
        })));

      if (error) {
        throw new Error(`Error inserting reels: ${error.message}`);
      }

      console.log('Reels saved successfully:', data);
      return data;
    } catch (error) {
      throw new Error(`Error saving reels: ${error}`);
    }
  };

  const handleUpload = async () => {
    if (file) {
      onSubmit(file, reels);

      const user = auth.currentUser;
      if (!user) {
        console.error('No user logged in');
        return;
      }

      const userId = user.uid;
      console.log(userId);

      try {
        await handleSaveReels(userId, reels);
        console.log('Reels saved successfully!');
      } catch (error) {
        console.error('Error saving reels:', error);
      }
    }
  };


  return (
    <div className="space-y-4">
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
  );
}