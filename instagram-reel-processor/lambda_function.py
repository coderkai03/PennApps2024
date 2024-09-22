import json
import os
import tempfile
from urllib.parse import urlparse, parse_qs
import instaloader
import moviepy.editor as mp
from pydub import AudioSegment
import cv2
import numpy as np
from scipy.fftpack import fft
import re
from PIL import Image
import imagehash
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import torch
import librosa

def extract_shortcode(url):
    parsed_url = urlparse(url)
    path_parts = parsed_url.path.strip('/').split('/')
    if 'reel' in path_parts:
        index = path_parts.index('reel')
        if index + 1 < len(path_parts):
            return path_parts[index + 1]
    elif len(path_parts) > 0:
        return path_parts[-1]
    query_params = parse_qs(parsed_url.query)
    if 'igsh' in query_params:
        return query_params['igsh'][0]
    raise ValueError("Could not extract shortcode from the provided URL")

def download_reel(reel_url, output_filename="reel"):
    L = instaloader.Instaloader()
    try:
        shortcode = extract_shortcode(reel_url)
        post = instaloader.Post.from_shortcode(L.context, shortcode)
        L.download_post(post, target=output_filename)
        print(f"Reel downloaded successfully to folder: {output_filename}")
        return post
    except ValueError as ve:
        print(f"Error: {ve}")
    except Exception as e:
        print(f"An error occurred: {e}")
    return None

def analyze_video_style(video_path):
    cap = cv2.VideoCapture(video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    duration = frame_count / fps

    colors = []
    for i in range(0, frame_count, fps):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if ret:
            avg_color = frame.mean(axis=(0, 1))
            colors.append(avg_color)

    dominant_color = np.mean(colors, axis=0)
    brightness = np.mean(dominant_color)
    brightness_style = "bright" if brightness > 127 else "dark"

    prev_frame = None
    motion = []
    cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        if prev_frame is not None:
            motion.append(np.mean(cv2.absdiff(gray, prev_frame)))
        prev_frame = gray

    avg_motion = np.mean(motion)
    motion_style = "high motion" if avg_motion > 10 else "low motion"

    cap.release()

    return {
        "duration": duration,
        "color_style": brightness_style,
        "motion_style": motion_style,
        "dominant_color": dominant_color.tolist()
    }

def analyze_audio(audio_path):
    audio = AudioSegment.from_wav(audio_path)
    samples = np.array(audio.get_array_of_samples())
    
    volume = np.abs(samples).mean()
    volume_style = "loud" if volume > 10000 else "quiet"

    fft_result = np.abs(fft(samples))
    freq_bins = len(fft_result) // 2
    frequencies = np.fft.fftfreq(len(samples), 1 / audio.frame_rate)[:freq_bins]
    
    bass = np.mean(fft_result[:int(freq_bins * 0.1)])
    treble = np.mean(fft_result[int(freq_bins * 0.6):])
    
    freq_style = "bass-heavy" if bass > treble else "treble-heavy"

    return {
        "volume_style": volume_style,
        "frequency_style": freq_style
    }

def extract_tags(post):
    caption = post.caption if post.caption else ""
    hashtags = re.findall(r"#(\w+)", caption)
    mentions = re.findall(r"@(\w+)", caption)
    return {
        "hashtags": hashtags,
        "mentions": mentions
    }

def detect_video_effects(video_path):
    cap = cv2.VideoCapture(video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))

    effects = set()
    prev_frame = None
    prev_hash = None

    for i in range(0, frame_count, fps // 2):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        if prev_frame is not None:
            diff = cv2.absdiff(gray, prev_frame)
            if np.mean(diff) > 30:
                effects.add("rapid transitions")

        hist = cv2.calcHist([frame], [0, 1, 2], None, [8, 8, 8], [0, 256, 0, 256, 0, 256])
        if np.max(hist) > frame_count / 10:
            effects.add("color filters")

        edges = cv2.Canny(gray, 100, 200)
        if np.sum(edges) > gray.size * 0.1:
            effects.add("text overlay")

        img_hash = imagehash.average_hash(Image.fromarray(frame))
        if prev_hash and img_hash - prev_hash < 5:
            effects.add("slow motion")

        prev_frame = gray
        prev_hash = img_hash

    cap.release()
    return list(effects)

def transcribe_audio_whisper(audio_path):
    processor = WhisperProcessor.from_pretrained("openai/whisper-large-v3")
    model = WhisperForConditionalGeneration.from_pretrained("openai/whisper-large-v3")
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)

    audio, rate = librosa.load(audio_path, sr=16000)
    input_features = processor(audio, sampling_rate=rate, return_tensors="pt").input_features
    input_features = input_features.to(device)

    generated_ids = model.generate(input_features)
    transcription = processor.batch_decode(generated_ids, skip_special_tokens=True)

    return transcription[0]

def process_video_to_text(video_folder, post):
    try:
        # Find the MP4 file
        video_path = next((os.path.join(video_folder, file) for file in os.listdir(video_folder) if file.endswith(".mp4")), None)
        
        if not video_path:
            logger.error("No MP4 file found in the specified folder.")
            raise FileNotFoundError("No MP4 file found")

        logger.info(f"Processing video: {video_path}")

        # Process video
        with mp.VideoFileClip(video_path) as video:
            audio_path = os.path.join(video_folder, "full_audio.wav")
            video.audio.write_audiofile(audio_path)

        # Analyze video and audio
        video_style = analyze_video_style(video_path)
        audio_style = analyze_audio(audio_path)
        tags = extract_tags(post)
        video_effects = detect_video_effects(video_path)

        logger.info("Transcribing audio with OpenAI Whisper...")
        transcription = transcribe_audio_whisper(audio_path)

        # Write results
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

        logger.info(f"Video analysis and transcription saved to {results_path}")

        # Clean up temporary audio file
        os.remove(audio_path)
        logger.info("Temporary audio file removed")

        return results_path

    except FileNotFoundError as e:
        logger.error(f"File not found: {str(e)}")
        raise
    except Exception as e:
        logger.error(f"Error in process_video_to_text: {str(e)}", exc_info=True)
        raise

def lambda_handler(event, context):
    try:
        reel_url = event['reel_url']
        logger.info(f"Processing reel: {reel_url}")
        
        with tempfile.TemporaryDirectory() as tmp_dir:
            post = download_reel(reel_url, tmp_dir)
            if post:
                process_video_to_text(tmp_dir, post)
                
                results_path = os.path.join(tmp_dir, "video_analysis.txt")
                logger.info(f"Checking for results file: {results_path}")
                
                if os.path.exists(results_path):
                    with open(results_path, "r", encoding="utf-8") as f:
                        analysis_results = f.read()
                    
                    logger.info("Reel processed successfully")
                    return {
                        'statusCode': 200,
                        'body': json.dumps({
                            'message': 'Reel processed successfully',
                            'analysis': analysis_results
                        })
                    }
                else:
                    logger.error(f"Results file not found: {results_path}")
                    return {
                        'statusCode': 500,
                        'body': json.dumps({
                            'message': 'Error: Results file not found'
                        })
                    }
            else:
                logger.warning("Failed to download the reel")
                return {
                    'statusCode': 400,
                    'body': json.dumps({
                        'message': 'Failed to download the reel'
                    })
                }
    except Exception as e:
        logger.error(f"Error processing reel: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': f'Error processing reel: {str(e)}'
            })
        }