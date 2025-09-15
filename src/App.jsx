import { Route, Routes, BrowserRouter } from "react-router-dom";
import "./App.css";
import Register from "./pages/register";
import Login from "./pages/login";
import Home from "./pages/home";

function App() {
  return (
    <Routes>
      <Route path="/" element={< Home/>} />
      <Route path="/Register" element={< Register/>} />
      <Route path="/Login" element={< Login/>} />
    </Routes>
  );
}

export default App;
