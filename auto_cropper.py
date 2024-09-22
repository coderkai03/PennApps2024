import json
import boto3
import cv2
import numpy as np
import subprocess
import os
from moviepy.editor import VideoFileClip
import speech_recognition as sr
import openai

s3 = boto3.client('s3')
openai.api_key = os.environ['OPENAI_API_KEY'] 

def detect_faces(video_file):
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    cap = cv2.VideoCapture(video_file)
    faces = []
    while len(faces) < 5:
        ret, frame = cap.read()
        if not ret:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        detected_faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        for face in detected_faces:
            if not any(np.array_equal(face, f) for f in faces):
                faces.append(face)
    cap.release()
    return faces if len(faces) > 0 else None

def crop_video(faces, input_file, output_file):
    if len(faces) > 0:
        cap = cv2.VideoCapture(input_file)
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        target_height = int(frame_height * 0.9)
        target_width = int(target_height * 9 / 16)
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        out = cv2.VideoWriter(output_file, fourcc, 30.0, (target_width, target_height))
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            for face in faces:
                x, y, w, h = face
                crop_x = max(0, x + (w - target_width) // 2)
                crop_y = max(0, y + (h - target_height) // 2)
                crop_x2 = min(crop_x + target_width, frame_width)
                crop_y2 = min(crop_y + target_height, frame_height)
                cropped_frame = frame[crop_y:crop_y2, crop_x:crop_x2]
                resized_frame = cv2.resize(cropped_frame, (target_width, target_height))
                out.write(resized_frame)
        cap.release()
        out.release()

def extract_audio(video_file, audio_file):
    video = VideoFileClip(video_file)
    audio = video.audio
    audio.write_audiofile(audio_file)

def speech_to_text(audio_file):
    recognizer = sr.Recognizer()
    with sr.AudioFile(audio_file) as source:
        audio = recognizer.record(source)
    try:
        text = recognizer.recognize_google(audio)
        return text
    except sr.UnknownValueError:
        return "Speech recognition could not understand the audio"
    except sr.RequestError as e:
        return f"Could not request results from speech recognition service; {e}"

def analyze_transcript(transcript):
    prompt = f"This is a transcript of a video. Please identify the 3 most viral sections from the whole, make sure they are more than 30 seconds in duration. Respond in JSON format with start_time, end_time, and description for each section."
    messages = [
        {"role": "system", "content": "You are a ViralGPT helpful assistant. You are master at reading video transcripts and identifying the most Interesting and Viral Content"},
        {"role": "user", "content": prompt + "\n" + transcript}
    ]
    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=messages,
        max_tokens=512,
        n=1,
        stop=None
    )
    return json.loads(response.choices[0]['message']['content'])

def lambda_handler(event, context):
    try:
        # Assuming the video file is uploaded to S3 and we receive the S3 key
        s3_bucket = event['s3_bucket']
        s3_key = event['s3_key']
        
        # Download video from S3
        local_video_path = '/tmp/input_video.mp4'
        s3.download_file(s3_bucket, s3_key, local_video_path)
        
        # Extract audio from video
        audio_path = '/tmp/audio.wav'
        extract_audio(local_video_path, audio_path)
        
        # Convert speech to text
        transcript = speech_to_text(audio_path)
        
        # Analyze transcript
        interesting_segments = analyze_transcript(transcript)
        
        # Process each segment
        cropped_videos = []
        for i, segment in enumerate(interesting_segments):
            start_time = segment['start_time']
            end_time = segment['end_time']
            
            # Extract segment
            input_file = f'/tmp/segment_{i}.mp4'
            command = f"ffmpeg -i {local_video_path} -ss {start_time} -to {end_time} -c copy {input_file}"
            subprocess.call(command, shell=True)
            
            # Crop video
            faces = detect_faces(input_file)
            output_file = f'/tmp/cropped_segment_{i}.mp4'
            crop_video(faces, input_file, output_file)
            
            # Upload cropped video to S3
            output_s3_key = f'cropped_videos/{os.path.basename(s3_key)}_segment_{i}.mp4'
            s3.upload_file(output_file, s3_bucket, output_s3_key)
            cropped_videos.append({
                's3_key': output_s3_key,
                'start_time': start_time,
                'end_time': end_time,
                'description': segment['description']
            })
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'cropped_videos': cropped_videos
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }