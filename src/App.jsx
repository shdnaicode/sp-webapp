import { Routes, Route, Navigate } from "react-router-dom";
import Register from "./pages/register";
import Login from "./pages/login";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Progress from "./pages/progress";
import Chatbot from "./pages/chatbot";
import Project from "./pages/project";
import ProjectView from "./pages/project-view";
import Browse from "./pages/browse";
import IntroRobotics from "./pages/intro-robotics";
import ArduinoBasics from "./pages/arduino-basics";
import SensorsActuators from "./pages/sensors-actuators";
import ComputerVision from "./pages/computer-vision";
import ROSFundamentals from "./pages/ros-fundamentals";
import Settings from "./pages/settings";
import LearnCourse from "./pages/learn-course";
import Profile from "./pages/profile";
import AdminQuizzes from "./pages/admin-quizzes";
import AdminCourses from "./pages/admin-courses";
import NotFound from "./pages/not-found";
import "./App.css";
import { AuthProvider, useAuth } from "./context/AuthContext";

function Protected({ element }) {
  const { user, initializing } = useAuth();
  if (initializing) return null; // or a loader
  return user ? element : <Navigate to="/register" replace />;
}

function PublicOnly({ element }) {
  const { user, initializing } = useAuth();
  if (initializing) return null;
  return user ? <Navigate to="/" replace /> : element;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route>
          <Route path="/register" element={<PublicOnly element={<Register />} />} />
          <Route path="/login" element={<PublicOnly element={<Login />} />} />
          <Route path="/browse" element={<Protected element={<Browse />} />} />
          <Route path="/courses/intro-to-robotics" element={<Protected element={<IntroRobotics />} />} />
          <Route path="/courses/arduino-basics" element={<Protected element={<ArduinoBasics />} />} />
          <Route path="/courses/sensors-and-actuators" element={<Protected element={<SensorsActuators />} />} />
          <Route path="/courses/computer-vision" element={<Protected element={<ComputerVision />} />} />
          <Route path="/courses/ros-fundamentals" element={<Protected element={<ROSFundamentals />} />} />
          <Route path="/chatbot" element={<Protected element={<Chatbot />} />} />
          <Route path="/profile" element={<Protected element={<Profile />} />} />
          <Route path="/settings" element={<Protected element={<Settings />} />} />
          <Route path="/learn/:slug" element={<Protected element={<LearnCourse />} />} />
          <Route path="/admin/quizzes" element={<Protected element={<AdminQuizzes />} />} />
          <Route path="/admin/courses" element={<Protected element={<AdminCourses />} />} />
        </Route>

        <Route path="/" element={<Protected element={<Home />} />} >
          <Route index element={<Dashboard />} />
          <Route path="progress" element={<Progress />} />
          <Route path="project" element={<Project />} />
          <Route path="project/:id" element={<ProjectView />} />
        </Route>
      </Routes>
      {/* Catch-all 404 route */}
      <Routes>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;




// function App() {
//   return (
//     <Routes>
//       <Route>
//         <Route path="/" element={<Register />} />
//         <Route path="/login" element={<Login />} />
//       </Route>

//       <Route path="/home" element={<Home />}>
//         <Route index element={<Dashboard />} />
//         <Route path="progress" element={<Progress />} />
//         <Route path="project" element={<Project />} />
//       </Route>
//     </Routes>
//   );
// }