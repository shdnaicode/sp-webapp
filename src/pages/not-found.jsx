import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-xl nb-card p-8 text-center">
          <div className="text-6xl font-bold">404</div>
          <div className="mt-2 text-lg font-medium">Page not found</div>
          <p className="mt-2 text-sm text-gray-600">
            The page you’re looking for doesn’t exist or may have moved.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link className="nb-button px-4 py-2 rounded-md border-2" to="/">
              Go to Dashboard
            </Link>
            <Link className="nb-button-primary px-4 py-2 rounded-md text-white" to="/browse">
              Browse Courses
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
