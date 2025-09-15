function Login() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <div className="h-[52vh] w-[45vh] overflow-hidden rounded-lg border bg-[#D3DAD9]/20 backdrop-blur-sm">
        <form
          className="flex h-full flex-col items-center"
        >
          <div className="flex w-full justify-center pt-7 text-2xl font-semibold">
            LOGIN
          </div>
          <label
            htmlFor="username"
            className="text-md mt-7 mb-2 self-start pl-6 font-medium"
          >
            Username
          </label>
          <input
            id="username"
            maxLength={20}
            className="mb-5 h-11 w-[40vh] rounded-lg border border-black/40 bg-white pl-3 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500"
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
            placeholder="username@gmail.com"
            className="mb-5 h-11 w-[40vh] rounded-lg border border-black/40 bg-white pl-3 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500"
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
            className="mb-9 h-11 w-[40vh] rounded-lg border border-black/40 bg-white pl-3 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></input>
          <button
            value="Submit"
            type="submit"
            className="text-md h-11 w-[40vh] cursor-pointer rounded-lg border border-black/40 bg-[#1877F2] font-normal text-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            Sign up
          </button>
        </form>

        <div className="flex flex-col items-center justify-center">
          <div className="h-[45vh] w-[45vh] overflow-hidden rounded-lg border bg-[#D3DAD9]/20 backdrop-blur-sm"></div>
        </div>
      </div>
      <div className="mt-7 flex flex-col items-center justify-center">
        <div className="h-[10vh] w-[45vh] overflow-hidden rounded-lg border bg-[#D3DAD9]/20 backdrop-blur-sm">
          <p className="flex h-full items-center justify-center">
            Need account?&nbsp;
            <a href="#" className="text-[#1877F2] hover:underline">
              Register here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
