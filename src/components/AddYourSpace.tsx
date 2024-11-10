"use client";

import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { Camera, AlertCircle } from "lucide-react";
import {
  updateFormData,
  setErrors,
  setIsSubmitting,
  setSubmitMessage,
  resetForm,
} from "./spaceSlice";
import { RootState } from "./store"; // Assuming you have a store.ts file

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
    const newErrors: Partial<typeof formData> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.price.trim() || isNaN(Number(formData.price)))
      newErrors.price = "Valid price is required";
    if (!formData.address.trim()) newErrors.address = "Address is required";
    if (!formData.image) newErrors.image = "Image is required";

    dispatch(setErrors(newErrors));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    dispatch(setIsSubmitting(true));
    dispatch(setSubmitMessage(""));

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "image" && value instanceof File) {
        data.append(key, value);
      } else if (typeof value === "string") {
        data.append(key, value);
      }
    });

    try {
      const response = await fetch("/api/spaces", {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        dispatch(setSubmitMessage("Your space has been successfully added!"));
        dispatch(resetForm());
      } else {
        const errorData = await response.json();
        dispatch(
          setSubmitMessage(
            `Error: ${errorData.message || "Failed to add space"}`,
          ),
        );
      }
    } catch (error) {
      dispatch(
        setSubmitMessage(
          "An error occurred while adding your space. Please try again.",
        ),
      );
    } finally {
      dispatch(setIsSubmitting(false));
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Add Your Space
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Space Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700"
              >
                Space Type
              </label>
              <select
                name="type"
                id="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              >
                {Object.entries(spaceTypes).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
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
                className="block text-sm font-medium text-gray-700"
              >
                Price per Hour ($)
              </label>
              <input
                type="text"
                name="price"
                id="price"
                value={formData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              />
              {errors.price && (
                <p className="mt-2 text-sm text-red-600">{errors.price}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                Address
              </label>
              <input
                type="text"
                name="address"
                id="address"
                value={formData.address}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
              />
              {errors.address && (
                <p className="mt-2 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="image"
                className="block text-sm font-medium text-gray-700"
              >
                Space Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
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

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {isSubmitting ? "Adding Space..." : "Add Space"}
              </button>
            </div>
          </form>

          {submitMessage && (
            <div
              className={`mt-4 p-4 rounded-md ${submitMessage.startsWith("Error") ? "bg-red-50" : "bg-green-50"}`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle
                    className={`h-5 w-5 ${submitMessage.startsWith("Error") ? "text-red-400" : "text-green-400"}`}
                  />
                </div>
                <div className="ml-3">
                  <p
                    className={`text-sm font-medium ${submitMessage.startsWith("Error") ? "text-red-800" : "text-green-800"}`}
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
