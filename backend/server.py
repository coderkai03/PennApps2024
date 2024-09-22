from flask import Flask, request, jsonify
import supabase
import os
from dotenv import load_dotenv
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_PROJECT_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
supabase_client = supabase.create_client(SUPABASE_URL, SUPABASE_KEY)

@app.route('/save-reels', methods=['POST'])
def save_reels():
    try:
        data = request.get_json()

        user_id = data.get('userId')
        reels = data.get('reels', [])

        for reel in reels:
            supabase_client.table('reels').insert({
                'user_id': user_id,
                'reel_url': reel['url'], 
            }).execute()

        return jsonify({"success": True, "message": "Reels saved successfully!"}), 200
    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"success": False, "message": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True)
