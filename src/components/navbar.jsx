import { Link } from "react-router-dom";

function Navbar() {

  const username = "Shindnai Sudprasert";


  return (
    <nav>
      <div className="border-b-2 bg-[#b1b1b0] h-23">
        <div className="flex justify-between items-center h-full px-10">

          <ul className="flex gap-x-6 font-bold text-lg pl-20 h-full items-center">
            <li className="flex items-center h-full underline decoration-2">
              <Link to="/">Home</Link>
            </li>
            <li className="flex items-center h-full underline decoration-2">
              <Link to="/">Browse</Link>
            </li>
            <li className="flex items-center h-full underline decoration-2">
              <Link to="/">Chatbot</Link>
            </li>
          </ul>

          <div className="flex items-center gap-x-4 h-full pr-20">
            <div className="text-lg font-semibold">
              Hello, {username}
            </div>
            <div className="bg-white h-14 w-14 rounded-full overflow-hidden border-2">
              <img
                src="/basic.jpg"
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;
