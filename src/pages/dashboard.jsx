import { useAuth } from "../context/AuthContext";
import { useUserProgress } from "../hooks/useUserProgress";
import { humanizeActivityText } from "../features/courses/lib/courses";

function Stat({ label, value }) {
    return (
        <div className="flex flex-col nb-card p-4 text-center">
            <div className="text-sm text-gray-600">{label}</div>
            <div className="mt-1 text-2xl font-semibold">{value}</div>
        </div>
    );
}

function Dashboard() {
    const { user } = useAuth();
    const { data, loading, error } = useUserProgress();
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-2xl font-semibold">Welcome back{user ? `, ${user.username}` : ""}</h1>
                <p className="text-sm text-gray-600">Here’s a quick snapshot of your progress.</p>
            </header>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat label="Active Courses" value={loading ? "…" : (data?.currentCourses?.length || 0)} />
                <Stat label="Courses Completed" value={loading ? "…" : (data?.coursesDone ?? 0)} />
                <Stat label="Study Hours" value={loading ? "…" : `${data?.studyHours ?? 0}h`} />
            </section>

            <section>
                <div className="nb-card">
                    <div className="border-b-2 p-4 font-medium">Recent Activity</div>
                    {error && <div className="p-4 text-sm text-red-600">{error.message}</div>}
                                        <ul className="divide-y-2">
                                                                                                {(data?.recentActivity?.length ? data.recentActivity.slice(-6) : []).map((a, idx) => (
                                                    <li key={idx} className="p-4 text-sm">{humanizeActivityText(a.text)}</li>
                        ))}
                        {!loading && (!data || !data.recentActivity || data.recentActivity.length === 0) && (
                          <li className="p-4 text-sm text-gray-500">No recent activity yet.</li>
                        )}
                    </ul>
                </div>
            </section>
        </div>
    );
}

export default Dashboard;