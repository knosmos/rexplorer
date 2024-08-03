import json
import ml
import numpy as np
import requests

try:
    events = requests.get("https://rex.mit.edu/api.json").json()["events"]
except:
    events = json.loads(open("api.json", "r").read())["events"]

def get_embeddings(events):
    embeddings = []
    for event in events:
        embeddings.append(ml.embed_text(event["description"]))
    return np.array(embeddings).T

event_embeddings = get_embeddings(events)

def search(query):
    query_embedding = ml.embed_text(query)
    scores = ml.cosine_similarity(query_embedding, event_embeddings)
    #print(scores)
    results = []
    for i in range(len(scores)):
        results.append((events[i], scores[i]))
    #print(results)
    results.sort(key=lambda x: x[1], reverse=True)
    results = results[:5]
    return results

def print_results(results):
    for event, score in results:
        print(f"[bold]{event['name']}[/bold] ({score:.4f})")
        print(event["description"])
        print()
    
if __name__ == "__main__":
    while True:
        query = input("Enter query: ")
        results = search(query)
        print_results(results)