import os
from moviepy.editor import VideoFileClip, concatenate_videoclips
import numpy as np

# Threshold for detecting silence
SILENCE_THRESHOLD = 0.01  # Adjust this based on noise level
MIN_SILENCE_DURATION = 0.5  # Minimum duration of silence in seconds to remove

def remove_silent_parts(video_path, output_path):
    try:
        # Load video
        video = VideoFileClip(video_path)
        
        # Extract the audio from the video
        audio = video.audio

        # Get the audio volume at each frame
        audio_volume = np.array([audio.get_frame(t).mean() for t in np.arange(0, audio.duration, 1 / audio.fps)])

        # Detect non-silent segments
        non_silent_intervals = []
        start = None
        
        for i, volume in enumerate(audio_volume):
            time = i / audio.fps

            if volume > SILENCE_THRESHOLD:
                if start is None:
                    start = time  # Mark the start of a non-silent segment
            else:
                if start is not None and time - start > MIN_SILENCE_DURATION:
                    non_silent_intervals.append((start, time))  # Store the non-silent interval
                    start = None

        if start is not None:
            non_silent_intervals.append((start, audio.duration))  # Add the last non-silent interval
        
        # Create new video clips from non-silent segments
        clips = [video.subclip(start, end) for start, end in non_silent_intervals]

        if clips:
            # Concatenate non-silent clips and write the output video
            final_video = concatenate_videoclips(clips)
            final_video.write_videofile(output_path, codec="libx264")
            print(f"Processed video saved to {output_path}")
        else:
            print(f"No non-silent sections detected in {video_path}")

        # Properly close the video and audio objects to release system resources
        audio.close()
        video.close()

    except Exception as e:
        print(f"Error processing video {video_path}: {e}")

def remove_silent_parts_from_videos():
    # Define input and output folders
    current_dir = os.path.dirname(os.path.abspath(__file__))
    source_folder = os.path.normpath(os.path.join(current_dir, "input_videos"))
    output_folder = os.path.normpath(os.path.join(current_dir, "output_videos"))

    # Ensure the output folder exists
    os.makedirs(output_folder, exist_ok=True)

    # Process all MP4 files in the source folder
    for filename in os.listdir(source_folder):
        if filename.endswith(".mp4"):
            video_path = os.path.join(source_folder, filename)
            output_filename = filename.replace(".mp4", "_nosilence.mp4")
            output_path = os.path.join(output_folder, output_filename)
            remove_silent_parts(video_path, output_path)
