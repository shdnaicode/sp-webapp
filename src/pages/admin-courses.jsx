import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";

function ModuleRow({ mod, onChange, onRemove, onMoveUp, onMoveDown, index, total }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start border-2 rounded-md p-3">
      <div className="col-span-3">
        <label className="block text-xs font-medium">Title</label>
        <input className="mt-1 w-full rounded-md border-2 p-2" value={mod.title} onChange={(e) => onChange({ ...mod, title: e.target.value })} />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium">Key</label>
        <input className="mt-1 w-full rounded-md border-2 p-2" value={mod.key} onChange={(e) => onChange({ ...mod, key: e.target.value })} />
      </div>
      <div className="col-span-3">
        <label className="block text-xs font-medium">Video URL</label>
        <input className="mt-1 w-full rounded-md border-2 p-2" value={mod.videoUrl || ""} onChange={(e) => onChange({ ...mod, videoUrl: e.target.value })} />
      </div>
      <div className="col-span-2">
        <label className="block text-xs font-medium">Order</label>
        <input type="number" className="mt-1 w-full rounded-md border-2 p-2" value={mod.order ?? 0} onChange={(e) => onChange({ ...mod, order: Number(e.target.value) })} />
      </div>
      <div className="col-span-2 flex gap-2 pt-6">
        <button className="rounded-md border-2 px-2 text-xs nb-button" onClick={onMoveUp} disabled={index === 0}>Up</button>
        <button className="rounded-md border-2 px-2 text-xs nb-button" onClick={onMoveDown} disabled={index >= total - 1}>Down</button>
        <button className="rounded-md border-2 px-2 text-xs nb-button" onClick={onRemove}>Remove</button>
      </div>
      <div className="col-span-12">
        <label className="block text-xs font-medium">Description</label>
        <textarea className="mt-1 w-full rounded-md border-2 p-2" rows={2} value={mod.description || ""} onChange={(e) => onChange({ ...mod, description: e.target.value })} />
      </div>
    </div>
  );
}

export default function AdminCourses() {
  const { user, token } = useAuth();
  const isAdmin = user?.role === "admin";
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // course doc

  const [newCourse, setNewCourse] = useState({ title: "", slug: "", description: "", image: "", published: true, modules: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin || !token) return;
    let aborted = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch("/api/courses/all", { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || "Failed to load courses");
        if (!aborted) setCourses(Array.isArray(json) ? json : []);
      } catch (err) {
        if (!aborted) setError(err);
      } finally {
        if (!aborted) setLoading(false);
      }
    }
    load();
    return () => { aborted = true; };
  }, [isAdmin, token]);

  async function createCourse() {
    if (!isAdmin || !token) return;
    const { title, slug } = newCourse;
    if (!title.trim() || !slug.trim()) { alert("Title and slug are required"); return; }
    setSaving(true);
    try {
      const res = await apiFetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newCourse),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to create course");
      setCourses((arr) => [json, ...arr]);
      setNewCourse({ title: "", slug: "", description: "", image: "", published: true, modules: [] });
    } catch (err) {
      alert(String(err.message || err));
    } finally { setSaving(false); }
  }

  async function saveCourse() {
    if (!isAdmin || !token || !selected?._id) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/courses/${selected._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(selected),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to save course");
      setCourses((arr) => arr.map((c) => (c._id === json._id ? json : c)));
      setSelected(json);
    } catch (err) {
      alert(String(err.message || err));
    } finally { setSaving(false); }
  }

  function selectCourse(c) {
    setSelected(c ? JSON.parse(JSON.stringify(c)) : null);
  }

  function addModule() {
    setSelected((c) => ({ ...c, modules: [...(c.modules || []), { title: "New Module", key: `module${(c.modules?.length || 0) + 1}`, description: "", videoUrl: "", order: (c.modules?.length || 0) }] }));
  }
  function updateModuleAt(i, mod) {
    setSelected((c) => ({ ...c, modules: c.modules.map((m, idx) => (idx === i ? mod : m)) }));
  }
  function removeModuleAt(i) {
    setSelected((c) => ({ ...c, modules: c.modules.filter((_, idx) => idx !== i) }));
  }
  function moveModule(i, dir) {
    setSelected((c) => {
      const mods = [...(c.modules || [])];
      const ni = i + dir;
      if (ni < 0 || ni >= mods.length) return c;
      const [item] = mods.splice(i, 1);
      mods.splice(ni, 0, item);
      // reindex orders
      mods.forEach((m, idx) => (m.order = idx));
      return { ...c, modules: mods };
    });
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="p-6 flex-1">
          <div className="mx-auto max-w-4xl"><div className="nb-card p-4">You need admin access to view this page.</div></div>
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
              <div className="text-base font-semibold">Create Course</div>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-medium">Title</label>
                  <input className="mt-1 w-full rounded-md border-2 p-2" value={newCourse.title} onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium">Slug</label>
                  <input className="mt-1 w-full rounded-md border-2 p-2" value={newCourse.slug} onChange={(e) => setNewCourse({ ...newCourse, slug: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium">Description</label>
                  <textarea className="mt-1 w-full rounded-md border-2 p-2" rows={3} value={newCourse.description} onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })} />
                </div>
                <div className="flex items-center gap-2">
                  <input id="pub" type="checkbox" checked={newCourse.published} onChange={(e) => setNewCourse({ ...newCourse, published: e.target.checked })} />
                  <label htmlFor="pub" className="text-xs">Published</label>
                </div>
                <button className="h-10 rounded-md nb-button-primary px-4 text-sm font-medium text-white" onClick={createCourse} disabled={saving}>{saving ? "Creating…" : "Create"}</button>
              </div>
            </div>
            <div className="nb-card p-4">
              <div className="text-base font-semibold">Courses</div>
              {loading && <div className="mt-2 text-xs text-gray-600">Loading…</div>}
              {error && <div className="mt-2 rounded-md border-2 bg-red-50 p-3 text-xs text-red-700">{String(error.message || error)}</div>}
              <ul className="mt-3 space-y-2 text-sm">
                {courses.map((c) => (
                  <li key={c._id}>
                    <button className={`w-full rounded-md border-2 px-3 py-2 text-left nb-button ${selected?._id===c._id?"bg-gray-100":""}`} onClick={() => selectCourse(c)}>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-xs text-gray-600">/{c.slug}</div>
                    </button>
                  </li>
                ))}
                {courses.length===0 && !loading && <li className="text-xs text-gray-600">No courses yet.</li>}
              </ul>
            </div>
          </aside>
          <main className="md:col-span-2">
            <div className="nb-card p-4">
              <div className="flex items-center justify-between">
                <div className="text-xl font-semibold">Edit Course</div>
                {saving && <span className="text-xs text-gray-600">Saving…</span>}
              </div>
              {!selected ? (
                <div className="mt-2 text-sm text-gray-600">Select a course to edit.</div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium">Title</label>
                      <input className="mt-1 w-full rounded-md border-2 p-2" value={selected.title} onChange={(e) => setSelected({ ...selected, title: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium">Slug</label>
                      <input className="mt-1 w-full rounded-md border-2 p-2" value={selected.slug} onChange={(e) => setSelected({ ...selected, slug: e.target.value })} />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium">Description</label>
                      <textarea className="mt-1 w-full rounded-md border-2 p-2" rows={3} value={selected.description || ""} onChange={(e) => setSelected({ ...selected, description: e.target.value })} />
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <input id="epub" type="checkbox" checked={!!selected.published} onChange={(e) => setSelected({ ...selected, published: e.target.checked })} />
                      <label htmlFor="epub" className="text-xs">Published</label>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="text-base font-semibold">Modules</div>
                    <button className="rounded-md border-2 px-3 py-2 text-xs nb-button" onClick={addModule}>Add Module</button>
                  </div>
                  <div className="space-y-3">
                    {(selected.modules || []).map((m, i) => (
                      <ModuleRow
                        key={i}
                        mod={m}
                        index={i}
                        total={selected.modules.length}
                        onChange={(mm) => updateModuleAt(i, mm)}
                        onRemove={() => removeModuleAt(i)}
                        onMoveUp={() => moveModule(i, -1)}
                        onMoveDown={() => moveModule(i, 1)}
                      />
                    ))}
                    {selected.modules?.length === 0 && <div className="text-xs text-gray-600">No modules yet.</div>}
                  </div>
                  <div>
                    <button className="h-10 rounded-md nb-button-primary px-4 text-sm font-medium text-white" onClick={saveCourse} disabled={saving}>Save</button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
