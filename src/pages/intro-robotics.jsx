import Navbar from "../components/navbar";
import Footer from "../components/footer";

export default function IntroRobotics() {
  const modules = [
    { title: "What is a Robot?", topics: ["Definition & history", "Robot components", "Real-world applications"] },
    { title: "Types of Robot", topics: ["Industrial arms", "Mobile robots & drones", "Humanoids & service robots"] },
  { title: "Uses of Robots", topics: ["Manufacturing & logistics", "Healthcare & service", "Exploration & daily life"] },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="p-6 flex-1">
  <div className="mx-auto max-w-4xl nb-card p-6">
          <h1 className="text-2xl font-semibold">Intro to Robotics</h1>
          <p className="mt-1 text-sm text-gray-600">Course syllabus overview</p>
          <div className="mt-6 space-y-4">
            {modules.map((m, i) => (
              <div key={m.title} className="rounded-md border p-4 nb-card">
                <div className="font-medium">Module {i + 1}: {m.title}</div>
                <ul className="mt-2 list-disc pl-6 text-sm text-gray-700">
                  {m.topics.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
