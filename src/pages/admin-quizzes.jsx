import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import { COURSE_MAP } from "../features/courses/lib/courses";

const courses = Object.keys(COURSE_MAP);

export default function AdminQuizzes() {
  const { token, user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [course, setCourse] = useState(courses[0]);
  const [moduleKey, setModuleKey] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { text: "", correct: false },
    { text: "", correct: false },
  ]);
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let aborted = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ course });
        if (moduleKey) params.set("moduleKey", moduleKey);
        const res = await apiFetch(`/api/quizzes?${params.toString()}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load quizzes");
        if (!aborted) setItems(Array.isArray(json) ? json : []);
      } catch (err) {
        if (!aborted) setError(err);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    load();
    return () => { aborted = true; };
  }, [course, moduleKey]);

  function addOption() {
    setOptions((opts) => [...opts, { text: "", correct: false }]);
  }
  function setOptionText(i, text) {
    setOptions((opts) => opts.map((o, idx) => (idx === i ? { ...o, text } : o)));
  }
  function setOptionCorrect(i) {
    setOptions((opts) => opts.map((o, idx) => (idx === i ? { ...o, correct: !o.correct } : o)));
  }
  function removeOption(i) {
    setOptions((opts) => opts.filter((_, idx) => idx !== i));
  }

  async function createQuiz() {
    if (!isAdmin || !token) return;
    const filled = options.filter((o) => o.text.trim());
    const hasCorrect = filled.some((o) => o.correct);
    if (!course || !moduleKey || !question || filled.length < 2 || !hasCorrect) {
      alert("Please select module, add a question, at least 2 options, and mark at least 1 correct.");
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ course, moduleKey, question, options, explanation }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to create");
      // reload list
      setQuestion("");
      setOptions([
        { text: "", correct: false },
        { text: "", correct: false },
      ]);
      setExplanation("");
      setItems((arr) => [...arr, json]);
    } catch (err) {
      alert(String(err.message || err));
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuiz(id) {
    if (!isAdmin || !token) return;
    if (!confirm("Delete this quiz?")) return;
    try {
      const res = await apiFetch(`/api/quizzes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to delete");
      setItems((arr) => arr.filter((q) => q._id !== id));
    } catch (err) {
      alert(String(err.message || err));
    }
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="p-6 flex-1">
          <div className="mx-auto max-w-4xl">
            <div className="nb-card p-4">You need admin access to view this page.</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="p-6 flex-1">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          <aside className="space-y-3 md:col-span-1">
            <div className="nb-card p-4">
              <div className="text-base font-semibold">Filters</div>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-medium">Course</label>
                  <select className="mt-1 w-full rounded-md border-2 p-2" value={course} onChange={(e) => setCourse(e.target.value)}>
                    {courses.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium">Module</label>
                  <select
                    className="mt-1 w-full rounded-md border-2 p-2"
                    value={moduleKey}
                    onChange={(e) => setModuleKey(e.target.value)}
                  >
                    <option value="">Select module…</option>
                    {COURSE_MAP[course]?.modules?.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.title} ({m.key})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="nb-card p-4">
              <div className="text-base font-semibold">Create Quiz</div>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-medium">Question</label>
                  <input className="mt-1 w-full rounded-md border-2 p-2" value={question} onChange={(e) => setQuestion(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium">Options</label>
                  <div className="mt-2 space-y-2">
                    {options.map((o, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input className="flex-1 rounded-md border-2 p-2" placeholder={`Option ${i + 1}`} value={o.text} onChange={(e) => setOptionText(i, e.target.value)} />
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input type="checkbox" checked={o.correct} onChange={() => setOptionCorrect(i)} /> Correct
                        </label>
                        <button className="rounded-md border-2 px-2 text-xs nb-button" onClick={() => removeOption(i)} disabled={options.length <= 2}>Remove</button>
                      </div>
                    ))}
                    <button className="rounded-md border-2 px-3 py-1 text-xs nb-button" onClick={addOption}>Add option</button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium">Explanation (optional)</label>
                  <textarea className="mt-1 w-full rounded-md border-2 p-2" rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
                </div>
                <button className="h-10 rounded-md nb-button-primary px-4 text-sm font-medium text-white" onClick={createQuiz} disabled={saving}>{saving ? "Creating…" : "Create Quiz"}</button>
              </div>
            </div>
          </aside>
          <main className="md:col-span-2">
            <div className="nb-card p-4">
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold">Quizzes</div>
                {loading && <span className="text-xs text-gray-600">Loading…</span>}
              </div>
              {error && <div className="mt-2 rounded-md border-2 bg-red-50 p-3 text-sm text-red-700">{String(error.message || error)}</div>}
              <div className="mt-4 space-y-3">
                {items.map((q) => (
                  <div key={q._id} className="rounded-md border-2 p-4">
                    <div className="text-sm font-medium">[{q.course}/{q.moduleKey}] {q.question}</div>
                    <ul className="mt-2 list-disc pl-5 text-sm">
                      {q.options?.map((o, i) => (
                        <li key={i} className={o.correct ? "font-semibold text-green-700" : ""}>{o.text}</li>
                      ))}
                    </ul>
                    {q.explanation && <div className="mt-2 text-xs text-gray-600">{q.explanation}</div>}
                    <div className="mt-3">
                      <button className="rounded-md border-2 px-3 py-1 text-xs nb-button" onClick={() => deleteQuiz(q._id)}>Delete</button>
                    </div>
                  </div>
                ))}
                {items.length === 0 && !loading && <div className="text-sm text-gray-600">No quizzes found.</div>}
              </div>
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
