from flask import Flask, request, jsonify
from googleapiclient.discovery import build
from flask_cors import CORS
import praw
import config
from datetime import datetime

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


def get_comments(post_url, num_comments, min_date, max_date, include_replies):
    post_id = post_url.split("/")[-3]
    submission = reddit.submission(id=post_id)

    title = submission.title
    submission.comments.replace_more(limit=0)
    comments = sorted(submission.comments.list(), key=lambda x: x.score, reverse=True)

    filtered_comments = []
    for comment in comments[:num_comments]:
        comment_date = datetime.fromtimestamp(comment.created_utc)
        if min_date <= comment_date <= max_date:
            comment_data = {"body": comment.body, "score": comment.score, "replies": []}
            if include_replies:
                for reply in comment.replies:
                    reply_date = datetime.fromtimestamp(reply.created_utc)
                    if min_date <= reply_date <= max_date:
                        comment_data["replies"].append(
                            {"body": reply.body, "score": reply.score}
                        )
            filtered_comments.append(comment_data)

    return title, filtered_comments


@app.route("/api/search", methods=["POST"])
def search():
    data = request.json
    query = data.get("query", "")
    min_length = data.get("minLength", 0)
    max_length = data.get("maxLength", 1000)
    min_date_str = data.get("minDate", "")
    max_date_str = data.get("maxDate", "")
    num_comments = data.get("numComments", 5)
    include_replies = data.get("includeReplies", False)

    if not query:
        return jsonify({"error": "Query parameter is required"}), 400

    try:
        min_date = (
            datetime.fromisoformat(min_date_str) if min_date_str else datetime.min
        )
        max_date = (
            datetime.fromisoformat(max_date_str) if max_date_str else datetime.max
        )

        post_urls = search_reddit_posts(query)
        comments_by_post = []

        for url in post_urls:
            title, top_comments = get_comments(
                url, num_comments, min_date, max_date, include_replies
            )
            filtered_comments = [
                comment
                for comment in top_comments
                if min_length <= len(comment["body"]) <= max_length
            ]
            if filtered_comments:  # Only include posts with comments
                comments_by_post.append(
                    {"url": url, "title": title, "comments": filtered_comments}
                )

        return jsonify(comments_by_post)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=8080)
