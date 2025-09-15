import { Link } from "react-router-dom";


function Login() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="h-[52vh] w-[45vh] overflow-hidden border-2 bg-white">
        <form
          className="flex h-full flex-col items-center"
        >
          <div className="flex w-full justify-center pt-7 text-2xl font-semibold">
            LOGIN
          </div>
        
          <label
            htmlFor="email"
            className="text-md mb-2 mt-7 self-start pl-6 font-medium"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            maxLength={30}
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
            maxLength={30}
            className="mb-9 h-11 w-[40vh] border-2 bg-white pl-3 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></input>
          <button
            value="Submit"
            type="submit"
            className="text-md h-11 w-[40vh] cursor-pointer bg-[#1877F2] font-medium text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            Login
          </button>

          <span className="border-t-2 w-[80%] mt-8 opacity-15">
          </span>
        </form>
        
      </div>
      <div className="mt-7 flex flex-col items-center justify-center">
        <div className="h-[10vh] w-[45vh] overflow-hidden bg-white border-2">
          <p className="flex h-full items-center justify-center">
            Need account?&nbsp;
            <Link to="/" className="text-[#1877F2] hover:underline">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
