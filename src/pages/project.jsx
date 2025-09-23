import { useEffect, useRef, useState } from "react";
import Modal from "../components/modal";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

function LabeledInput({ label, ...props }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      <input
        {...props}
        className="h-10 w-full rounded-md border-2 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
}

function Project() {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [language, setLanguage] = useState("");
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let aborted = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
  const res = await apiFetch("/api/projects", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load projects");
        if (!aborted) setProjects(data);
      } catch (e) {
        if (!aborted) setError(e);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    if (token) load();
    return () => { aborted = true; };
  }, [token]);

  const createProject = async (e) => {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    try {
      let res, data;
      if (files.length > 0) {
        const form = new FormData();
        form.append("name", n);
        form.append("description", desc.trim());
        // language removed from UI; backend field will be empty by default
        for (const f of files) form.append("files", f);
        res = await apiFetch("/api/projects/upload-multi", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        data = await res.json();
      } else {
        res = await apiFetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: n, description: desc.trim(), sourceCode: "" }),
        });
        data = await res.json();
      }
      if (!res.ok) throw new Error(data?.message || "Failed to create project");
      setProjects((prev) => [data, ...prev]);
      setName("");
      setDesc("");
      setLanguage("");
      setFiles([]);
      setFileError("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (e) {
      setError(e);
    }
  };

  const allowedExt = [".c", ".cpp", ".cc", ".cxx", ".cs", ".py"];
  function getExt(filename) {
    const i = filename.lastIndexOf(".");
    return i >= 0 ? filename.slice(i).toLowerCase() : "";
  }
  function baseName(filename) {
    const i = filename.lastIndexOf(".");
    const core = i >= 0 ? filename.slice(0, i) : filename;
    return core.replace(/[^a-zA-Z0-9-_]+/g, "-").slice(0, 50);
  }
  function handlePickedFiles(fileList) {
    if (!fileList || fileList.length === 0) return;
    const picked = Array.from(fileList);
    const invalid = picked.find((f) => !allowedExt.includes(getExt(f.name)));
    if (invalid) {
      setFileError("Only C, C++, C#, or Python files are allowed.");
      return;
    }
    setFileError("");
    setFiles((prev) => [...prev, ...picked]);
    if (!name.trim()) setName(baseName(picked[0].name));
  }

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dt = e.dataTransfer;
    const fl = dt.files;
    handlePickedFiles(fl);
  };

  const [confirmId, setConfirmId] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const askRemove = (id) => { setConfirmId(id); setConfirmOpen(true); };
  const doRemove = async () => {
    const id = confirmId;
    setConfirmOpen(false);
    if (!id) return;
    try {
  const res = await apiFetch(`/api/projects/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch {}
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Projects</h1>
        <p className="text-sm text-gray-600">Create, view, and remove projects. You can also save source code.</p>
      </header>

  <section className="nb-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Create new project</h2>
        <form onSubmit={createProject} className="space-y-4">
          <LabeledInput
            label="Project name"
            placeholder="My project"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            required
          />
          <LabeledInput
            label="Description"
            placeholder="Optional description"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={120}
          />
          <div className="text-sm">
            <div className="mb-1 font-medium">Code file (C/C++/C#/Python)</div>
            <input
              ref={fileInputRef}
              id="project-file-input"
              type="file"
              accept=".c,.cpp,.cc,.cxx,.cs,.py"
              multiple
              onChange={(e) => handlePickedFiles(e.target.files)}
              className="hidden"
            />
            <div
              onDragOver={onDragOver}
              onDragEnter={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-8 text-center ${
                isDragging ? "bg-blue-50 border-blue-400" : "bg-white"
              }`}
            >
              <div className="text-gray-700">Drag and drop your file here</div>
              <div className="text-xs text-gray-500">or</div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="nb-button rounded-md border-2 px-3 py-2 text-sm"
              >
                Choose your file
              </button>
              <div className="mt-2 text-xs text-gray-500">Allowed: .c, .cpp, .cc, .cxx, .cs, .py (max 5MB each)</div>
            </div>
            {fileError && <div className="mt-2 text-sm text-red-600">{fileError}</div>}
            {files.length > 0 && (
              <div className="mt-3 overflow-hidden rounded-md border-2">
                <div className="divide-y-2">
                  {files.map((f, idx) => (
                    <div key={idx} className="flex items-center justify-between px-3 py-2 text-sm">
                      <div className="min-w-0 truncate">
                        <span className="font-medium">{f.name}</span>
                        {f.size ? <span className="text-gray-500"> • {(f.size / 1024).toFixed(1)} KB</span> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="nb-button rounded-md border-2 px-2 py-1 text-xs text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={files.length === 0 || !name.trim()}
            className={`h-10 rounded-md nb-button-primary px-4 font-medium text-white focus:ring-2 focus:ring-blue-500 ${(files.length === 0 || !name.trim()) ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            Create project
          </button>
        </form>
      </section>

      <section className="nb-card">
        <div className="border-b-2 p-4 font-medium">Your projects</div>
        {error && <div className="p-4 text-sm text-red-600">{error.message}</div>}
        <ul className="divide-y-2">
          {loading && <li className="p-4 text-sm text-gray-600">Loading…</li>}
          {!loading && projects.length === 0 && (
            <li className="p-4 text-sm text-gray-600">No projects yet. Create one above.</li>
          )}
          {projects.map((p) => (
            <li key={p._id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-600">{p.description || "No description"}</div>
                {p.file?.originalName && (
                  <div className="mt-1 text-xs text-gray-700">
                    File: <span className="font-medium">{p.file.originalName}</span>
                    {p.file.size ? <span> • {(p.file.size / 1024).toFixed(1)} KB</span> : null}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/project/${p._id}`}
                  className="rounded-md border-2 px-3 py-1 text-sm nb-button"
                >
                  View
                </Link>
                {p.file?.url && (
                  <a
                    href={p.file.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border-2 px-3 py-1 text-sm nb-button"
                  >
                    Download
                  </a>
                )}
                <button
                  className="rounded-md border-2 px-3 py-1 text-sm text-red-600 nb-button"
                  onClick={() => askRemove(p._id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      <Modal
        open={confirmOpen}
        title="Delete project?"
        onClose={() => setConfirmOpen(false)}
        actions={[
          <button key="cancel" onClick={() => setConfirmOpen(false)} className="rounded-md nb-button px-3 py-2 text-sm">Cancel</button>,
          <button key="delete" onClick={doRemove} className="rounded-md nb-button px-3 py-2 text-sm text-white bg-red-500 border-red-600">Delete</button>,
        ]}
      >
        This action cannot be undone.
      </Modal>
    </div>
  );
}

export default Project;