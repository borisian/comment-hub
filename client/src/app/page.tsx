"use client";
import { useState } from "react";
import { FaGithub, FaLinkedin } from "react-icons/fa";

const fetchComments = async (
  query: string,
  minLength: number,
  maxLength: number,
  minDate: string,
  maxDate: string,
  numComments: number,
  includeReplies: boolean
) => {
  const response = await fetch("/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      minLength,
      maxLength,
      minDate,
      maxDate,
      numComments,
      includeReplies,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch");
  }

  return response.json();
};

const Page = () => {
  const [query, setQuery] = useState("");
  const [minLength, setMinLength] = useState(0);
  const [maxLength, setMaxLength] = useState(1000);
  const [minDate, setMinDate] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [numComments, setNumComments] = useState(5);
  const [includeReplies, setIncludeReplies] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showRepliesIndex, setShowRepliesIndex] = useState<number | null>(null);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setNoResults(false);

    try {
      const data = await fetchComments(
        query,
        minLength,
        maxLength,
        minDate,
        maxDate,
        numComments,
        includeReplies
      );
      if (data.length === 0) {
        setNoResults(true);
      } else {
        setResults(data);
      }
    } catch (error) {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const toggleReplies = (index: number) => {
    setShowRepliesIndex(showRepliesIndex === index ? null : index);
  };

  return (
    <div className="bg-gray-800 text-white min-h-screen flex flex-col items-center p-6 relative">
      <div className="absolute top-4 right-4 flex space-x-4">
        <a
          href="https://github.com/borisian/comment-hub"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FaGithub size={24} />
        </a>
        <a
          href="https://www.linkedin.com/in/boris-faradian"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white transition-colors"
        >
          <FaLinkedin size={24} />
        </a>
      </div>

      <h1 className="text-3xl font-bold mb-6">Comment Hub</h1>
      <h3 className="mb-6">
        One place to find the answers to your questions on Reddit.
      </h3>
      <div className="w-full max-w-md space-y-4 mt-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Best brunch in Toronto..."
          className="bg-gray-700 text-white border-none rounded-md p-2 w-full"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-blue-600 text-white rounded-md p-2 w-full"
        >
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
        {showFilters && (
          <div className="space-y-4 mt-4">
            <div className="flex space-x-4">
              <label>
                Min Length:
                <input
                  type="number"
                  value={minLength}
                  onChange={(e) => setMinLength(Number(e.target.value))}
                  className="bg-gray-700 text-white border-none rounded-md p-2 ml-2 w-24"
                />
              </label>
              <label>
                Max Length:
                <input
                  type="number"
                  value={maxLength}
                  onChange={(e) => setMaxLength(Number(e.target.value))}
                  className="bg-gray-700 text-white border-none rounded-md p-2 ml-2 w-24"
                />
              </label>
              <label>
                Number of Comments:
                <input
                  type="number"
                  value={numComments}
                  onChange={(e) => setNumComments(Number(e.target.value))}
                  className="bg-gray-700 text-white border-none rounded-md p-2 ml-2 w-24"
                />
              </label>
            </div>
            <div className="flex space-x-4">
              <label>
                Min Date:
                <input
                  type="date"
                  value={minDate}
                  onChange={(e) => setMinDate(e.target.value)}
                  className="bg-gray-700 text-white border-none rounded-md p-2 ml-2 w-48"
                />
              </label>
              <label>
                Max Date:
                <input
                  type="date"
                  value={maxDate}
                  onChange={(e) => setMaxDate(e.target.value)}
                  className="bg-gray-700 text-white border-none rounded-md p-2 ml-2 w-48"
                />
              </label>
            </div>
            <div className="mt-1">
              <label>
                Show Replies:
                <input
                  type="checkbox"
                  checked={includeReplies}
                  onChange={(e) => setIncludeReplies(e.target.checked)}
                  className="ml-2"
                />
              </label>
            </div>
          </div>
        )}
        <button
          onClick={handleSearch}
          disabled={loading}
          className={`bg-blue-600 text-white rounded-md p-2 w-full ${
            loading ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </div>

      {error && <p className="mt-4 text-red-500">{error}</p>}
      {noResults && <p className="mt-4 text-yellow-500">No posts found</p>}

      <div className="mt-6 w-full max-w-4xl">
        {results.length > 0
          ? results.map((post: any) => (
              <div
                key={post.url}
                className="bg-gray-900 p-4 rounded-md mb-4 shadow-md"
              >
                <h2 className="text-xl font-bold">{post.title}</h2>
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-sm"
                >
                  View Post
                </a>
                <ul className="mt-2 border-t border-gray-700 pt-2">
                  {post.comments.map((comment: any, index: number) => (
                    <li key={index} className="border-b border-gray-700 pt-2">
                      <p>{comment.body}</p>
                      <span className="text-sm text-gray-400">
                        Score: {comment.score}
                      </span>
                      {includeReplies && comment.replies.length > 0 && (
                        <div className="mt-2 pl-4">
                          <button
                            onClick={() => toggleReplies(index)}
                            className="text-blue-400 text-sm"
                          >
                            {showRepliesIndex === index
                              ? "Hide Replies"
                              : "Show Replies"}
                          </button>
                          {showRepliesIndex === index && (
                            <ul className="mt-2 border-t border-gray-700 pt-2">
                              {comment.replies.map(
                                (reply: any, rIndex: number) => (
                                  <li
                                    key={rIndex}
                                    className="border-b border-gray-700 pt-2"
                                  >
                                    <p>{reply.body}</p>
                                    <span className="text-sm text-gray-400">
                                      Score: {reply.score}
                                    </span>
                                  </li>
                                )
                              )}
                            </ul>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          : !noResults && <p className="mt-4 text-gray-500"></p>}
      </div>

      <footer className="absolute bottom-4 text-gray-500 text-sm">
        &copy; {new Date().getFullYear()}{" "}
        <a href="https://www.linkedin.com/in/boris-faradian" target="_blank">
          designed by me
        </a>
      </footer>
    </div>
  );
};

export default Page;
