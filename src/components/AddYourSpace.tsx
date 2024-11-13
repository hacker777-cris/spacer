"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Camera, AlertCircle, Users } from "lucide-react";
import {
  updateFormData,
  setErrors,
  setIsSubmitting,
  setSubmitMessage,
  resetForm,
} from "./spaceSlice";
import { RootState } from "./store";

type SpaceType =
  | "teamBuilding"
  | "workout"
  | "garden"
  | "library"
  | "photography"
  | "townHouse";

const spaceTypes: { [key in SpaceType]: string } = {
  teamBuilding: "Team Building",
  workout: "Workout",
  garden: "Garden",
  library: "Library",
  photography: "Photography",
  townHouse: "Town House",
};

type FormData = {
  name: string;
  type: SpaceType;
  description: string;
  hourly_rate: string;
  day_rate: string;
  capacity: string;
  location: string;
  image: File | null;
};

const initialFormData: FormData = {
  name: "",
  type: "teamBuilding",
  description: "",
  hourly_rate: "",
  day_rate: "",
  capacity: "",
  location: "",
  image: null,
};
export default function AddYourSpace() {
  const dispatch = useDispatch();
  const { formData, errors, isSubmitting, submitMessage } = useSelector(
    (state: RootState) => state.space,
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    dispatch(updateFormData({ [name]: value }));
    dispatch(setErrors({ [name]: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      dispatch(updateFormData({ image: e.target.files[0] }));
      dispatch(setErrors({ image: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.hourly_rate.trim() || isNaN(Number(formData.hourly_rate)))
      newErrors.hourly_rate = "Valid hourly rate is required";
    if (!formData.day_rate.trim() || isNaN(Number(formData.day_rate)))
      newErrors.day_rate = "Valid day rate is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.image) newErrors.image = "Image is required";
    if (
      !formData.capacity ||
      isNaN(Number(formData.capacity)) ||
      Number(formData.capacity) <= 0
    )
      newErrors.capacity = "Valid capacity is required";

    dispatch(setErrors(newErrors));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    dispatch(setIsSubmitting(true));
    dispatch(setSubmitMessage(""));

    try {
      const accessToken = localStorage.getItem("authToken");

      if (!accessToken) {
        throw new Error("Authentication token not found. Please log in.");
      }

      // Create FormData object for multipart/form-data
      const formDataToSend = new FormData();

      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "image") {
          if (value) formDataToSend.append("image", value);
        } else {
          formDataToSend.append(key, value.toString());
        }
      });

      const response = await fetch("http://127.0.0.1:5000/spaces", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // Remove Content-Type header - browser will set it automatically with boundary
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`,
        );
      }

      dispatch(setSubmitMessage("Your space has been successfully added!"));
      dispatch(resetForm());
    } catch (error) {
      dispatch(
        setSubmitMessage(
          `Error: ${
            error instanceof Error
              ? error.message
              : "An error occurred while adding your space"
          }`,
        ),
      );
    } finally {
      dispatch(setIsSubmitting(false));
    }
  };

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-8 sm:p-10">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              List Your Space
            </h1>
            <p className="text-gray-600">
              Share your unique space with others and start earning
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Space Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200"
                  placeholder="Enter space name"
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Space Type
                </label>
                <select
                  name="type"
                  id="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200"
                >
                  {Object.entries(spaceTypes).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200"
                  placeholder="Describe your space"
                />
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.description}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hourly Rate ($)
                </label>
                <input
                  type="number"
                  name="hourly_rate" // changed from price
                  id="hourly_rate"
                  value={formData.hourly_rate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {errors.price && (
                  <p className="mt-2 text-sm text-red-600">{errors.price}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dayRate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Day Rate ($)
                </label>
                <input
                  type="number"
                  name="day_rate" // changed from dayRate
                  id="day_rate"
                  value={formData.day_rate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
                {errors.dayRate && (
                  <p className="mt-2 text-sm text-red-600">{errors.dayRate}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="capacity"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Maximum Capacity
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    name="capacity"
                    id="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200"
                    placeholder="Number of people"
                    min="1"
                  />
                </div>
                {errors.capacity && (
                  <p className="mt-2 text-sm text-red-600">{errors.capacity}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address
                </label>
                <input
                  type="text"
                  name="location" // changed from address
                  id="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-gray-400 focus:border-transparent transition duration-200"
                  placeholder="Enter location"
                />
                {errors.address && (
                  <p className="mt-2 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="image"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Space Image
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors duration-200">
                  <div className="space-y-2 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="image"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-gray-600 hover:text-gray-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500"
                      >
                        <span>Upload a file</span>
                        <input
                          id="image"
                          name="image"
                          type="file"
                          className="sr-only"
                          onChange={handleFileChange}
                          accept="image/*"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
                {errors.image && (
                  <p className="mt-2 text-sm text-red-600">{errors.image}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Adding Space..." : "List Your Space"}
              </button>
            </div>
          </form>

          {submitMessage && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                submitMessage.startsWith("Error")
                  ? "bg-red-50 border border-red-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle
                    className={`h-5 w-5 ${
                      submitMessage.startsWith("Error")
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  />
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm font-medium ${
                      submitMessage.startsWith("Error")
                        ? "text-red-800"
                        : "text-green-800"
                    }`}
                  >
                    {submitMessage}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
