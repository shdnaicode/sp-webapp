import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import Avatar from "../components/Avatar";
import { useUserProgress } from "../hooks/useUserProgress";
import { COURSE_MAP } from "../features/courses/lib/courses";


export default function LearnCourse() {
  const { slug } = useParams();
  const fallbackCourse = useMemo(() => COURSE_MAP[slug] || { title: slug, modules: [] }, [slug]);
  const [course, setCourse] = useState(fallbackCourse);
  const [current, setCurrent] = useState(0);
  const [courseLoading, setCourseLoading] = useState(false);
  const [courseError, setCourseError] = useState(null);

  useEffect(() => {
    let aborted = false;
    async function loadCourse() {
      if (!slug) return;
      setCourseLoading(true);
      setCourseError(null);
      try {
        const res = await apiFetch(`/api/courses/${slug}`);
        if (res.ok) {
          const json = await res.json();
          if (!aborted) setCourse(json);
        } else {
          // fallback silently
          if (!aborted) setCourse(fallbackCourse);
        }
      } catch (err) {
        if (!aborted) setCourseError(err);
        if (!aborted) setCourse(fallbackCourse);
      } finally {
        if (!aborted) setCourseLoading(false);
      }
    }
    loadCourse();
    return () => { aborted = true; };
  }, [slug, fallbackCourse]);
  const moduleKey = course.modules[current]?.key;
  const { token } = useAuth();
  const { user } = useAuth();
  const { data: progress, reload: reloadProgress } = useUserProgress();

  // Quiz state
  const [quizzes, setQuizzes] = useState([]);
  const [qLoading, setQLoading] = useState(false);
  const [qError, setQError] = useState(null);
  const [answers, setAnswers] = useState([]); // array of selected option index per quiz
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { score, correct, total }

  // Load quizzes when course or module changes
  useEffect(() => {
    let aborted = false;
    async function load() {
      if (!slug || !moduleKey) {
        setQuizzes([]);
        setAnswers([]);
        setResult(null);
        return;
      }
      setQLoading(true);
      setQError(null);
      setResult(null);
      try {
        const params = new URLSearchParams({ course: slug, moduleKey });
        const res = await apiFetch(`/api/quizzes?${params.toString()}`);
        const items = await res.json();
        if (!res.ok) throw new Error(items?.message || "Failed to load quizzes");
        if (!aborted) {
          setQuizzes(Array.isArray(items) ? items : []);
          setAnswers(Array.isArray(items) ? items.map(() => -1) : []);
        }
      } catch (err) {
        if (!aborted) setQError(err);
      } finally {
        if (!aborted) setQLoading(false);
      }
    }
    load();
    return () => { aborted = true; };
  }, [slug, moduleKey]);

  const canSubmit = quizzes.length > 0 && answers.every((a) => typeof a === "number" && a >= 0);

  async function submitQuiz() {
    if (!token || !canSubmit) return;
    setSubmitting(true);
    setResult(null);
    try {
      const res = await apiFetch("/api/quizzes/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course: slug, moduleKey, answers }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to submit");
      setResult({ score: json.score, correct: json.correct, total: json.total });
      reloadProgress();
    } catch (err) {
      setQError(err);
    } finally {
      setSubmitting(false);
    }
  }


  const completedModules = useMemo(() => {
    const cp = progress?.courseProgress || {};
    const byCourse = cp?.[slug]?.completed || [];
    return new Set(Array.isArray(byCourse) ? byCourse : []);
  }, [progress, slug]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="px-6 py-8 md:px-10 md:py-10 flex-1">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <aside className="space-y-4 md:col-span-1">
            <div className="nb-card p-5">
              <div className="text-base font-semibold">{course.title}</div>
              <div className="mt-1 text-xs text-gray-600">{course.modules.length} modules</div>
              <div className="mt-4 space-y-3">
                {course.modules.map((m, i) => (
                  <button
                    key={m.key}
                    onClick={() => setCurrent(i)}
                    className={`flex w-full items-center justify-between rounded-md border-2 px-4 py-3 text-left text-sm nb-button ${current === i ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"}`}
                  >
                    <span className="font-medium">Module {i + 1}: {m.title}</span>
                    <span className="ml-2 text-[11px]">
                      {completedModules.has(m.key) ? (
                        <span className="text-green-600">Completed ✓</span>
                      ) : current === i ? (
                        <span className="text-blue-600">Current</span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
          <main className="md:col-span-2">
            <div className="nb-card p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">{course.modules[current]?.title || "No modules"}</h1>
                <div className="text-xs text-gray-600">Module {Math.min(current + 1, course.modules.length)} of {course.modules.length}</div>
              </div>
              {courseError && (
                <div className="mt-2 rounded-md border-2 bg-yellow-50 p-3 text-xs text-yellow-800">{String(courseError.message || courseError)}</div>
              )}
              <div className="mt-5">
                {/* Video placeholder area */}
                <div className="aspect-video w-full overflow-hidden rounded-md border-2 bg-black/5 nb-card">
                  {course.modules[current]?.videoUrl ? (
                    <iframe title="lesson-video" className="h-full w-full" src={course.modules[current].videoUrl} allowFullScreen />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-600">Video placeholder (embed here)</div>
                  )}
                </div>
                {/* Optional description */}
                <p className="mt-4 text-sm text-gray-700">{course.modules[current]?.description || ""}</p>
              </div>
              <div className="mt-7 flex items-center justify-between">
                <button
                  className="h-10 rounded-md border-2 px-5 text-sm disabled:cursor-not-allowed disabled:opacity-60 nb-button"
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                >
                  Previous
                </button>
                <button
                  className="h-10 rounded-md nb-button-primary px-5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => setCurrent((c) => Math.min(course.modules.length - 1, c + 1))}
                  disabled={current >= course.modules.length - 1}
                >
                  Next
                </button>
              </div>

              {/* Quiz Section */}
              <div className="mt-9 border-t-2 pt-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Module Quiz</h2>
                  {qLoading && <span className="text-xs text-gray-600">Loading…</span>}
                </div>
                {qError && (
                  <div className="mt-2 rounded-md border-2 bg-red-50 p-3 text-sm text-red-700">
                    {String(qError.message || qError)}
                  </div>
                )}
                {quizzes.length === 0 && !qLoading ? (
                  <div className="mt-2 text-sm text-gray-600">No quiz for this module yet.</div>
                ) : (
                  <div className="mt-5 space-y-5">
                    {quizzes.map((q, qi) => (
                      <div key={q._id || qi} className="rounded-md border-2 p-5">
                        <div className="text-sm font-medium">Q{qi + 1}. {q.question}</div>
                        <div className="mt-3 space-y-2">
                          {q.options?.map((opt, oi) => (
                            <label key={oi} className="flex cursor-pointer items-center gap-3 text-sm">
                              <input
                                type="radio"
                                name={`q-${qi}`}
                                className="h-4 w-4"
                                checked={answers[qi] === oi}
                                onChange={() => setAnswers((arr) => {
                                  const next = [...arr];
                                  next[qi] = oi;
                                  return next;
                                })}
                              />
                              <span>{opt.text}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <button
                        className="h-10 rounded-md nb-button-primary px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={submitQuiz}
                        disabled={!canSubmit || submitting}
                      >
                        {submitting ? "Submitting…" : "Submit Quiz"}
                      </button>
                      {result && (
                        <div className="text-sm text-gray-700">Score: <span className="font-semibold">{result.score}%</span> ({result.correct}/{result.total})</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Comments Section */}
              <CommentsSection courseSlug={slug} moduleKey={moduleKey} token={token} currentUser={user} />

            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function CommentsSection({ courseSlug, moduleKey, token, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
          placeholder={token ? "Write a comment..." : "Log in to write a comment"}
          className="min-h-[80px] w-full rounded-md border-2 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={!token || submitting || text.trim().length === 0}
            className="nb-button-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post Comment"}
          </button>
        </div>
      </form>
      <div className="mt-6 space-y-4">
        {comments.length === 0 && !loading ? (
          <div className="text-sm text-gray-600">No comments yet.</div>
        ) : (
          comments.map((c) => {
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
    </div>
  );
}
