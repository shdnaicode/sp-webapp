import { Routes, Route } from "react-router-dom";
import Register from "./pages/register";
import Login from "./pages/login";
import Home from "./pages/home";
import Dashboard from "./pages/dashboard";
import Progress from "./pages/progress";
import Project from "./pages/project";
import "./App.css"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Register />} />
      <Route path="/Login" element={<Login />} />

      <Route path="/home" element={<Home />}>
        <Route index element={<Dashboard />} />
        <Route path="progress" element={<Progress />} />
        <Route path="project" element={<Project />} />
      </Route>
    </Routes>
  );
}

export default App;
