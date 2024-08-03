from flask import Flask
from flask_cors import CORS
from flask import request
from search import search

app = Flask(__name__)
CORS(app)

@app.route("/search", methods=["POST"])
def ai_search():
    query = request.json["query"]
    results = search(query)
    return {"results": [results[0] for results in results]}

if __name__ == "__main__":
    app.run("0.0.0.0")