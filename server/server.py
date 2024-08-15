# TODO
# Loading
# Error message
# Filter

from flask import Flask, request, jsonify
from googleapiclient.discovery import build
from flask_cors import CORS
import praw
import config

app = Flask(__name__)
CORS(app)

# Initialize PRAW
reddit = praw.Reddit(
    client_id=config.REDDIT_CLIENT_ID,
    client_secret=config.REDDIT_SECRET,
    user_agent=config.REDDIT_USER_AGENT,
)

# Initialize Google Custom Search
service = build("customsearch", "v1", developerKey=config.GOOGLE_API_KEY)

def search_reddit_posts(query):
    results = (
        service.cse()
        .list(q=query + " site:reddit.com", cx=config.GOOGLE_CX, num=10)
        .execute()
    )
    urls = [item["link"] for item in results.get("items", [])]
    return urls

def get_top_comments(post_url):
    post_id = post_url.split("/")[-3]
    submission = reddit.submission(id=post_id)

    # Retrieve the post title
    title = submission.title

    submission.comments.replace_more(limit=0)
    top_comments = sorted(
        submission.comments.list(), key=lambda x: x.score, reverse=True
    )[:5]
    comments = [{"body": comment.body, "score": comment.score} for comment in top_comments]

    return title, comments

@app.route("/api/search", methods=["POST"])
def search():
    data = request.json
    query = data.get("query", "")
    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    try:
        post_urls = search_reddit_posts(query)
        comments_by_post = []

        for url in post_urls:
            title, top_comments = get_top_comments(url)
            comments_by_post.append(
                {"url": url, "title": title, "comments": top_comments}
            )

        return jsonify(comments_by_post)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=8080)
