import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Modal from "../components/modal";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const [errorMsg, setErrorMsg] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      await register(username, email, password);
      navigate("/");
    } catch (err) { 
      console.log("Register error", err);
      setErrorMsg(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="h-[52vh] w-[45vh] overflow-hidden nb-card">
        <form
          onSubmit={handleSubmit}
          className="flex h-full flex-col items-center"
        >
          <div className="flex w-full justify-center pt-7 text-2xl font-semibold">
            REGISTER
          </div>
          <label
            htmlFor="username"
            className="text-md mt-7 mb-2 self-start pl-6 font-medium"
          >
            Username
          </label>
          <input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            className="mb-5 h-11 w-[40vh] border-2 bg-white pl-3 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></input>
          <label
            htmlFor="email"
            className="text-md mb-2 self-start pl-6 font-medium"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            maxLength={30}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="username@gmail.com"
            className="mb-5 h-11 w-[40vh] border-2 bg-white pl-3 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></input>
          <label
            htmlFor="password"
            className="text-md mb-2 self-start pl-6 font-medium"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            maxLength={30}
            className="mb-9 h-11 w-[40vh] border-2 bg-white pl-3 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></input>
          <button
            value="Submit"
            type="submit"
            disabled={loading}
            className="text-md h-11 w-[40vh] cursor-pointer nb-button-primary font-medium text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>
      </div>
      <div className="mt-7 flex flex-col items-center justify-center">
        <div className="h-[10vh] w-[45vh] overflow-hidden nb-card">
          <p className="flex h-full items-center justify-center">
            Already registered?&nbsp;
            <Link to="/login" className="text-[#1877F2] hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </div>
      <Modal
        open={!!errorMsg}
        title="Registration error"
        onClose={() => setErrorMsg("")}
        actions={[
          <button key="ok" onClick={() => setErrorMsg("")} className="rounded-md nb-button px-3 py-2 text-sm">OK</button>,
        ]}
      >
        {errorMsg}
      </Modal>
    </div>
  );
}

export default Register;
