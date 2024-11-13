import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Booking = {
  booking_id: string;
  user: {
    user_id: string;
    username: string;
    email: string;
  };
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
};

export default function BookingsSection() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const accessToken = localStorage.getItem("authToken");
      const response = await axios.get("http://127.0.0.1:5000/admin/bookings", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      setBookings(response.data.bookings);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bookings</CardTitle>
        <CardDescription>Manage your bookings here.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Space</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.booking_id}>
                  <TableCell>{booking.booking_id}</TableCell>
                  <TableCell>{booking.user.username}</TableCell>
                  <TableCell>{booking.space.name}</TableCell>
                  <TableCell>
                    {new Date(booking.start_datetime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {new Date(booking.end_datetime).toLocaleString()}
                  </TableCell>
                  <TableCell>{booking.status}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Booking Details</DialogTitle>
                          <DialogDescription>
                            Detailed information about the booking.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedBooking && (
                          <div className="grid gap-4">
                            <div>
                              <strong>Booking ID:</strong>{" "}
                              {selectedBooking.booking_id}
                            </div>
                            <div>
                              <strong>User:</strong>{" "}
                              {selectedBooking.user.username} (
                              {selectedBooking.user.email})
                            </div>
                            <div>
                              <strong>Space:</strong>{" "}
                              {selectedBooking.space.name} (
                              {selectedBooking.space.location})
                            </div>
                            <div>
                              <strong>Start:</strong>{" "}
                              {new Date(
                                selectedBooking.start_datetime,
                              ).toLocaleString()}
                            </div>
                            <div>
                              <strong>End:</strong>{" "}
                              {new Date(
                                selectedBooking.end_datetime,
                              ).toLocaleString()}
                            </div>
                            <div>
                              <strong>Duration:</strong>{" "}
                              {selectedBooking.duration}
                            </div>
                            <div>
                              <strong>Total Amount:</strong> $
                              {selectedBooking.total_amount.toFixed(2)}
                            </div>
                            <div>
                              <strong>Status:</strong> {selectedBooking.status}
                            </div>
                            <div>
                              <strong>Created At:</strong>{" "}
                              {new Date(
                                selectedBooking.created_at,
                              ).toLocaleString()}
                            </div>
                            <div>
                              <strong>Agreement:</strong>{" "}
                              {selectedBooking.agreement
                                ? selectedBooking.agreement.signed
                                  ? "Signed"
                                  : "Not Signed"
                                : "No Agreement"}
                            </div>
                            <div>
                              <strong>Payments:</strong>
                              <ul>
                                {selectedBooking.payments.map((payment) => (
                                  <li key={payment.payment_id}>
                                    ${payment.amount.toFixed(2)} -{" "}
                                    {payment.status} ({payment.payment_method})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
