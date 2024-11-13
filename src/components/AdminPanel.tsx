"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Home,
  Users,
  Calendar,
  Briefcase,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import BookingsSection from "./AdminBookingSection";

import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5000",
});

// Add a request interceptor to include the access token in every request
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("authToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

const spaceTypes = {
  teamBuilding: "Team Building",
  workout: "Workout",
  garden: "Garden",
  library: "Library",
  photography: "Photography",
  townHouse: "Town House",
};

type Space = {
  space_id: string;
  name: string;
  description: string;
  location: string;
  hourly_rate: number;
  day_rate: number;
  capacity: number;
  status: string;
  type: keyof typeof spaceTypes;
  created_at: string;
  updated_at: string;
  bookings_count: number;
  average_rating: number;
  images: { image_id: string; url: string }[];
};

type User = {
  user_id: string;
  username: string;
  email: string;
  role: {
    role_id: number;
    role_name: string;
  };
  created_at: string;
  bookings_count: number;
  reviews_count: number;
};

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState("spaces");
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isSpaceDialogOpen, setIsSpaceDialogOpen] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  useEffect(() => {
    fetchSpaces();
    fetchUsers();
  }, []);

  const fetchSpaces = async () => {
    try {
      const response = await api.get("/admin/spaces");
      setSpaces(response.data.spaces);
    } catch (error) {
      console.error("Error fetching spaces:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSpaceSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const spaceData = Object.fromEntries(formData);

    try {
      if (selectedSpace) {
        await api.put(`/admin/spaces/${selectedSpace.space_id}`, spaceData);
      } else {
        await api.post("/admin/spaces", spaceData);
      }
      fetchSpaces();
      setIsSpaceDialogOpen(false);
    } catch (error) {
      console.error("Error submitting space:", error);
    }
  };

  const handleUserSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const userData = Object.fromEntries(formData);

    try {
      if (selectedUser) {
        await api.put(`/admin/users/${selectedUser.user_id}`, userData);
      } else {
        await api.post("/admin/users", userData);
      }
      fetchUsers();
      setIsUserDialogOpen(false);
    } catch (error) {
      console.error("Error submitting user:", error);
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    try {
      await api.delete(`/admin/spaces/${spaceId}`);
      fetchSpaces();
    } catch (error) {
      console.error("Error deleting space:", error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="mt-4">
          <Button
            variant={activeTab === "spaces" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("spaces")}
          >
            <Briefcase className="mr-2 h-4 w-4" />
            Spaces
          </Button>
          <Button
            variant={activeTab === "bookings" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("bookings")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Bookings
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => setActiveTab("users")}
          >
            <Users className="mr-2 h-4 w-4" />
            Users
          </Button>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="spaces">Spaces</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
            </TabsList>
            <TabsContent value="spaces">
              <Card>
                <CardHeader>
                  <CardTitle>Spaces</CardTitle>
                  <CardDescription>
                    Manage your available spaces here.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog
                      open={isSpaceDialogOpen}
                      onOpenChange={setIsSpaceDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedSpace(null)}>
                          <Plus className="mr-2 h-4 w-4" /> Add Space
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {selectedSpace ? "Edit Space" : "Add New Space"}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSpaceSubmit}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                Name
                              </Label>
                              <Input
                                id="name"
                                name="name"
                                defaultValue={selectedSpace?.name}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="description"
                                className="text-right"
                              >
                                Description
                              </Label>
                              <Textarea
                                id="description"
                                name="description"
                                defaultValue={selectedSpace?.description}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="location" className="text-right">
                                Location
                              </Label>
                              <Input
                                id="location"
                                name="location"
                                defaultValue={selectedSpace?.location}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label
                                htmlFor="hourly_rate"
                                className="text-right"
                              >
                                Hourly Rate
                              </Label>
                              <Input
                                id="hourly_rate"
                                name="hourly_rate"
                                type="number"
                                defaultValue={selectedSpace?.hourly_rate}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="day_rate" className="text-right">
                                Day Rate
                              </Label>
                              <Input
                                id="day_rate"
                                name="day_rate"
                                type="number"
                                defaultValue={selectedSpace?.day_rate}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="type" className="text-right">
                                Type
                              </Label>
                              <Select
                                name="type"
                                defaultValue={
                                  selectedSpace?.type || "teamBuilding"
                                }
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(spaceTypes).map(
                                    ([value, label]) => (
                                      <SelectItem key={value} value={value}>
                                        {label}
                                      </SelectItem>
                                    ),
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="capacity" className="text-right">
                                Capacity
                              </Label>
                              <Input
                                id="capacity"
                                name="capacity"
                                type="number"
                                defaultValue={selectedSpace?.capacity}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="status" className="text-right">
                                Status
                              </Label>
                              <Select
                                name="status"
                                defaultValue={
                                  selectedSpace?.status || "available"
                                }
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="available">
                                    Available
                                  </SelectItem>
                                  <SelectItem value="unavailable">
                                    Unavailable
                                  </SelectItem>
                                  <SelectItem value="maintenance">
                                    Maintenance
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">
                              {selectedSpace ? "Update" : "Create"} Space
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {spaces.map((space) => (
                          <TableRow key={space.space_id}>
                            <TableCell>{space.name}</TableCell>
                            <TableCell>{space.location}</TableCell>
                            <TableCell>{space.capacity}</TableCell>
                            <TableCell>{space.status}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedSpace(space);
                                  setIsSpaceDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleDeleteSpace(space.space_id)
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bookings">
              <BookingsSection />
            </TabsContent>
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>Manage your users here.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog
                      open={isUserDialogOpen}
                      onOpenChange={setIsUserDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button onClick={() => setSelectedUser(null)}>
                          <Plus className="mr-2 h-4 w-4" /> Add User
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {selectedUser ? "Edit User" : "Add New User"}
                          </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleUserSubmit}>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="username" className="text-right">
                                Username
                              </Label>
                              <Input
                                id="username"
                                name="username"
                                defaultValue={selectedUser?.username}
                                className="col-span-3"
                              />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="email" className="text-right">
                                Email
                              </Label>
                              <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={selectedUser?.email}
                                className="col-span-3"
                              />
                            </div>
                            {!selectedUser && (
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label
                                  htmlFor="password"
                                  className="text-right"
                                >
                                  Password
                                </Label>
                                <Input
                                  id="password"
                                  name="password"
                                  type="password"
                                  className="col-span-3"
                                />
                              </div>
                            )}
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="role" className="text-right">
                                Role
                              </Label>
                              <Select
                                name="role_id"
                                defaultValue={
                                  selectedUser?.role.role_id.toString() || "2"
                                }
                              >
                                <SelectTrigger className="col-span-3">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Admin</SelectItem>
                                  <SelectItem value="2">User</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">
                              {selectedUser ? "Update" : "Create"} User
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <ScrollArea className="h-[600px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.user_id}>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{user.role.role_name}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setIsUserDialogOpen(true);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(user.user_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
