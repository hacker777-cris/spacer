"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import ProfileBookings from "./ProfileBookings";

interface ProfileData {
  user_id: string;
  username: string;
  email: string;
  role: string;
  profile_picture: string | File;
}

export default function ProfileComponent() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const accessToken = localStorage.getItem("authToken");

    try {
      const response = await fetch("http://127.0.0.1:5000/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile data");
      }

      const data = await response.json();
      setProfile(data);
      setPreviewUrl(`http://localhost:5000${data.profile_picture}`);
      setIsLoading(false);
    } catch (err) {
      setError("Failed to load profile data. Please try again later.");
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    const accessToken = localStorage.getItem("authToken");

    setIsLoading(true);
    try {
      const formData = new FormData();

      if (profile) {
        formData.append("username", profile.username);
        formData.append("email", profile.email);
        if (profile.profile_picture instanceof File) {
          formData.append("profile_picture", profile.profile_picture);
        }
      }

      const response = await fetch("http://127.0.0.1:5000/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      setIsEditing(false);
      setIsLoading(false);
      // Fetch the updated profile data
      await fetchProfile();
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfile((prev) => (prev ? { ...prev, profile_picture: file } : null));
      // Create a preview URL for the selected image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={previewUrl || ""} alt={profile?.username} />
                <AvatarFallback>
                  {profile?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            {isEditing && (
              <div>
                <Label htmlFor="profile_picture">Update Profile Picture</Label>
                <Input
                  id="profile_picture"
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </div>
            )}
            <div>
              <Label htmlFor="user_id">User ID</Label>
              <Input id="user_id" value={profile?.user_id} disabled />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                value={profile?.username}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                value={profile?.email}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={profile?.role} disabled />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          {!isEditing ? (
            <Button onClick={handleEdit}>Edit Profile</Button>
          ) : (
            <Button onClick={handleSave}>Save Changes</Button>
          )}
        </CardFooter>
      </Card>
      {/* New bookings section */}
      <ProfileBookings />
    </div>
  );
}
