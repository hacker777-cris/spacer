import React from "react";
import { Button } from "@/components/ui/button";

interface PaymentModalProps {
  amount: number;
  email: string;
  reference: string;
  onSuccess: (reference: string, bookingId: string) => void;
  onClose: () => void;
  isProcessing: boolean;
  bookingId: string;
}

export function PaymentModal({
  amount,
  email,
  reference,
  onSuccess,
  onClose,
  isProcessing,
  bookingId,
}: PaymentModalProps) {
  const initializePayment = async () => {
    try {
      const response = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization:
              "Bearer sk_test_5a93c3f26451bf160bb0f3857c2a0cfaf742a4ea",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            amount: amount * 100, // Convert to smallest currency unit
            reference,
            currency: "KES",
            callback_url: `${window.location.origin}/FindYourPlace?reference=${reference}&bookingId=${bookingId}`,
            metadata: {
              bookingId,
            },
          }),
        },
      );

      const data = await response.json();

      if (data.status) {
        // Redirect to Paystack checkout page
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Payment initialization failed:", error);
      onClose();
    }
  };

  return (
    <Button
      onClick={initializePayment}
      disabled={isProcessing}
      className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-200"
    >
      {isProcessing ? "Processing Payment..." : "Proceed to Payment"}
    </Button>
  );
}
