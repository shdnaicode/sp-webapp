import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Modal from "../../../components/modal";
import { useAuth } from "../../../context/AuthContext";

function Login() {
	const GITHUB_OAUTH_URL = import.meta.env.VITE_GITHUB_OAUTH_URL || "/api/oauth/github";
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();
	const { login } = useAuth();

	const [errorMsg, setErrorMsg] = useState("");
	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);
			await login(email, password);
			navigate("/");
		} catch (err) {
			console.error("Login error", err);
			setErrorMsg(err.message || "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const handleGitHubLogin = () => {
		try {
			window.location.href = GITHUB_OAUTH_URL;
		} catch (e) {
			console.error("GitHub login redirect failed", e);
		}
	};
	return (
		<div className="flex h-screen flex-col items-center justify-center">
			<div className="h-[52vh] w-[45vh] overflow-hidden nb-card">
				<form onSubmit={handleSubmit} className="flex h-full flex-col items-center">
					<div className="flex w-full justify-center pt-7 text-2xl font-semibold">
						LOGIN
					</div>

					<label
						htmlFor="email"
						className="text-md mt-7 mb-2 self-start pl-6 font-medium"
					>
						Email address
					</label>
					<input
						id="email"
						type="email"
						maxLength={30}
						placeholder="username@gmail.com"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
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
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="mb-9 h-11 w-[40vh] border-2 bg-white pl-3 text-sm font-normal outline-none focus:ring-2 focus:ring-blue-500"
						required
					></input>
					<button
						value="Submit"
						type="submit"
						disabled={loading}
						className="text-md h-11 w-[40vh] cursor-pointer nb-button-primary font-medium text-white outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
					>
						{loading ? "Logging in..." : "Login"}
					</button>

					<span className="mt-8 w-[80%] border-t-2 opacity-15"></span>
					<button
						type="button"
						onClick={handleGitHubLogin}
						disabled={loading}
						className="mt-8 h-11 w-[40vh] cursor-pointer rounded-md border-2 bg-black px-4 text-sm font-medium text-white outline-none hover:opacity-90 focus:ring-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
						aria-label="Continue with GitHub"
					>
						<span className="inline-flex items-center gap-2">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
								<path fillRule="evenodd" d="M12 .5C5.648.5.5 5.648.5 12c0 5.088 3.292 9.4 7.865 10.92.575.104.786-.25.786-.557 0-.275-.01-1.004-.016-1.972-3.2.695-3.875-1.543-3.875-1.543-.523-1.33-1.278-1.685-1.278-1.685-1.044-.714.079-.699.079-.699 1.154.081 1.762 1.186 1.762 1.186 1.027 1.76 2.695 1.252 3.35.957.104-.744.401-1.252.73-1.54-2.555-.291-5.243-1.278-5.243-5.684 0-1.255.448-2.28 1.184-3.085-.119-.29-.513-1.463.112-3.05 0 0 .967-.31 3.166 1.18a10.98 10.98 0 0 1 2.883-.388c.979.005 1.966.132 2.884.388 2.198-1.49 3.164-1.18 3.164-1.18.627 1.587.233 2.76.114 3.05.737.805 1.183 1.83 1.183 3.085 0 4.416-2.693 5.39-5.256 5.676.412.353.78 1.046.78 2.108 0 1.522-.014 2.748-.014 3.123 0 .309.208.668.793.554C20.212 21.396 23.5 17.087 23.5 12 23.5 5.648 18.352.5 12 .5Z" clipRule="evenodd" />
							</svg>
							<span>Continue with GitHub</span>
						</span>
					</button>
				</form>
			</div>
			<div className="mt-7 flex flex-col items-center justify-center">
				<div className="h-[10vh] w-[45vh] overflow-hidden nb-card">
					<p className="flex h-full items-center justify-center">
						Need account?&nbsp;
						<Link to="/register" className="text-[#1877F2] hover:underline">
							Register here
						</Link>
					</p>
				</div>
			</div>
			<Modal
				open={!!errorMsg}
				title="Login error"
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

export default Login;

