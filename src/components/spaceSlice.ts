import { createSlice, PayloadAction } from "@reduxjs/toolkit";

type SpaceType =
  | "teamBuilding"
  | "workout"
  | "garden"
  | "library"
  | "photography"
  | "townHouse";

interface FormData {
  name: string;
  type: SpaceType;
  description: string;
  price: string;
  address: string;
  image: File | null;
}

interface SpaceState {
  formData: FormData;
  errors: Partial<FormData>;
  isSubmitting: boolean;
  submitMessage: string;
}

const initialState: SpaceState = {
  formData: {
    name: "",
    type: "teamBuilding",
    description: "",
    price: "",
    address: "",
    image: null,
  },
  errors: {},
  isSubmitting: false,
  submitMessage: "",
};

const spaceSlice = createSlice({
  name: "space",
  initialState,
  reducers: {
    updateFormData: (state, action: PayloadAction<Partial<FormData>>) => {
      state.formData = { ...state.formData, ...action.payload };
    },
    setErrors: (state, action: PayloadAction<Partial<FormData>>) => {
      state.errors = action.payload;
    },
    setIsSubmitting: (state, action: PayloadAction<boolean>) => {
      state.isSubmitting = action.payload;
    },
    setSubmitMessage: (state, action: PayloadAction<string>) => {
      state.submitMessage = action.payload;
    },
    resetForm: (state) => {
      state.formData = initialState.formData;
      state.errors = {};
      state.isSubmitting = false;
      state.submitMessage = "";
    },
  },
});

export const {
  updateFormData,
  setErrors,
  setIsSubmitting,
  setSubmitMessage,
  resetForm,
} = spaceSlice.actions;
export default spaceSlice.reducer;
