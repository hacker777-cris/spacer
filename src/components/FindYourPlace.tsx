import React, { useState } from "react";
import { Search, Filter } from "lucide-react";

type SpaceType =
  | "teamBuilding"
  | "workout"
  | "garden"
  | "library"
  | "photography"
  | "townHouse";

interface Space {
  id: number;
  name: string;
  type: SpaceType;
  image: string;
  price: number;
  rating: number;
}

const spaceTypes: { [key in SpaceType]: string } = {
  teamBuilding: "Team Building",
  workout: "Workout",
  garden: "Garden",
  library: "Library",
  photography: "Photography",
  townHouse: "Town House",
};

const spaces: Space[] = [
  {
    id: 1,
    name: "Crew Corner",
    type: "teamBuilding",
    image: "/src/assets/spacesImages/teamBuildingSpaces/crewCorner.JPG",
    price: 50,
    rating: 4.5,
  },
  {
    id: 2,
    name: "Flex Zone",
    type: "workout",
    image: "/src/assets/spacesImages/workoutSpaces/flexZone.JPG",
    price: 30,
    rating: 4.2,
  },
  {
    id: 3,
    name: "Bloom Haven",
    type: "garden",
    image: "/src/assets/spacesImages/gardenSpaces/bloomHaven.JPG",
    price: 40,
    rating: 4.8,
  },
  {
    id: 4,
    name: "Novel Nook",
    type: "library",
    image: "/src/assets/spacesImages/librarySpaces/novelNook.JPG",
    price: 25,
    rating: 4.6,
  },
  {
    id: 5,
    name: "Shutter Studio",
    type: "photography",
    image: "/src/assets/spacesImages/photographyaStudios/timelessClicks.JPG",
    price: 60,
    rating: 4.7,
  },
  {
    id: 6,
    name: "Urban Nest",
    type: "townHouse",
    image: "/src/assets/spacesImages/townhouses/urbanNest.JPG",
    price: 100,
    rating: 4.9,
  },
  // Add more spaces as needed
];

export default function FindYourPlace() {
  const [selectedTypes, setSelectedTypes] = useState<SpaceType[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const spacesPerPage = 6;

  const filteredSpaces = spaces.filter(
    (space) =>
      (selectedTypes.length === 0 || selectedTypes.includes(space.type)) &&
      space.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const indexOfLastSpace = currentPage * spacesPerPage;
  const indexOfFirstSpace = indexOfLastSpace - spacesPerPage;
  const currentSpaces = filteredSpaces.slice(
    indexOfFirstSpace,
    indexOfLastSpace,
  );

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const toggleSpaceType = (type: SpaceType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-4 text-gray-800">
          Find Your Perfect Space
        </h1>
        <p className="text-lg mb-8 text-gray-600">
          Explore our curated selection of unique spaces for every need.
        </p>

        <div className="mb-8 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search spaces..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search
                className="absolute right-3 top-2.5 text-gray-400"
                size={20}
              />
            </div>
          </div>
          <div className="flex-1 min-w-[300px]">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <div className="flex items-center mb-2">
                <Filter size={20} className="mr-2 text-gray-600" />
                <span className="font-semibold text-gray-800">
                  Filter by Space Type:
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(spaceTypes).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => toggleSpaceType(key as SpaceType)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTypes.includes(key as SpaceType)
                        ? "bg-gray-800 text-white"
                        : "bg-gray-200 text-gray-800"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentSpaces.map((space) => (
            <div
              key={space.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <img
                src={space.image}
                alt={space.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2 text-gray-800">
                  {space.name}
                </h3>
                <p className="text-gray-600 mb-2">{spaceTypes[space.type]}</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-bold">
                    ${space.price}/hour
                  </span>
                  <span className="text-yellow-500">
                    ★ {space.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSpaces.length > spacesPerPage && (
          <div className="mt-8 flex justify-center">
            {Array.from(
              { length: Math.ceil(filteredSpaces.length / spacesPerPage) },
              (_, i) => (
                <button
                  key={i}
                  onClick={() => paginate(i + 1)}
                  className={`mx-1 px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? "bg-gray-800 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {i + 1}
                </button>
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}
