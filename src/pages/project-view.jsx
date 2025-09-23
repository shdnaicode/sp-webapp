import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch, apiUrl } from "../lib/api";

function LineNumbers({ lines }) {
  return (
    <div className="select-none bg-[#f6f8fa] text-right text-xs text-gray-500 pr-3 py-3 border-r-2">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="leading-6">{i + 1}</div>
      ))}
    </div>
  );
}

function CodeBlock({ code }) {
  // Simple code block with monospaced font; could integrate highlight.js later
  const lines = (code || "").split("\n");
  return (
    <div className="overflow-auto border-2 rounded-md">
      <div className="flex font-mono text-sm">
        <LineNumbers lines={lines.length} />
        <pre className="m-0 p-3 whitespace-pre">
{code}
        </pre>
      </div>
    </div>
  );
}

export default function ProjectView() {
  const { id } = useParams();
  const { token } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileText, setFileText] = useState("");
  const [activeFileUrl, setActiveFileUrl] = useState("");
  const [activeFileName, setActiveFileName] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(`/api/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load project");
        if (!cancelled) setProject(data);
      } catch (e) {
        if (!cancelled) setError(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (token && id) load();
    return () => { cancelled = true; };
  }, [id, token]);

  useEffect(() => {
    let cancelled = false;
    async function fetchFile() {
      const url = activeFileUrl || project?.file?.url || "";
      if (!url) { setFileText(""); return; }
      try {
        const res = await fetch(apiUrl(url));
        const txt = await res.text();
        if (!cancelled) setFileText(txt);
      } catch {
        if (!cancelled) setFileText("");
      }
    }
    fetchFile();
    return () => { cancelled = true; };
  }, [project, activeFileUrl]);

  if (loading) return <div className="p-4 text-sm text-gray-600">Loading…</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error.message}</div>;
  if (!project) return <div className="p-4 text-sm text-gray-600">Project not found.</div>;

  return (
    <div className="space-y-6 mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-semibold">{project.name}</div>
          <div className="text-sm text-gray-600">{project.description || "No description provided."}</div>
        </div>
        <Link to="/project" className="rounded-md border-2 px-3 py-1 text-sm nb-button">Back to Projects</Link>
      </div>

      <div className="nb-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div />
          <div className="text-xs text-gray-500">Last updated: {new Date(project.updatedAt).toLocaleString()}</div>
        </div>
        {Array.isArray(project.files) && project.files.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-md border-2">
              <ul className="divide-y-2">
                {project.files.map((f, idx) => (
                  <li key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                    <button
                      className={`min-w-0 truncate text-left ${activeFileUrl === f.url ? "font-semibold" : ""}`}
                      onClick={() => { setActiveFileUrl(f.url); setActiveFileName(f.originalName); }}
                    >
                      {f.originalName}
                      {f.size ? <span className="text-gray-500"> • {(f.size / 1024).toFixed(1)} KB</span> : null}
                    </button>
                    <a href={apiUrl(f.url)} target="_blank" rel="noreferrer" className="rounded-md border-2 px-3 py-1 text-xs nb-button">Download</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-sm text-gray-700">Previewing: <span className="font-medium">{activeFileName || project.files[0].originalName}</span></div>
              <CodeBlock code={fileText || "// Unable to preview file."} />
            </div>
          </div>
        ) : project.file?.url ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-700">
                File: <span className="font-medium">{project.file.originalName}</span>
                {project.file.size ? <span> • {(project.file.size / 1024).toFixed(1)} KB</span> : null}
              </div>
              <a href={apiUrl(project.file.url)} target="_blank" rel="noreferrer" className="rounded-md border-2 px-3 py-1 text-xs nb-button">Download</a>
            </div>
            <CodeBlock code={fileText || "// Unable to preview file."} />
          </div>
        ) : (
          <CodeBlock code={project.sourceCode || "// No source code saved for this project."} />
        )}
      </div>
      
      
    </div>
  );
}
