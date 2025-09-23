import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { useUserProgress } from "../hooks/useUserProgress";
import Avatar from "../components/Avatar";

function Profile() {
  const { user } = useAuth();
  const username = user?.username || "User";
  const email = user?.email || "";
  const navigate = useNavigate();
  const { data, loading } = useUserProgress();

  const titleFromSlug = (slug) => {
    switch (slug) {
      case "intro-to-robotics":
        return "Intro to Robotics";
      case "arduino-basics":
        return "Arduino Basics";
      case "sensors-and-actuators":
        return "Sensors & Actuators";
      case "computer-vision":
        return "Computer Vision";
      case "ros-fundamentals":
        return "ROS Fundamentals";
      default: {
        // Fallback: prettify by replacing dashes and capitalizing words
        return String(slug)
          .split("-")
          .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
          .join(" ");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="mx-auto w-full max-w-3xl p-6 flex-1">
        <div className="nb-card p-6">
          <div className="flex items-start gap-6">
            <Avatar user={user} size={96} />
            <div className="flex-1">
              <h1 className="text-2xl font-semibold">{username}</h1>
              {email && <div className="mt-1 text-sm text-gray-700">{email}</div>}
              <div className="mt-4 flex items-center gap-2">
                <Link to="/settings" className="rounded-md nb-button px-3 py-2 text-sm">Edit profile</Link>
                <Link to="/progress" className="rounded-md nb-button px-3 py-2 text-sm">View progress</Link>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="nb-card p-4">
              <div className="text-sm font-semibold">About</div>
              <div className="mt-2 text-sm text-gray-700">Welcome to your profile page.</div>
            </div>
            <div className="nb-card p-4">
              <div className="text-sm font-semibold">Quick links</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
                <li>
                  <Link to="/project" className="underline">Your projects</Link>
                </li>
                <li>
                  <Link to="/browse" className="underline">Browse courses</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 nb-card p-4">
            <div className="border-b-2 pb-3 text-base font-semibold">Enrolled courses</div>
            {loading && <div className="p-3 text-sm text-gray-600">Loading…</div>}
            {!loading && (
              <ul className="divide-y-2">
                {(data?.currentCourses || []).map((slug) => (
                  <li key={slug} className="flex items-center justify-between p-3 text-sm">
                    <span className="truncate pr-3">{titleFromSlug(slug)}</span>
                    <button
                      className="rounded-md nb-button-primary px-3 py-1 text-xs font-semibold text-white"
                      onClick={() => navigate(`/learn/${slug}`)}
                    >
                      Learn
                    </button>
                  </li>
                ))}
                {Array.isArray(data?.currentCourses) && data.currentCourses.length === 0 && (
                  <li className="p-3 text-sm text-gray-600">No current courses. Enroll from Browse.</li>
                )}
              </ul>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;
