import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { apiFetch } from "../../../lib/api";
import Navbar from "../../../components/navbar";
import Footer from "../../../components/footer";

const sampleCourses = [
	{
		id: 1,
		title: "Intro to Robotics",
		description: "Foundations of robotics, types of robot, and control.",
		level: "Beginner",
		category: "Fundamentals",
		tags: ["types", "math"],
	},
	{
		id: 2,
		title: "Arduino Basics",
		description: "Microcontrollers, I/O, and embedded programming.",
		level: "Beginner",
		category: "Embedded",
		tags: ["arduino", "c++"],
	},
	{
		id: 3,
		title: "Sensors & Actuators",
		description: "Work with IMUs, IR, ultrasonic sensors, and motors.",
		level: "Intermediate",
		category: "Hardware",
		tags: ["sensors", "motors"],
	},
	{
		id: 4,
		title: "Computer Vision",
		description: "Basics of vision, OpenCV, and object tracking.",
		level: "Intermediate",
		category: "Perception",
		tags: ["opencv", "vision"],
	},
	{
		id: 5,
		title: "ROS Fundamentals",
		description: "Nodes, topics, and packages to build robot apps.",
		level: "Advanced",
		category: "Software",
		tags: ["ros", "python"],
	},
];

function Badge({ children }) {
	return (
		<span className="rounded bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-700">
			{children}
		</span>
	);
}

function CourseCard({ course, enrolled, onEnroll }) {
	const navigate = useNavigate();
	return (
	<div className="flex h-full flex-col justify-between nb-card p-4">
			<div>
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold">{course.title}</h3>
					<Badge>{course.level}</Badge>
				</div>
				<p className="mt-2 text-sm text-gray-700">{course.description}</p>
			</div>
			<div className="mt-3 flex items-center justify-between">
				<div className="flex flex-wrap gap-2 text-xs text-gray-600">
					<Badge>{course.category}</Badge>
					{course.tags.map((t) => (
						<span key={t} className="rounded-full border px-2 py-0.5">
							{t}
						</span>
					))}
				</div>
				<div className="flex items-center gap-2">
					<button
						className="rounded-md border-2 px-3 py-1 text-sm hover:bg-gray-50 nb-button"
						onClick={() => {
							switch (course.title) {
								case "Intro to Robotics":
									navigate("/courses/intro-to-robotics");
									break;
								case "Arduino Basics":
									navigate("/courses/arduino-basics");
									break;
								case "Sensors & Actuators":
									navigate("/courses/sensors-and-actuators");
									break;
								case "Computer Vision":
									navigate("/courses/computer-vision");
									break;
								case "ROS Fundamentals":
									navigate("/courses/ros-fundamentals");
									break;
								default:
									break;
							}
						}}
					>
						View
					</button>
					<button
						className="rounded-md nb-button-primary px-3 py-1 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
						onClick={() => onEnroll(course.id)}
						disabled={enrolled}
						title={enrolled ? "Already enrolled" : "Enroll in this course"}
					>
						{enrolled ? "Enrolled" : "Enroll"}
					</button>
				</div>
			</div>
		</div>
	);
}

function Browse() {
	const { token } = useAuth();
	const [q, setQ] = useState("");
	const [level, setLevel] = useState("All");
	const [category, setCategory] = useState("All");
	const [enrolledIds, setEnrolledIds] = useState([]);

	const toSlug = (title) => {
		switch (title) {
			case "Intro to Robotics": return "intro-to-robotics";
			case "Arduino Basics": return "arduino-basics";
			case "Sensors & Actuators": return "sensors-and-actuators";
			case "Computer Vision": return "computer-vision";
			case "ROS Fundamentals": return "ros-fundamentals";
			default: return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
		}
	};

	useEffect(() => {
		let aborted = false;
		async function load() {
			try {
				const res = await apiFetch("/api/progress", { headers: { Authorization: `Bearer ${token}` } });
				if (!res.ok) return;
				const data = await res.json();
				if (!aborted) {
					const current = Array.isArray(data?.currentCourses) ? data.currentCourses : [];
					const ids = sampleCourses.filter(c => current.includes(toSlug(c.title))).map(c => c.id);
					setEnrolledIds(ids);
				}
			} catch {}
		}
		if (token) load();
		return () => { aborted = true; };
	}, [token]);

	const handleEnroll = async (id) => {
		const course = sampleCourses.find(c => c.id === id);
		if (!course) return;
		try {
			const res = await apiFetch("/api/progress/enroll", {
				method: "POST",
				headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
				body: JSON.stringify({ course: toSlug(course.title) }),
			});
			if (res.ok) setEnrolledIds(prev => prev.includes(id) ? prev : [...prev, id]);
		} catch {}
	};

	const filtered = useMemo(() => {
		const term = q.trim().toLowerCase();
		return sampleCourses.filter((c) => {
			const matchesTerm = !term
				|| c.title.toLowerCase().includes(term)
				|| c.description.toLowerCase().includes(term)
				|| c.tags.some((t) => t.toLowerCase().includes(term));
			const matchesLevel = level === "All" || c.level === level;
			const matchesCategory = category === "All" || c.category === category;
			return matchesTerm && matchesLevel && matchesCategory;
		});
	}, [q, level, category]);

	return (
		<div className="min-h-screen flex flex-col">
			<Navbar />
			<div className="p-6 flex-1">
				<div className="min-h-[60vh] nb-card p-6">
					<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<h1 className="text-2xl font-semibold">Courses</h1>
							<p className="text-sm text-gray-600">Find robotics courses and start learning.</p>
						</div>
						<div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
							<input
								type="text"
								value={q}
								onChange={(e) => setQ(e.target.value)}
								placeholder="Search courses"
								className="h-10 w-full rounded-md border-2 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 md:w-72"
							/>
							<select
								value={level}
								onChange={(e) => setLevel(e.target.value)}
								className="h-10 rounded-md border-2 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option>All</option>
								<option>Beginner</option>
								<option>Intermediate</option>
								<option>Advanced</option>
							</select>
							<select
								value={category}
								onChange={(e) => setCategory(e.target.value)}
								className="h-10 rounded-md border-2 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-500"
							>
								<option>All</option>
								<option>Fundamentals</option>
								<option>Embedded</option>
								<option>Hardware</option>
								<option>Perception</option>
								<option>Software</option>
							</select>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{filtered.map((c) => (
							<CourseCard key={c.id} course={c} enrolled={enrolledIds.includes(c.id)} onEnroll={handleEnroll} />
						))}
						{filtered.length === 0 && (
							<div className="col-span-full nb-card p-6 text-center text-sm text-gray-600">
								No courses match your filters.
							</div>
						)}
					</div>
				</div>
			</div>
			<Footer />
		</div>
	);
}

export default Browse;
