import { Link, Outlet } from "react-router-dom";
import Navbar from "../components/navbar";
import HomeLogo from "../assets/home.svg";
import BarLogo from "../assets/bar.svg";
import AssignmentLogo from "../assets/assignment.svg";

function Home() {
  return (
    <div>
      <Navbar />

      <div className="flex">
        <aside className="w-[35%] h-screen flex-shrink-0">
          <div className="bg-white border-2 p-10 h-[35%] max-w-xs ml-25 mt-25">
            <ul className="font-bold text-xl flex flex-col gap-y-5">
              <li className="flex items-center gap-x-3 hover:underline hover:decoration-2">
                <img src={HomeLogo} className="h-9 w-9" alt="Home" />
                <Link to="/">Dashboard</Link>
              </li>
              <li className="flex items-center gap-x-3 hover:underline hover:decoration-2">
                <img src={BarLogo} className="h-9 w-9" alt="Progress" />
                <Link to="progress">Progress</Link>
              </li>
              <li className="flex items-center gap-x-3 hover:underline hover:decoration-2">
                <img src={AssignmentLogo} className="h-9 w-9" alt="Projects" />
                <Link to="project">Projects</Link>
              </li>
            </ul>
          </div>
        </aside>

        <section className="flex-1">
          <Outlet />
        </section>
      </div>
    </div>
  );
}

export default Home;
