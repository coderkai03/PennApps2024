import os
import whisper
import subprocess
import json
from keybert import KeyBERT
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get Supabase credentials from environment variables
url = os.getenv("SUPABASE_PROJECT_URL")
key = os.getenv("SUPABASE_ANON_KEY")

# Initialize Supabase client
supabase = create_client(url, key)

# Define input and output folders
current_dir = os.path.dirname(os.path.abspath(__file__))
input_folder = os.path.join(current_dir, "input_videos")
output_folder = os.path.join(current_dir, "output_videos")

# Load the Whisper model
model = whisper.load_model("base")
kw_model = KeyBERT()

def parse_transcript(transcript, video_title):
    parsed_data = []
    segments = transcript.strip().split("\n\n")  # Split by double newlines

    for segment in segments:
        segment_data = {}
        lines = segment.split("\n")

        for line in lines:
            if line.startswith("Segment Start:"):
                # Split the line by commas to separate start and end
                start_end = line.split(",")
                start_time = start_end[0].split(":")[1].strip().replace("s", "")
                end_time = start_end[1].split(":")[1].strip().replace("s", "")
                
                segment_data["start"] = float(start_time)
                segment_data["end"] = float(end_time)
            elif line.startswith("Text:"):
                segment_data["text"] = line.split(":")[1].strip()
            elif line.startswith("Keywords:"):
                segment_data["keywords"] = line.split(":")[1].strip()

        # Add the video title to each segment
        segment_data["video_title"] = video_title

        # Add to the list only if start and end times are present
        if "start" in segment_data and "end" in segment_data:
            parsed_data.append(segment_data)

    return parsed_data


def insert_to_supabase(data):
    # Insert data into Supabase
    response = supabase.table("transcripts").insert(data).execute()
    return response

def process_video(video_path, output_path):
    video_title = os.path.splitext(os.path.basename(video_path))[0]  # Extract the video title
    audio_path = output_path.replace(".txt", ".wav")
    
    try:
        # Extract audio from video using ffmpeg
        subprocess.run(['ffmpeg', '-i', video_path, audio_path], check=True)
    except Exception as e:
        print(f"Error converting video: {e}")
        return

    # Transcribe audio using Whisper model
    result = model.transcribe(audio_path)

    # Prepare the result text with segments
    result_text = ""
    for segment in result["segments"]:
        start_time = segment["start"]
        end_time = segment["end"]
        text = segment["text"]
        keywords = kw_model.extract_keywords(text, keyphrase_ngram_range=(1, 2), stop_words='english')

        # Append segment info to result text
        result_text += f"Segment Start: {start_time:.2f}s, End: {end_time:.2f}s\n"
        result_text += f"Text: {text.strip()}\n"
        result_text += f"Keywords: {', '.join([kw[0] for kw in keywords])}\n\n"

    # Save the results to a text file
    with open(output_path, "w") as f:
        f.write(result_text)

    # Parse the transcript and insert into Supabase, including the video title
    formatted_data = parse_transcript(result_text, video_title)
    insert_response = insert_to_supabase(formatted_data)
    print(f"Inserted into Supabase: {insert_response}")


# Process all MP4 files in the input folder
for filename in os.listdir(input_folder):
    if filename.endswith(".mp4"):
        video_path = os.path.join(input_folder, filename)
        output_filename = filename.replace(".mp4", "_transcription.txt")
        output_path = os.path.join(output_folder, output_filename)
        
        # Process each video and insert transcript data into Supabase
        process_video(video_path, output_path)
