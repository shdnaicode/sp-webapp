import { Link, NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import HomeLogo from "../assets/home.svg";
import Avatar from "./Avatar";

function Navbar() {
  const [open, setOpen] = useState(false); // mobile menu
  const [profileOpen, setProfileOpen] = useState(false); // profile dropdown
  const { user, logout } = useAuth();
  const displayName = user?.username || "Guest";
  // Use Avatar component for image/initials fallback
  const profileRef = useRef(null);
  const isAdmin = user?.role === "admin";

  const linkBase =
    "px-5 py-3 rounded-md text-base font-semibold hover:bg-gray-50 transition-colors";
  const linkActive = "bg-gray-100";

  useEffect(() => {
    if (!profileOpen) return;
    function onDocClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [profileOpen]);

  return (
    <nav className="nb-bar sticky top-0 z-40 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-8 py-6 md:px-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="inline-flex items-center" aria-label="Home">
            <img src={HomeLogo} alt="Home" className="h-8 w-8" />
          </Link>
          <ul className="hidden items-center gap-3 md:flex">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/browse"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              >
                Courses
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/chatbot"
                className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
              >
                Chatbot
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center justify-center rounded-md border-2 p-3 md:hidden nb-button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            <span className="block h-0.5 w-6 bg-gray-800" />
            <span className="mt-1 block h-0.5 w-6 bg-gray-800" />
            <span className="mt-1 block h-0.5 w-6 bg-gray-800" />
          </button>

          <div className="hidden items-center gap-5 md:flex">
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex items-center gap-4"
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                >
                  <Avatar user={user} size={48} />
                  <div className="text-base font-semibold">{displayName}</div>
                </button>
                {profileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-md border-2 bg-white nb-card"
                  >
                    {isAdmin && (
                      <NavLink
                        to="/admin/courses"
                        onClick={() => setProfileOpen(false)}
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm hover:bg-gray-50 ${isActive ? "bg-gray-100" : ""}`
                        }
                      >
                        Admin: Courses
                      </NavLink>
                    )}
                    {isAdmin && (
                      <NavLink
                        to="/admin/quizzes"
                        onClick={() => setProfileOpen(false)}
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm hover:bg-gray-50 ${isActive ? "bg-gray-100" : ""}`
                        }
                      >
                        Admin: Quizzes
                      </NavLink>
                    )}
                    <NavLink
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2 text-sm hover:bg-gray-50 ${isActive ? "bg-gray-100" : ""}`
                      }
                    >
                      Profile
                    </NavLink>
                    <NavLink
                      to="/settings"
                      onClick={() => setProfileOpen(false)}
                      className={({ isActive }) =>
                        `block px-4 py-2 text-sm hover:bg-gray-50 ${isActive ? "bg-gray-100" : ""}`
                      }
                    >
                      Settings
                    </NavLink>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <NavLink to="/login" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
                  Login
                </NavLink>
                <NavLink to="/register" className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>
                  Register
                </NavLink>
              </div>
            )}
            {user && (
              <button
                onClick={logout}
                className="ml-2 rounded-md border-2 px-3 py-2 text-sm font-medium hover:bg-gray-50 nb-button"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t-2 bg-white md:hidden nb-card">
          <div className="mx-auto max-w-6xl px-6 py-4">
            <ul className="flex flex-col gap-2">
              <li>
                <NavLink
                  to="/"
                  end
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
                >
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/browse"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
                >
                  Courses
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/chatbot"
                  onClick={() => setOpen(false)}
                  className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
                >
                  Chatbot
                </NavLink>
              </li>
              {user && isAdmin && (
                <li>
                  <NavLink
                    to="/admin/courses"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
                  >
                    Admin: Courses
                  </NavLink>
                </li>
              )}
              {user && isAdmin && (
                <li>
                  <NavLink
                    to="/admin/quizzes"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
                  >
                    Admin: Quizzes
                  </NavLink>
                </li>
              )}
              <li>
                {user ? (
                  <div className="flex items-center gap-3 px-1 py-2">
                    <Avatar user={user} size={40} />
                    <div className="text-base font-semibold">{displayName}</div>
                    <button onClick={() => { setOpen(false); logout(); }} className="ml-auto rounded-md border-2 px-3 py-2 text-sm font-medium hover:bg-gray-50">Logout</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-1 py-2">
                    <NavLink to="/login" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>Login</NavLink>
                    <NavLink to="/register" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}>Register</NavLink>
                  </div>
                )}
              </li>
              {user && (
                <li>
                  <NavLink
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
                  >
                    Profile
                  </NavLink>
                </li>
              )}
              {user && (
                <li>
                  <NavLink
                    to="/settings"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
                  >
                    Settings
                  </NavLink>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
