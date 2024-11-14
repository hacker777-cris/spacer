import React, { useState, useEffect } from "react";
import { Search, Filter } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import BookingSuccess from "./BookingConfirm";

import { Button } from "@/components/ui/button";
import { PaymentModal } from "@/components/PaymentModal";
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
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [verificationResponse, setVerificationResponse] = useState<{
    message: string;
    payment_id: string;
  } | null>(null);
  const [bookingStartDate, setBookingStartDate] = useState<string>("");
  const [bookingEndDate, setBookingEndDate] = useState<string>("");
  const [isProcessingPayment, setIsProcessingPayment] =
    useState<boolean>(false);
  const [dateError, setDateError] = useState<string>("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchSpaces();
  }, [currentPage]);

  useEffect(() => {
    // Get both reference and bookingId from URL params
    const reference = searchParams.get("reference");
    const urlBookingId = searchParams.get("bookingId");

    if (reference && urlBookingId) {
      handlePaymentVerification(urlBookingId);
    }
  }, [searchParams]);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startDate = new Date(e.target.value);
    const now = new Date();

    if (startDate < now) {
      setDateError("Start date cannot be in the past");
      setBookingStartDate("");
      return;
    }

    setDateError("");
    setBookingStartDate(e.target.value);

    // Clear end date if it's before the new start date
    if (bookingEndDate && new Date(bookingEndDate) <= startDate) {
      setBookingEndDate("");
    }
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const endDate = new Date(e.target.value);
    const startDate = new Date(bookingStartDate);

    if (endDate <= startDate) {
      setDateError("End date must be after start date");
      setBookingEndDate("");
      return;
    }

    setDateError("");
    setBookingEndDate(e.target.value);
  };

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
    setBookingStartDate("");
    setBookingEndDate("");
    setDateError("");
  };

  const createBooking = async (): Promise<BookingResponse> => {
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
      }),
    });

    const data = await response.json();

    if (response.status === 201) {
      return data as BookingResponse;
    }

    throw new Error(data.message || "Failed to create booking");
  };
  const handlePaymentInitiation = async () => {
    try {
      setIsProcessingPayment(true);
      const bookingResponse = await createBooking();
      setBookingId(bookingResponse.booking_id);
      setShowPaymentModal(true);
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("There was an error creating your booking. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    console.log("Payment successful", reference);
    if (bookingId) {
      console.log(bookingId);
      // Pass the stored bookingId, not the reference
      await handlePaymentVerification(bookingId);
    } else {
      console.error("No booking ID found");
      alert("There was an error processing your payment. Please try again.");
    }
  };

  const verifyPaystackPayment = async (bookingId: string): Promise<boolean> => {
    try {
      const accessToken = localStorage.getItem("authToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await fetch(
        `http://127.0.0.1:5000/bookings/${bookingId}/verify`,
        {
          method: "POST",
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
      setVerificationResponse(data);
      return data.message === "Booking verified successfully";
    } catch (error) {
      console.error("Error verifying payment:", error);
      return false;
    }
  };

  const handlePaymentVerification = async (bookingId: string) => {
    try {
      const isVerified = await verifyPaystackPayment(bookingId);

      if (!isVerified) {
        throw new Error("Payment verification failed");
      }

      alert("Payment verified! Your booking has been confirmed.");
      closeModal();
      navigate("/Profile", { replace: true });
    } catch (error) {
      console.error("Error verifying payment:", error);
      alert(
        "There was an error verifying your payment. Please contact support.",
      );
    } finally {
      setIsProcessingPayment(false);
      setBookingId(null);
      setShowPaymentModal(false);
    }
  };

  const handlePaymentClose = () => {
    console.log("Payment closed");
    setIsProcessingPayment(false);
    setShowPaymentModal(false);
    setBookingId(null);
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
                    ★ {Number(space.average_rating).toFixed(1)}
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
        {showSuccessMessage && (
          <BookingSuccess onAnimationEnd={() => setShowSuccessMessage(false)} />
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedSpace?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
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
                    min={getMinDateTime()}
                    onChange={handleStartDateChange}
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
                    min={bookingStartDate || getMinDateTime()}
                    onChange={handleEndDateChange}
                    disabled={!bookingStartDate}
                  />
                </div>

                {dateError && (
                  <p className="text-red-500 text-sm mt-2">{dateError}</p>
                )}
              </div>

              {selectedSpace && !showPaymentModal && (
                <Button
                  onClick={handlePaymentInitiation}
                  disabled={
                    isProcessingPayment || !bookingStartDate || !bookingEndDate
                  }
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  {isProcessingPayment ? "Processing..." : "Book Now"}
                </Button>
              )}
              {showPaymentModal && bookingId && (
                <PaymentModal
                  amount={selectedSpace?.hourly_rate || 0}
                  email="user@example.com"
                  reference={`ref_${new Date().getTime()}`}
                  onSuccess={handlePaymentSuccess}
                  onClose={handlePaymentClose}
                  isProcessing={isProcessingPayment}
                  bookingId={bookingId}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
