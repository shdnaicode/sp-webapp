function Navbar() {
  return (
    <nav>
      <div className="left-0 top-0 border-b-2 bg-white h-20">
        <ul className="font-medium text-md flex gap-x-2 pt-7 pl-10 text-center justify-left">
          <li>Home</li>
          <span>|</span>
          <li>Browse</li>
          <span>|</span>
          <li>Chatbot</li>
        </ul>
        <div>
          <img></img>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
