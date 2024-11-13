import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./components/store";
import LandingPage from "./components/LandingPage";
import AuthScreen from "./components/AuthScreen";
import AboutUs from "./components/AboutUs";
import FindYourPlace from "./components/FindYourPlace";
import AddYourSpace from "./components/AddYourSpace";
import AdminPanel from "./components/AdminPanel";
import ProfileComponent from "./components/ProfilePage";
import "./index.css";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

const NavigationContent = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("authToken") !== null;
  const userType = localStorage.getItem("userType");

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userType");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          SPACER
        </Link>
        <ul className="flex space-x-4 items-center">
          <li>
            <Link to="/" className="hover:text-gray-300">
              Home
            </Link>
          </li>
          <li>
            <Link to="/about" className="hover:text-gray-300">
              About Us
            </Link>
          </li>
          {isAuthenticated && (
            <>
              <li>
                <Link to="/FindYourPlace" className="hover:text-gray-300">
                  Find a Place
                </Link>
              </li>
              <li>
                <Link to="/AddYourSpace" className="hover:text-gray-300">
                  List Your Place
                </Link>
              </li>
              {userType === "Admin" && (
                <li>
                  <Link to="/admin-panel" className="hover:text-gray-300">
                    Admin Panel
                  </Link>
                </li>
              )}
            </>
          )}
          <li>
            {isAuthenticated ? (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="hover:text-gray-300"
              >
                Logout
              </Button>
            ) : (
              <Link to="/login" className="hover:text-gray-300">
                Login
              </Link>
            )}
          </li>
          {isAuthenticated && (
            <li>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => navigate("/Profile")}
              >
                <Avatar>
                  <AvatarImage src="/placeholder-avatar.jpg" alt="Profile" />
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
};

function App() {
  const isAuthenticated = localStorage.getItem("authToken") !== null;

  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <NavigationContent />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<AuthScreen />} />
              <Route path="/about" element={<AboutUs />} />
              {isAuthenticated && (
                <>
                  <Route path="/FindYourPlace" element={<FindYourPlace />} />
                  <Route path="/AddYourSpace" element={<AddYourSpace />} />
                  <Route path="/Profile" element={<ProfileComponent />} />

                  <Route path="/admin-panel" element={<AdminPanel />} />
                </>
              )}
            </Routes>
          </main>
          <footer className="bg-gray-800 text-white p-4 mt-auto">
            <div className="container mx-auto text-center">
              <p>&copy; 2023 Spacer. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
