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
import "./index.css";

const NavigationContent = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("authToken") !== null;

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          SPACER
        </Link>
        <ul className="flex space-x-4">
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
          <li>
            {isAuthenticated ? (
              <button onClick={handleLogout} className="hover:text-gray-300">
                Logout
              </button>
            ) : (
              <Link to="/login" className="hover:text-gray-300">
                Login
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
};

function App() {
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
              <Route path="/FindYourPlace" element={<FindYourPlace />} />
              <Route path="/AddYourSpace" element={<AddYourSpace />} />
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
