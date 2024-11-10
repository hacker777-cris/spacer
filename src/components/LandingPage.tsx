import React, { useState, useEffect } from "react";
import { Camera, Home, LogIn, Search } from "lucide-react";

export default function SpacerLandingPage() {
  const heroImages = [
    "/src/assets/spacesImages/townhouses/urbanNest.JPG",
    "/src/assets/spacesImages/teamBuildingSpaces/crewCorner.JPG",
    "/src/assets/spacesImages/gardenSpaces/bloomHaven.JPG",
    "/src/assets/spacesImages/librarySpaces/novelNook.JPG",
  ];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        prevIndex === heroImages.length - 1 ? 0 : prevIndex + 1,
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [heroImages.length]);

  return (
    <div className="bg-gray-100 text-gray-800 font-medium">
      {/* Hero Section */}
      <div className="relative py-24 px-4 text-center min-h-[600px] flex items-center justify-center">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
          style={{
            backgroundImage: `url(${heroImages[currentImageIndex]})`,
          }}
        />
        <div className="absolute inset-0 bg-black opacity-50" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 text-white">
            Find and Book Your Perfect Space Today
          </h1>
          <p className="text-lg mb-8 text-gray-200">
            Discover and list spaces for hourly or daily rentals.
          </p>
          <div className="max-w-2xl mx-auto bg-white bg-opacity-20 backdrop-blur-md rounded-lg shadow-lg p-4 flex items-center">
            <input
              type="text"
              placeholder="Enter your location"
              className="flex-1 px-4 py-3 rounded-l-lg focus:outline-none bg-transparent text-white placeholder-gray-300"
            />
            <input
              type="text"
              placeholder="Activity"
              className="flex-1 px-4 py-3 focus:outline-none bg-transparent text-white placeholder-gray-300"
            />
            <button className="bg-white text-gray-800 px-8 py-3 rounded-r-lg hover:bg-gray-200 focus:outline-none transition duration-300">
              <Search size={18} className="inline mr-2" />
              Search
            </button>
          </div>
        </div>
      </div>
      {/* Features Section */}
      <div className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-gray-800">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Find a Place
            </h3>
            <p className="text-gray-600">
              Discover spaces for hourly or daily rentals in your area.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              List Your Place
            </h3>
            <p className="text-gray-600">
              Earn money by listing your space for others to rent.
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              Hassle-free Booking
            </h3>
            <p className="text-gray-600">
              Secure your space with just a few clicks.
            </p>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <h3 className="text-xl font-bold mb-4 text-white">Contact Us</h3>
            <p className="text-gray-400">123 Main St, Anytown USA</p>
            <p className="text-gray-400">info@spacer.com</p>
          </div>
          <div className="space-x-4">
            <a href="#" className="hover:text-gray-500">
              <Camera size={24} color="white" />
            </a>
            <a href="#" className="hover:text-gray-500">
              <Home size={24} color="white" />
            </a>
            <a href="#" className="hover:text-gray-500">
              <LogIn size={24} color="white" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
