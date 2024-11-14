import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const BookingSuccess = ({ onAnimationEnd }) => {
  return (
    <div
      className="fixed top-4 right-4 w-96 transition-opacity duration-500 ease-in-out animate-in slide-in-from-top-5"
      onAnimationEnd={onAnimationEnd}
    >
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <AlertTitle className="text-green-800 font-semibold">
          Success!
        </AlertTitle>
        <AlertDescription className="text-green-700">
          Your booking has been confirmed successfully. Redirecting to your
          profile...
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BookingSuccess;
