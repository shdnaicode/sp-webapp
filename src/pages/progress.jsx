import { useUserProgress } from "../hooks/useUserProgress";
import { useAuth } from "../context/AuthContext";
import Modal from "../components/modal";
import { apiFetch } from "../lib/api";
import { slugToTitle } from "../features/courses/lib/courses";
import { useNavigate } from "react-router-dom";
function Stat({ label, value }) {
    return (
        <div className="flex flex-col nb-card p-4 text-center">
            <div className="text-sm text-gray-600">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
    );
}

function ProgressBar({ percent }) {
    return (
        <div className="w-full nb-card p-4">
            <div className="mb-2 text-sm font-medium text-gray-700">Overall Progress</div>
            <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                    className="h-3 rounded-full bg-[#1877F2]"
                    style={{ width: `${percent}%` }}
                />
            </div>
            <div className="mt-2 text-right text-xs text-gray-600">{percent}%</div>
        </div>
    );
}

function Progress() {
    const { token } = useAuth();
    const { data, loading, error, reload } = useUserProgress();
    const navigate = useNavigate();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmCourse, setConfirmCourse] = useState("");
    const modulesLabel = loading
        ? "…"
        : `${data?.modulesCompleted ?? 0}/${data?.modulesTotal ?? 0}`;
    const coursesDone = loading ? "…" : `${data?.coursesDone ?? 0}`;
    const studyHours = loading ? "…" : `${data?.studyHours ?? 0}h`;
    const overallPercent = loading ? 0 : (data?.overallPercent ?? 0);
    const currentCourses = data?.currentCourses || [];
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-semibold">Course Progress</h1>
                <p className="text-sm text-gray-600">Track your robotics learning and time spent.</p>
            </header>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat label="Modules Completed" value={modulesLabel} />
                <Stat label="Courses Done" value={coursesDone} />
                <Stat label="Study Hours" value={studyHours} />
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <ProgressBar percent={overallPercent} />
                                                                <div className="nb-card">
                                                                                <div className="border-b-2 p-4 font-medium">Current Course</div>
                                        {error && <div className="p-4 text-sm text-red-600">{error.message}</div>}
                                        <ul className="divide-y-2">
                                                {currentCourses.map((c, idx) => (
                                                        <li key={idx} className="flex items-center justify-between p-4 text-sm">
                                                                <span className="truncate pr-3">{slugToTitle(c)}</span>
                                                                <div className="flex items-center gap-2">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     <button
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                className="rounded-md nb-button-primary px-3 py-1 text-xs font-semibold text-white"
                                                                                                                                        onClick={() => navigate(`/learn/${c}`)}
                                                                                                                                    >
                                                                    Learn
                                                                  </button>
                                                                                                                                    <button
                                                                                                                                        className="rounded-md border-2 px-3 py-1 text-xs hover:bg-gray-50 nb-button"
                                                                                                                                        onClick={() => { setConfirmCourse(c); setConfirmOpen(true); }}
                                                                                                                                    >
                                                                                                                                        Unenroll
                                                                                                                                    </button>
                                                                </div>
                                                        </li>
                                                ))}
                                                {!loading && currentCourses.length === 0 && (
                                                        <li className="p-4 text-sm text-gray-500">No current courses yet.</li>
                                                )}
                                        </ul>
                                </div>
            </section>

                        {confirmOpen && (
                                <Modal
                                    open={true}
                                    title="Unenroll from course?"
                                    onClose={() => setConfirmOpen(false)}
                                    actions={[
                                        <button key="cancel" type="button" className="rounded-md border px-3 py-2 text-sm nb-button" onClick={() => setConfirmOpen(false)}>Cancel</button>,
                                        <button
                                            key="delete"
                                            type="button"
                                            className="rounded-md nb-button-primary px-3 py-2 text-sm font-medium text-white"
                                            onClick={async () => {
                                                try {
                                                                                const res = await apiFetch("/api/progress/unenroll", {
                                                        method: "POST",
                                                        headers: {
                                                            "Content-Type": "application/json",
                                                            Authorization: `Bearer ${token}`,
                                                        },
                                                        body: JSON.stringify({ course: confirmCourse }),
                                                    });
                                                    if (res.ok) {
                                                        setConfirmOpen(false);
                                                        setConfirmCourse("");
                                                        await reload();
                                                    }
                                                                        } catch {
                                                                            setConfirmOpen(false);
                                                                            setConfirmCourse("");
                                                                        }
                                            }}
                                        >
                                            Unenroll
                                        </button>,
                                    ]}
                                >
                                    <div className="text-sm">You’re about to unenroll from <span className="font-semibold">{confirmCourse}</span>. You can re-enroll anytime from Browse.</div>
                                </Modal>
                        )}
        </div>
    );
}

export default Progress;

// Local state hooks
import { useState } from "react";