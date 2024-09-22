import requests
from flask import Flask, request, jsonify
import os
from gradio_client import Client


app = Flask(__name__)

client = Client("ethansantos/transcript-llm")

# Endpoint to process video from S3 URL
@app.route('/process-video', methods=['POST'])
def process_video():
    data = request.get_json()
    video_url = data.get('videoUrl')

    print(video_url)
    if not video_url:
        return jsonify({"error": "No video URL provided"}), 400
    
    transcript = "Artificial Intelligence, or AI, is a field of computer science that aims to create machines capable of performing tasks that typically require human intelligence. These tasks range from understanding natural language and recognizing images to making decisions and solving complex problems. AI systems use vast amounts of data to recognize patterns, make predictions, and even improve over time as they are exposed to new information. The rapid advancements in AI have made it a critical technology in areas like healthcare, finance, and robotics. Machine Learning, or ML, is a subset of AI that specifically focuses on the ability of machines to learn from data. Rather than being explicitly programmed to perform a task, machine learning algorithms analyze and learn from data, identifying patterns and making predictions based on that information. For example, a machine learning model can be trained to recognize images of cats and dogs by analyzing thousands of labeled images. As the model is exposed to more data, its accuracy improves, enabling it to make better decisions. There are three primary types of machine learning: supervised learning, unsupervised learning, and reinforcement learning. In supervised learning, models are trained on labeled data, meaning the input data is paired with the correct output. This method is commonly used for tasks like image classification, speech recognition, and predicting outcomes based on historical data. In contrast, unsupervised learning involves models that try to identify hidden patterns in data without any labels, such as clustering customers based on their purchase behaviors. Reinforcement learning, on the other hand, is about learning through trial and error. A model learns to make decisions by receiving feedback in the form of rewards or penalties for its actions. This approach is often used in robotics, game playing, and self-driving cars, where the system must learn how to navigate a complex environment. Together, these machine learning techniques are the foundation for many of the AI applications we interact with daily, from recommendation systems to autonomous systems."

    # Step 3: Call Hugging Face model using Gradio Client
    try:
        topic_words = extract_topic_words(transcript)

        return jsonify({
            'topicWords': topic_words  # Return extracted topic words
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Step 1: Download the video from the S3 URL
    video_response = requests.get(video_url)

    if video_response.status_code == 200:
        # Save the video locally (or process it directly in memory)
        video_path = 'downloaded_video.mp4'
        with open(video_path, 'wb') as f:
            f.write(video_response.content)

        # Step 2: (Placeholder) Transcribe the video
        # Assuming we have the transcript already for now
        transcript = "This is a test transcript discussing artificial intelligence, machine learning, and deep learning."

        # Step 3: Call Hugging Face model using Gradio Client
        try:
            topic_words = extract_topic_words(transcript)

            # Clean up (optional)
            if os.path.exists(video_path):
                os.remove(video_path)

            return jsonify({
                'message': 'Video processed successfully',
                'topicWords': topic_words  # Return extracted topic words
            })
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    else:
        return jsonify({"error": "Failed to download video"}), 500

def extract_topic_words(transcript):
    """
    This function calls the Hugging Face Gradio model with the transcript.
    For example, the Hugging Face space might be designed to extract topic words or summarize the text.
    """
    try:
        response = client.predict(
            transcript=transcript,
            system_message="You are a friendly assistant for chapter detection and summarization.",
            max_tokens=512,
            temperature=0.7,
            top_p=0.95,
            api_name="/chat"  # Make sure this matches the API path on your Gradio space
        )

        print(response)
        
        return response  # Process the model's response as necessary
    except Exception as e:
        return {"error": str(e)}

if __name__ == '__main__':
    app.run(debug=True)
