"use client";
import { useState } from "react";

const fetchComments = async (query: string) => {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch");
  }

  return response.json();
};

const Page = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchComments(query);
      setResults(data);
    } catch (error) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter search query"
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? "Loading..." : "Search"}
      </button>

      {error && <p>{error}</p>}

      <div>
        {results.map((post: any) => (
          <div key={post.url}>
            <h2>
              <a href={post.url} target="_blank" rel="noopener noreferrer">
                {post.title}
              </a>
            </h2>
            <ul>
              {post.comments.map((comment: any, index: number) => (
                <li key={index}>
                  <p>{comment.body}</p>
                  <span>Score: {comment.score}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Page;
