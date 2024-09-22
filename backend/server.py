import supabase
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_PROJECT_URL")
SUPABASE_KEY = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

data = {
    "user_id": "xp8rZ6NQWzfuQCYPyO17D7kvV9J2", 
    "duration": 10.833,
    "color_style": "dark",
    "motion_style": "high motion",
    "dominant_color": [74.55356595468574, 83.2352721661055, 93.60759241722785], 
    "volume_style": "quiet",
    "frequency_style": "bass-heavy",
    "hashtags": ['computerscience', 'softwareengineer', 'flirt', 'pickuplines'],
    "mentions": [],
    "video_effects": ['slow motion', 'rapid transitions', 'text overlay', 'color filters'],
    "transcription": "Three hottest things to say to a programmer. Zero build errors. No merge conflicts. What? All test cases passed. Oh!"
}

response = supabase_client.table("videos").insert(data).execute()

print(response)

def process_video_to_text(video_folder, post, user_id):
    video_path = None
    for file in os.listdir(video_folder):
        if file.endswith(".mp4"):
            video_path = os.path.join(video_folder, file)
            break
    
    if not video_path:
        print("No MP4 file found in the specified folder.")
        return

    video = mp.VideoFileClip(video_path)
    audio_path = os.path.join(video_folder, "full_audio.wav")
    video.audio.write_audiofile(audio_path)

    video_style = analyze_video_style(video_path)
    audio_style = analyze_audio(audio_path)
    tags = extract_tags(post)
    video_effects = detect_video_effects(video_path)

    print("Transcribing audio with OpenAI Whisper...")
    transcription = transcribe_audio_whisper(audio_path)

    results_path = os.path.join(video_folder, "video_analysis.txt")
    with open(results_path, "w", encoding="utf-8") as f:
        f.write("Video Analysis Results\n")
        f.write("======================\n\n")
        f.write(f"Video Style:\n{video_style}\n\n")
        f.write(f"Audio Style:\n{audio_style}\n\n")
        f.write(f"Tags:\n{tags}\n\n")
        f.write(f"Video Effects:\n{video_effects}\n\n")
        f.write("Transcription:\n")
        f.write(transcription)

    print(f"Video analysis and transcription saved to {results_path}")

    data = {
        "user_id": user_id, # this should be the firebase auth id
        "duration": video.duration,
        "color_style": video_style.get("color_style"),
        "motion_style": video_style.get("motion_style"),
        "dominant_color": video_style.get("dominant_color"),
        "volume_style": audio_style.get("volume_style"),
        "frequency_style": audio_style.get("frequency_style"),
        "hashtags": tags.get("hashtags"),
        "mentions": tags.get("mentions"),
        "video_effects": video_effects,
        "transcription": transcription
    }

    response = supabase_client.table("videos").insert(data).execute()
    print(response)