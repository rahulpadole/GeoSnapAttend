import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Camera, CheckCircle, User, LogOut } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import CameraCapture from "@/components/camera-capture";
import LocationVerification from "@/components/location-verification";
import CheckoutModal from "@/components/checkout-modal";

interface AttendanceRecord {
  id: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'checked_in' | 'checked_out';
  hoursWorked?: string;
  date: string;
}

export default function EmployeeDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; address?: string } | null>(null);

  // Fetch today's attendance
  const { data: todayAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ["/api/attendance/today"],
    retry: false,
  });

  // Fetch attendance history
  const { data: attendanceHistory } = useQuery({
    queryKey: ["/api/attendance/history"],
    retry: false,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ location, photo }: { location: any; photo: string }) => {
      return await apiRequest("POST", "/api/attendance/checkin", { location, photo });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checked in successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/history"] });
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
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = async (photo: string) => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Please enable location access to check in",
        variant: "destructive",
      });
      return;
    }

    checkInMutation.mutate({ location, photo });
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
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
  }, [user, authLoading, toast]);

  if (authLoading || attendanceLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isCheckedIn = todayAttendance?.status === 'checked_in';
  const checkInTime = todayAttendance?.checkInTime ? new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;
  const hoursWorked = todayAttendance?.hoursWorked || '0';

  // Calculate weekly hours (placeholder calculation)
  const weeklyHours = attendanceHistory?.reduce((total: number, record: AttendanceRecord) => {
    return total + (parseFloat(record.hoursWorked || '0'));
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                <Clock className="text-white h-4 w-4" />
              </div>
              <h1 className="font-semibold text-lg">AttendanceTracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 rounded-full bg-gray-200 p-1" />
                )}
                <span className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-neutral hover:text-textPrimary"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Today's Status</p>
                  <p className="text-2xl font-bold text-secondary">
                    {isCheckedIn ? 'Checked In' : 'Not Checked In'}
                  </p>
                  {checkInTime && (
                    <p className="text-xs text-neutral mt-1">{checkInTime}</p>
                  )}
                </div>
                <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-secondary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Hours Worked</p>
                  <p className="text-2xl font-bold text-textPrimary">
                    {parseFloat(hoursWorked).toFixed(1)}h
                  </p>
                  <p className="text-xs text-neutral mt-1">Target: 8h</p>
                </div>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Clock className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">This Week</p>
                  <p className="text-2xl font-bold text-textPrimary">
                    {weeklyHours.toFixed(1)}h
                  </p>
                  <p className="text-xs text-secondary mt-1">
                    {weeklyHours > 40 ? `+${(weeklyHours - 40).toFixed(1)}h overtime` : 'On track'}
                  </p>
                </div>
                <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Clock className="text-amber-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Check-in/Check-out Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Controls */}
              <div>
                <div className="bg-gray-50 rounded-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Attendance Action</h3>
                    <Badge variant={isCheckedIn ? "default" : "secondary"}>
                      {isCheckedIn ? 'Checked In' : 'Ready to Check In'}
                    </Badge>
                  </div>
                  
                  <LocationVerification onLocationUpdate={setLocation} />
                </div>

                {isCheckedIn ? (
                  <Button 
                    onClick={() => setShowCheckoutModal(true)}
                    className="w-full bg-accent hover:bg-accent/90 text-white py-4 text-lg"
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Check Out
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <CameraCapture 
                      onCapture={handleCheckIn}
                      disabled={checkInMutation.isPending || !location}
                      isLoading={checkInMutation.isPending}
                    />
                  </div>
                )}
              </div>

              {/* Camera Preview */}
              <div>
                <h3 className="font-medium mb-4">Live Verification</h3>
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="bg-gray-200 w-full h-48 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="text-gray-400 h-12 w-12 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm">Camera Preview</p>
                      <p className="text-xs text-gray-400 mt-1">Click to capture selfie</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceHistory?.map((record: AttendanceRecord) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">
                        {record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">
                        {record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">
                        {record.hoursWorked ? `${parseFloat(record.hoursWorked).toFixed(1)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={record.status === 'checked_out' ? 'default' : 'secondary'}>
                          {record.status === 'checked_out' ? 'Complete' : 'Active'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {!attendanceHistory?.length && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-neutral">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Checkout Modal */}
      <CheckoutModal 
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        location={location}
      />
    </div>
  );
}
