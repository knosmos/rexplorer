from flask import Flask
from flask_cors import CORS
from flask import request
from search import search

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return """
        <body style='font-family:monospace;color:#e0e0e0;background-color:#120995'>
            <h1 style='font-weight:lighter'>AI Backend server for
                <a style='color:#e0e0e0' href='https://knosmos.github.io/rexplorer'>REXplorer</a>
            </h1>
            <p>All systems nominal.</p>
        </body>
    """

@app.route("/search", methods=["POST"])
def ai_search():
    query = request.json["query"]
    results = search(query)
    return {"results": [results[0] for results in results]}

if __name__ == "__main__":
    app.run("0.0.0.0")