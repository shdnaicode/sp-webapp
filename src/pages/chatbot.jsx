import { useState, useRef, useEffect } from "react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/AuthContext";
import { apiFetch, apiUrl } from "../lib/api";
import { SLUG_TITLE_MAP } from "../features/courses/lib/courses";

function Chatbot() {
  const { token } = useAuth();
  const [messages, setMessages] = useState([
    { id: 1, role: "assistant", content: "Hi! How can I help you today?" },
  ]);
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [input, setInput] = useState("");
  const [extraContext, setExtraContext] = useState([]); // per-session extras (URL summaries)
  const [addingUrl, setAddingUrl] = useState(false);
  const listRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load chat history on mount
  useEffect(() => {
    (async () => {
      try {
        if (!token) return;
        const res = await apiFetch("/api/chat/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return; // ignore silently
        const data = await res.json();
        const msgs = Array.isArray(data?.messages) ? data.messages : [];
        if (msgs.length > 0) {
          setMessages(msgs.map((m, i) => ({ id: Date.now() + i, role: m.role, content: m.content })));
        }
      } catch {}
    })();
  }, [token]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Load thread list and current history
  useEffect(() => {
    (async () => {
      try {
        if (!token) return;
        // Load threads
        const r = await apiFetch("/api/chat/threads", { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) {
          const d = await r.json();
          setThreads(Array.isArray(d?.threads) ? d.threads : []);
        }
        // If we have an active thread, load it. Else, load old single-history fallback.
        if (activeThreadId) {
          const t = await apiFetch(`/api/chat/threads/${activeThreadId}`, { headers: { Authorization: `Bearer ${token}` } });
          if (t.ok) {
            const data = await t.json();
            const msgs = Array.isArray(data?.thread?.messages) ? data.thread.messages : [];
            if (msgs.length > 0) setMessages(msgs.map((m, i) => ({ id: Date.now() + i, role: m.role, content: m.content })));
          }
        } else {
          const res = await apiFetch("/api/chat/history", { headers: { Authorization: `Bearer ${token}` } });
          if (res.ok) {
            const data = await res.json();
            const msgs = Array.isArray(data?.messages) ? data.messages : [];
            if (msgs.length > 0) setMessages(msgs.map((m, i) => ({ id: Date.now() + i, role: m.role, content: m.content })));
          }
        }
      } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeThreadId]);

  async function refreshThreads() {
    try {
      if (!token) return;
      const r = await apiFetch("/api/chat/threads", { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) {
        const d = await r.json();
        setThreads(Array.isArray(d?.threads) ? d.threads : []);
      }
    } catch {}
  }

  async function ensureThread() {
    if (activeThreadId) return activeThreadId;
    if (!token) return null;
    if (creating) return null;
    setCreating(true);
    try {
      const res = await apiFetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: "New chat" }),
      });
      const data = await res.json();
      const id = data?.thread?.id || data?.thread?._id;
      if (id) {
        setActiveThreadId(id);
        await refreshThreads();
        return id;
      }
    } catch {}
    finally { setCreating(false); }
    return null;
  }

  const onSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !token) return;
    const threadId = await ensureThread();
    const courseSlugs = (() => {
      try {
        const q = text.toLowerCase();
        const qNorm = q.replace(/&/g, "and");
        const found = [];
        for (const [slug, title] of Object.entries(SLUG_TITLE_MAP)) {
          const tNorm = String(title || "").toLowerCase().replace(/&/g, "and");
          if (q.includes(slug) || qNorm.includes(tNorm)) found.push(slug);
        }
        return Array.from(new Set(found));
      } catch {
        return [];
      }
    })();
    const userMsg = { id: Date.now(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      // Start an empty assistant message and stream into it
      const tempId = Date.now() + 1;
      setMessages((prev) => [...prev, { id: tempId, role: "assistant", content: "" }]);

      const body = {
        messages: [...messages, userMsg].map(({ role, content }) => ({ role, content })),
        includeCourseContext: true,
        ...(courseSlugs.length ? { courseSlugs } : {}),
        ...(extraContext.length ? { extraContext } : {}),
      };
      const streamUrl = apiUrl("/api/gemini/chat/stream");
      const res = await fetch(streamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok || !res.body) throw new Error("Failed to start stream");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const applyDelta = (delta) => {
        setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, content: (m.content || "") + delta } : m)));
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        // Parse SSE events
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (const part of parts) {
          const lines = part.split("\n");
          let event = "message";
          let dataLine = "";
          for (const l of lines) {
            if (l.startsWith("event:")) event = l.slice(6).trim();
            if (l.startsWith("data:")) dataLine = l.slice(5).trim();
          }
          if (!dataLine) continue;
          try {
            const payload = JSON.parse(dataLine);
            if (event === "token" && payload?.text) applyDelta(payload.text);
            if (event === "done") {
              // Finalize and persist
              const finalText = payload?.text || "";
              if (finalText) {
                setMessages((prev) => prev.map((m) => (m.id === tempId ? { ...m, content: finalText } : m)));
              }
              if (threadId) {
                const title = messages.length <= 1 ? text.slice(0, 80) : undefined;
                try {
                  await apiFetch(`/api/chat/threads/${threadId}/messages`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      messages: [...messages, userMsg, { role: "assistant", content: finalText }].map(({ role, content }) => ({ role, content })),
                      ...(title ? { title } : {}),
                    }),
                  });
                  refreshThreads();
                } catch {}
              }
            }
            if (event === "error") {
              throw new Error(payload?.message || "Stream error");
            }
          } catch {}
        }
      }
    } catch (err) {
      setError(err);
      setMessages((prev) => prev.map((m) => (m.role === "assistant" && m.content === "" ? { ...m, content: err.message || "Something went wrong" } : m)));
    } finally {
      setLoading(false);
    }
  };

  const onNewChat = async () => {
    try {
      if (!token) return;
      const res = await apiFetch("/api/chat/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: "New chat" }),
      });
      const data = await res.json();
      const id = data?.thread?.id || data?.thread?._id;
      await refreshThreads();
      if (id) {
        setActiveThreadId(id);
        setMessages([{ id: Date.now(), role: "assistant", content: "Hi! How can I help you today?" }]);
        setExtraContext([]);
      }
    } catch {}
  };

  const onSelectThread = async (id) => {
    try {
      if (!token) return;
      const res = await apiFetch(`/api/chat/threads/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      const msgs = Array.isArray(data?.thread?.messages) ? data.thread.messages : [];
      setActiveThreadId(id);
      setMessages(msgs.length ? msgs.map((m, i) => ({ id: Date.now() + i, role: m.role, content: m.content })) : [{ id: Date.now(), role: "assistant", content: "Hi! How can I help you today?" }]);
      setExtraContext([]);
    } catch {}
  };

  const onRenameThread = async (id) => {
    const title = prompt("Rename chat:")?.trim();
    if (!title) return;
    try {
      await apiFetch(`/api/chat/threads/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title }),
      });
      refreshThreads();
    } catch {}
  };

  const onDeleteThread = async (id) => {
    if (!confirm("Delete this chat?")) return;
    try {
      await apiFetch(`/api/chat/threads/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      refreshThreads();
      if (activeThreadId === id) {
        setActiveThreadId(null);
        setMessages([{ id: Date.now(), role: "assistant", content: "Hi! How can I help you today?" }]);
      }
    } catch {}
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="p-6 flex-1 min-h-0 overflow-hidden">
        <div className="mx-auto max-w-6xl h-full min-h-0 overflow-hidden grid grid-cols-4 grid-rows-1 gap-6">
          <div className="nb-card col-span-1 flex flex-col min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between border-b-2 p-3">
              <div className="text-sm font-medium">Chats</div>
              <button onClick={onNewChat} className="nb-button px-3 py-1 text-sm">New</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <ul className="space-y-2">
                {threads.map((t) => (
                  <li key={t._id || t.id} className={`group rounded border-2 bg-white p-2 text-sm ${activeThreadId === (t._id || t.id) ? "border-black" : "border-gray-300"}`}>
                    <button className="block w-full text-left" onClick={() => onSelectThread(t._id || t.id)}>
                      <div className="truncate">{t.title || "Untitled"}</div>
                      <div className="mt-1 text-[11px] text-gray-500">{new Date(t.updatedAt).toLocaleString()}</div>
                    </button>
                    <div className="mt-2 hidden gap-2 group-hover:flex">
                      <button className="nb-button px-2 py-0.5 text-xs" onClick={() => onRenameThread(t._id || t.id)}>Rename</button>
                      <button className="nb-button px-2 py-0.5 text-xs" onClick={() => onDeleteThread(t._id || t.id)}>Delete</button>
                    </div>
                  </li>
                ))}
                {threads.length === 0 && (
                  <li className="rounded border-2 bg-white p-2 text-sm text-gray-500">No chats yet.</li>
                )}
              </ul>
            </div>
          </div>
          <div className="nb-card col-span-3 flex flex-col min-h-0 h-full overflow-hidden">
            <div className="flex items-center justify-between border-b-2 p-3">
              <div className="text-sm font-medium">AI Chatbot</div>
              <div className="flex items-center gap-2">
                {extraContext.length > 0 && (
                  <div className="hidden md:flex flex-wrap items-center gap-1 max-w-[50%]">
                    {extraContext.map((s, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded border-2 bg-white px-2 py-0.5 text-xs">
                        <span className="truncate max-w-[200px]">{s.slice(0, 60)}{s.length > 60 ? "…" : ""}</span>
                        <button className="text-gray-500 hover:text-black" onClick={() => setExtraContext((prev) => prev.filter((_, idx) => idx !== i))}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <button onClick={() => setAddingUrl(true)} className="nb-button px-3 py-1 text-sm">Add URL context</button>
              </div>
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 min-h-0">
              <div className="space-y-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl border-2 px-4 py-2 text-sm leading-6 ${
                        m.role === "user" ? "border-black bg-[#1877F2] text-white" : "bg-white"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={onSend} className="border-t-2 p-3">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Send a message..."
                  className="h-11 flex-1 rounded-md border-2 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading || !token}
                  className="h-11 rounded-md nb-button-primary px-5 font-medium text-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Thinking..." : "Send"}
                </button>
              </div>
            </form>
            {error && (
              <div className="p-3 text-center text-sm text-red-600">{error.message}</div>
            )}
          </div>
        </div>
      </div>
      {addingUrl && (
        <AddUrlModal
          onClose={() => setAddingUrl(false)}
          onAdd={async (summary) => {
            setExtraContext((prev) => [...prev, summary]);
            setAddingUrl(false);
          }}
          token={token}
        />
      )}
      <Footer />
    </div>
  );
}

function AddUrlModal({ onClose, onAdd, token }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const submit = async (e) => {
    e.preventDefault();
    const u = url.trim();
    if (!/^https?:\/\//i.test(u)) {
      setError(new Error("Enter a valid http(s) URL"));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/gemini/context/from-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ url: u }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to fetch URL");
      const summary = data?.summary || "";
      if (summary) onAdd(summary);
      else throw new Error("Empty summary");
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="nb-card w-full max-w-lg">
        <div className="flex items-center justify-between border-b-2 p-3">
          <div className="text-sm font-medium">Add URL context</div>
          <button onClick={onClose} className="nb-button px-2 py-0.5 text-sm">Close</button>
        </div>
        <form onSubmit={submit} className="p-4 space-y-3">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="h-11 w-full rounded-md border-2 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2 justify-end">
            <button type="button" onClick={onClose} className="nb-button px-3 py-1 text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="nb-button-primary px-4 py-2 text-sm text-white disabled:opacity-60">
              {loading ? "Adding..." : "Add"}
            </button>
          </div>
          {error && <div className="text-sm text-red-600">{error.message}</div>}
        </form>
      </div>
    </div>
  );
}

export default Chatbot;
