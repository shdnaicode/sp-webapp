import { NavLink, Outlet } from "react-router-dom";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/AuthContext";
import { useUserProgress } from "../hooks/useUserProgress";
import { humanizeActivityText } from "../features/courses/lib/courses";
import HomeLogo from "../assets/home.svg";
import BarLogo from "../assets/bar.svg";
import AssignmentLogo from "../assets/assignment.svg";

function Home() {
  const { user } = useAuth();
  const { data } = useUserProgress();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

  <div className="flex-1 flex gap-8 px-6 py-8 md:px-10 md:py-10">
        {user && (
          <div className="sr-only">Welcome back, {user.username}</div>
        )}
        {/* Sidebar */}
        <aside className="w-80 flex-shrink-0">
          <div className="nb-card p-4">
            {/* Search */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase text-gray-500">Search</label>
              <input
                type="text"
                placeholder="Search..."
                className="mt-1 h-9 w-full rounded-md border-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Navigation */}
            <div className="mb-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Navigation</div>
              <ul className="flex flex-col gap-1 text-[15px] font-medium">
                <li>
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50 ${
                        isActive ? "bg-gray-50" : ""
                      }`
                    }
                  >
                    <img src={HomeLogo} className="h-5 w-5" alt="Home" />
                    <span>Dashboard</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="progress"
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50 ${
                        isActive ? "bg-gray-50" : ""
                      }`
                    }
                  >
                    <img src={BarLogo} className="h-5 w-5" alt="Progress" />
                    <span>Progress</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="project"
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50 ${
                        isActive ? "bg-gray-50" : ""
                      }`
                    }
                  >
                    <img src={AssignmentLogo} className="h-5 w-5" alt="Projects" />
                    <span>Projects</span>
                  </NavLink>
                </li>
              </ul>
            </div>

            {/* Quick actions */}
            <div className="mb-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Quick actions</div>
              <div className="flex flex-col gap-2">
                <NavLink
                  to="project"
                  className="h-9 rounded-md nb-button-primary text-center text-sm font-medium text-white hover:opacity-95"
                >
                  <span className="inline-block px-3 leading-9">New Project</span>
                </NavLink>
                <NavLink
                  to="progress"
                  className="h-9 rounded-md nb-button text-center text-sm font-medium hover:bg-gray-50"
                >
                  <span className="inline-block px-3 leading-9">View Progress</span>
                </NavLink>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Recent activity</div>
              <ul className="space-y-2 text-sm">
                {(data?.recentActivity || []).slice(0, 3).map((a, idx) => (
                  <li key={idx} className="flex items-center justify-between rounded-md border-2 px-3 py-2 nb-card">
                    <span className="truncate">{humanizeActivityText(a.text)}</span>
                    <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">{new Date(a.createdAt).toLocaleDateString()}</span>
                  </li>
                ))}
                {(!data?.recentActivity || data.recentActivity.length === 0) && (
                  <li className="flex items-center justify-between rounded-md border-2 px-3 py-2 text-gray-500 nb-card">
                    No recent activity yet.
                  </li>
                )}
              </ul>
            </div>

            

            {/* Help */}
            <div className="mt-4 nb-card p-3 text-sm">
              <div className="font-semibold">Need help?</div>
              <p className="mt-1 text-gray-600">Check docs or reach out in Chatbot.</p>
              <NavLink
                to="/chatbot"
                className="mt-3 inline-block rounded-md border-2 px-3 py-1 text-sm hover:bg-gray-50 nb-button"
              >
                Ask Chatbot
              </NavLink>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <section className="flex-1 flex justify-center">
          <div className="min-h-[60vh] w-full max-w-4xl nb-card p-8">
            <Outlet />
          </div>
        </section>

        {/* Right info rail (desktop only) */}
        <aside className="hidden w-80 flex-shrink-0 lg:block">
          <div className="space-y-5">
            <div className="nb-card p-5">
              <div className="text-sm font-semibold">Tips</div>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                <li>learn learn learn</li>
              </ul>
            </div>
            <div className="nb-card p-5">
              <div className="text-sm font-semibold">What's new</div>
              <ul className="mt-2 space-y-2 text-sm">
                <li className="rounded-md border px-3 py-2 nb-card">TBA</li>
                <li className="rounded-md border px-3 py-2 nb-card">TBA</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
      <Footer />
    </div>
  );
}

export default Home;
