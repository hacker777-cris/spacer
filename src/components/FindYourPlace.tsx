import React, { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { usePaystackPayment } from "react-paystack";
import { useSearchParams, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Space {
  space_id: string;
  name: string;
  description: string;
  location: string;
  hourly_rate: number;
  day_rate: number;
  capacity: number;
  status: string;
  images: { image_id: string; url: string }[];
  average_rating: number;
  type: string;
}

interface SpacesResponse {
  spaces: Space[];
  total: number;
  pages: number;
  current_page: number;
}
interface BookingResponse {
  message: string;
  booking_id: string;
  total_amount: number;
}

const spaceTypes = {
  teamBuilding: "Team Building",
  workout: "Workout",
  garden: "Garden",
  library: "Library",
  photography: "Photography",
  townHouse: "Town House",
};

export default function FindYourPlace() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingStartDate, setBookingStartDate] = useState<string>("");
  const [bookingEndDate, setBookingEndDate] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Initialize Paystack payment hook outside of the handler
  const initializePayment = usePaystackPayment({
    publicKey: "pk_test_2d8962ca7e712f2b8d07d539d8d3cbee704f025c",
    currency: "KES",
    amount: 0, // Will be updated when booking
    email: "", // Will be updated when booking
    reference: "", // Will be updated when booking
    callback_url: "", // Will be updated when booking
  });

  useEffect(() => {
    fetchSpaces();
  }, [currentPage]);

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (reference) {
      handlePaymentVerification(reference);
      navigate("/", { replace: true });
    }
  }, [searchParams]);

  const fetchSpaces = async () => {
    setIsLoading(true);
    setError(null);
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      setError("No access token found. Please log in.");
      setIsLoading(false);
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        per_page: "6",
      });

      const response = await fetch(
        `http://127.0.0.1:5000/spaces?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch spaces");
      }

      const data: SpacesResponse = await response.json();
      setSpaces(data.spaces);
      setTotalPages(data.pages);
    } catch (err) {
      setError("Error fetching spaces. Please try again later.");
      console.error("Error fetching spaces:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpaceType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const filteredSpaces = spaces.filter((space) => {
    const matchesSearch =
      space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      space.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(space.type);
    return matchesSearch && matchesType;
  });

  const openModal = (space: Space) => {
    setSelectedSpace(space);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedSpace(null);
    setIsModalOpen(false);
  };

  const handleBookNow = async () => {
    if (!selectedSpace) return;

    try {
      setIsProcessingPayment(true);

      if (!bookingStartDate || !bookingEndDate) {
        throw new Error("Please select booking start and end times");
      }

      const userEmail = "user@example.com"; // Should be actual user's email
      const reference = `ref_${new Date().getTime()}`;

      // Create booking first and get the total amount
      const bookingResponse = await createBooking(reference);

      // Create config object with required values using the total_amount from booking
      const config = {
        reference,
        email: userEmail,
        amount: bookingResponse.total_amount * 100, // Convert to cents/smallest currency unit
        publicKey: "pk_test_2d8962ca7e712f2b8d07d539d8d3cbee704f025c",
        currency: "KES",
        callback_url: `http://localhost:5173?reference=${reference}`,
      };

      // Initialize payment hook with config
      const initializePaystack = usePaystackPayment(config);

      // Call initialize with the onSuccess callback
      initializePaystack(() => {
        closeModal();
        console.log(
          "Payment successful for booking:",
          bookingResponse.booking_id,
        );
      });
    } catch (error) {
      console.error("Error during booking process:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create booking. Please try again.",
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const verifyPaystackPayment = async (reference: string): Promise<boolean> => {
    try {
      const accessToken = localStorage.getItem("authToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        `http://127.0.0.1:5000/verify-payment/${reference}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to verify payment");
      }

      const data = await response.json();
      return data.status === "success";
    } catch (error) {
      console.error("Error verifying payment:", error);
      return false;
    }
  };

  const handlePaymentVerification = async (reference: string) => {
    setIsProcessingPayment(true);
    try {
      const isVerified = await verifyPaystackPayment(reference);

      if (!isVerified) {
        throw new Error("Payment verification failed");
      }

      await createBooking(reference);
      alert("Payment verified! Your booking has been confirmed.");
    } catch (error) {
      console.error("Error verifying payment:", error);
      alert(
        "There was an error verifying your payment. Please contact support.",
      );
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const createBooking = async (reference: string): Promise<BookingResponse> => {
    const accessToken = localStorage.getItem("authToken");
    if (!accessToken) {
      throw new Error("No access token found");
    }

    if (!bookingStartDate || !bookingEndDate) {
      throw new Error("Please select booking start and end times");
    }

    const response = await fetch("http://127.0.0.1:5000/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        space_id: selectedSpace?.space_id,
        start_datetime: bookingStartDate,
        end_datetime: bookingEndDate,
        payment_reference: reference,
      }),
    });

    const data = await response.json();

    if (response.status === 201) {
      return data as BookingResponse;
    }

    throw new Error(data.message || "Failed to create booking");
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
                    onClick={() => toggleSpaceType(key)}
                    className={`px-3 py-1 rounded-full text-sm ${
                      selectedTypes.includes(key)
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

        {isLoading && <p className="text-center">Loading spaces...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSpaces.map((space) => (
            <div
              key={space.space_id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
              onClick={() => openModal(space)}
            >
              <img
                src={
                  space.images[0]?.url
                    ? `http://localhost:5000${space.images[0]?.url}`
                    : "/placeholder.svg"
                }
                alt={space.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-xl font-bold mb-2 text-gray-800">
                  {space.name}
                </h3>
                <p className="text-gray-600 mb-2">{space.location}</p>
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-bold">
                    ${space.hourly_rate}/hour
                  </span>
                  <span className="text-yellow-500">
                    ★ {space.average_rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`mx-1 px-3 py-1 rounded ${
                  currentPage === i + 1
                    ? "bg-gray-800 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedSpace?.name}</DialogTitle>
              <DialogDescription>
                {selectedSpace?.description}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <p className="text-gray-600 mb-2">{selectedSpace?.location}</p>
              <p className="text-gray-800 font-bold mb-2">
                ${selectedSpace?.hourly_rate}/hour
              </p>
              <p className="text-gray-600 mb-4">
                Capacity: {selectedSpace?.capacity} people
              </p>

              <div className="space-y-4 mb-4">
                <div>
                  <label
                    htmlFor="start-time"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    id="start-time"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                    value={bookingStartDate}
                    onChange={(e) => setBookingStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="end-time"
                    className="block text-sm font-medium text-gray-700"
                  >
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    id="end-time"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                    value={bookingEndDate}
                    onChange={(e) => setBookingEndDate(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleBookNow}
                disabled={
                  isProcessingPayment || !bookingStartDate || !bookingEndDate
                }
              >
                {isProcessingPayment ? "Processing Payment..." : "Book Now"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
