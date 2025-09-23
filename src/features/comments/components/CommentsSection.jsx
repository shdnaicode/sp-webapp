import { useEffect, useState } from "react";
import { apiFetch } from "../../../lib/api";
import Avatar from "../../../components/Avatar";

export default function CommentsSection({ courseSlug, moduleKey, token, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    let aborted = false;
    async function load() {
      if (!courseSlug || !moduleKey) {
        setComments([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ course: courseSlug, moduleKey });
        const res = await apiFetch(`/api/comments?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load comments");
  if (!aborted) setComments(Array.isArray(json?.comments) ? json.comments : []);
      } catch (err) {
        if (!aborted) setError(err);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    load();
    return () => { aborted = true; };
  }, [courseSlug, moduleKey]);

  function onKeyDown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      addComment(e);
    }
  }

  async function addComment(e) {
    e.preventDefault();
    if (!token) {
      setError(new Error("Please log in to comment."));
      return;
    }
    const content = text.trim();
    if (!content) return;
    if (content.length > 2000) {
      setError(new Error("Comment too long (max 2000 chars)."));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course: courseSlug, moduleKey, content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to add comment");
      setComments((prev) => [json.comment, ...prev]);
      setText("");
      // Reset to first page so users see their new comment
      setPage(1);
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteComment(id) {
    if (!token) return;
    try {
      const res = await apiFetch(`/api/comments/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setComments((prev) => prev.filter((c) => (c._id || c.id) !== id));
    } catch {}
  }

  const totalPages = Math.max(1, Math.ceil(comments.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const visible = comments.slice(startIndex, startIndex + pageSize);

  return (
    <div className="mt-9 border-t-2 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Comments</h2>
        {loading && <span className="text-xs text-gray-600">Loading…</span>}
      </div>
      {error && (
        <div className="mt-2 rounded-md border-2 bg-red-50 p-3 text-sm text-red-700">{String(error.message || error)}</div>
      )}
      <form onSubmit={addComment} className="mt-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={token ? "Write a comment..." : "Log in to write a comment"}
          className="min-h-[80px] w-full rounded-md border-2 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-600">
          <span>{text.trim().length}/2000</span>
          <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={!token || submitting || text.trim().length === 0}
            className="nb-button-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post Comment"}
          </button>
            <span className="hidden sm:inline">⌘/Ctrl + Enter</span>
          </div>
        </div>
      </form>
      <div className="mt-6 space-y-4">
        {comments.length === 0 && !loading ? (
          <div className="text-sm text-gray-600">No comments yet.</div>
        ) : (
          visible.map((c) => {
            const id = c._id || c.id;
            const author = c.user || {};
            const canDelete = currentUser && (currentUser.role === "admin" || String(author?._id) === String(currentUser?._id));
            return (
              <div key={id} className="rounded-md border-2 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar user={author} size={32} />
                    <div>
                      <div className="text-sm font-medium">{author?.username || "User"}</div>
                      <div className="text-[11px] text-gray-500">{new Date(c.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                  {canDelete && (
                    <button className="nb-button px-2 py-1 text-xs" onClick={() => deleteComment(id)}>Delete</button>
                  )}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{c.content}</div>
              </div>
            );
          })
        )}
      </div>
      {comments.length > pageSize && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button
            className="rounded-md border px-3 py-1 nb-button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="px-2">Page {page} of {totalPages}</span>
          <button
            className="rounded-md border px-3 py-1 nb-button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
