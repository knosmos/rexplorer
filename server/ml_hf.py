import requests
import numpy as np
import os
from dotenv import load_dotenv

load_dotenv()

model_id = "sentence-transformers/all-MiniLM-L6-v2"
api_url = f"https://api-inference.huggingface.co/pipeline/feature-extraction/{model_id}"
hf_token = os.getenv("HF_TOKEN")
headers = {"Authorization": f"Bearer {hf_token}"}

def embed_text(text):
    data = {"inputs": [text], "options": {"wait_for_model": True}}
    response = requests.post(api_url, headers=headers, json=data)
    return np.array(response.json()[0])

def embed_texts(texts):
    data = {"inputs": texts, "options": {"wait_for_model": True}}
    response = requests.post(api_url, headers=headers, json=data)
    return np.array(response.json())

def cosine_similarity(u, v):
    return np.dot(u, v) / (np.linalg.norm(u) * np.linalg.norm(v))