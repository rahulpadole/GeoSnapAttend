import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { User as UserIcon, Shield, Mail, Phone, Building, Calendar, Save, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  department?: string;
  position?: string;
  phone?: string;
  hireDate?: string;
}

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/profile"],
    retry: false,
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
    position: "",
  });

  // Initialize form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        department: user.department || "",
        position: user.position || "",
      });
    }
  }, [user]);

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: any) => {
      return await apiRequest("PUT", "/api/profile", updates);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate required fields
    if (!formData.firstName || !formData.lastName) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        department: user.department || "",
        position: user.position || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-neutral">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-neutral mb-4">Unable to load profile information.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-textPrimary">My Profile</h1>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={updateProfileMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Summary */}
          <Card className="md:col-span-1">
            <CardHeader className="text-center pb-4">
              <div className="flex flex-col items-center">
                {user.profileImageUrl ? (
                  <img
                    src={user.profileImageUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <UserIcon className="h-12 w-12 text-primary" />
                  </div>
                )}
                <CardTitle className="text-xl">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <p className="text-neutral">{user.position || "Employee"}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                  user.role === 'admin' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-secondary/10 text-secondary'
                }`}>
                  {user.role === 'admin' ? 'Administrator' : 'Employee'}
                </span>
              </div>
            </CardHeader>
          </Card>

          {/* Profile Details */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-neutral mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <Label htmlFor="phone" className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className={!isEditing ? "bg-gray-50" : ""}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department" className="flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Department
                    </Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="Enter department"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      disabled={!isEditing}
                      className={!isEditing ? "bg-gray-50" : ""}
                      placeholder="Enter position"
                    />
                  </div>
                </div>

                {user.hireDate && (
                  <div>
                    <Label className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      Hire Date
                    </Label>
                    <Input
                      value={new Date(user.hireDate).toLocaleDateString()}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}