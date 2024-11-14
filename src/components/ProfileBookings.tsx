"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { ReviewModal } from "./ReviewModal";

interface Booking {
  booking_id: string;
  space: {
    space_id: string;
    name: string;
    location: string;
    type: string;
  };
  start_datetime: string;
  end_datetime: string;
  duration: string;
  total_amount: number;
  status: string;
  created_at: string;
  agreement: {
    signed: boolean;
    terms: string;
  } | null;
  payments: {
    payment_id: string;
    amount: number;
    status: string;
    payment_method: string;
    created_at: string;
  }[];
}

export default function ProfileBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  const fetchBookings = async () => {
    try {
      const accessToken = localStorage.getItem("authToken");
      const response = await axios.get(
        "http://127.0.0.1:5000/bookings/my-bookings",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setBookings(response.data.bookings);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to fetch bookings. Please try again later.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleReviewClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewModalOpen(true);
  };

  const handleReviewSubmitted = () => {
    fetchBookings(); // Refresh bookings after submitting a review
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>My Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p>You have no bookings yet.</p>
        ) : (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <Card key={booking.booking_id}>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold mb-2">
                    {booking.space.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">
                    {booking.space.location}
                  </p>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">
                      {new Date(booking.start_datetime).toLocaleString()} -{" "}
                      {new Date(booking.end_datetime).toLocaleString()}
                    </span>
                    <Badge
                      variant={
                        booking.status === "confirmed" ? "default" : "secondary"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                  <p className="text-sm mb-2">Duration: {booking.duration}</p>
                  <p className="font-semibold">
                    Total: ${booking.total_amount.toFixed(2)}
                  </p>
                  {booking.agreement && (
                    <p className="text-sm mt-2">
                      Agreement:{" "}
                      {booking.agreement.signed ? "Signed" : "Not signed"}
                    </p>
                  )}
                  {booking.payments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold mb-2">Payments:</h4>
                      {booking.payments.map((payment) => (
                        <div key={payment.payment_id} className="text-sm">
                          <span>
                            {payment.payment_method}: $
                            {payment.amount.toFixed(2)}
                          </span>
                          <Badge
                            variant={
                              payment.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className="ml-2"
                          >
                            {payment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  {booking.status === "confirmed" && (
                    <Button
                      onClick={() => handleReviewClick(booking)}
                      className="mt-4"
                      variant="outline"
                    >
                      Leave a Review
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
      {selectedBooking && (
        <ReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          spaceId={selectedBooking.space.space_id}
          spaceName={selectedBooking.space.name}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </Card>
  );
}
