import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  XCircle, 
  UserCog, 
  LogOut,
  Download,
  BarChart3,
  Eye,
  UserPlus,
  Settings,
  User,
  Trash2
} from "lucide-react";
import { Link } from "wouter";
import { isUnauthorizedError } from "@/lib/authUtils";
import AddEmployeeModal from "@/components/add-employee-modal";

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  lateArrivals: number;
  absent: number;
}

interface AttendanceWithUser {
  id: string;
  userId: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: 'checked_in' | 'checked_out';
  hoursWorked?: string;
  date: string;
  user?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    department?: string;
    profileImageUrl?: string;
  };
}

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);

  // Fetch attendance statistics
  const { data: stats, isLoading: statsLoading } = useQuery<AttendanceStats>({
    queryKey: ["/api/admin/stats"],
    retry: false,
  });

  // Fetch all attendance records
  const { data: attendanceRecords, isLoading: recordsLoading } = useQuery<AttendanceWithUser[]>({
    queryKey: ["/api/admin/attendance/all"],
    retry: false,
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Attendance data export will begin shortly.",
    });
    // TODO: Implement export functionality
  };

  const handleGenerateReport = () => {
    toast({
      title: "Report Generation",
      description: "Generating comprehensive attendance report.",
    });
    // TODO: Implement report generation
  };

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  if (authLoading || statsLoading || recordsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <UserCog className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center mr-3">
                <UserCog className="text-white h-4 w-4" />
              </div>
              <h1 className="font-semibold text-lg">Admin Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setShowAddEmployeeModal(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Employee
              </Button>
              <Link href="/profile">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                {user.profileImageUrl ? (
                  <img 
                    src={user.profileImageUrl} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
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
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Total Employees</p>
                  <p className="text-2xl font-bold text-textPrimary">
                    {stats?.totalEmployees || 0}
                  </p>
                </div>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Users className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Present Today</p>
                  <p className="text-2xl font-bold text-secondary">
                    {stats?.presentToday || 0}
                  </p>
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
                  <p className="text-sm text-neutral">Late Arrivals</p>
                  <p className="text-2xl font-bold text-amber-600">
                    {stats?.lateArrivals || 0}
                  </p>
                </div>
                <div className="bg-amber-100 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Clock className="text-amber-600 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral">Absent</p>
                  <p className="text-2xl font-bold text-accent">
                    {stats?.absent || 0}
                  </p>
                </div>
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  <XCircle className="text-accent h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>Marketing</option>
                  <option>Sales</option>
                  <option>HR</option>
                </select>

                <select className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option>Today</option>
                  <option>This Week</option>
                  <option>This Month</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleExport}
                  className="bg-secondary hover:bg-secondary/90 text-white"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button 
                  onClick={handleGenerateReport}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Attendance Table */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Check In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Check Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendanceRecords?.map((record) => (
                    <tr key={record.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {record.user?.profileImageUrl ? (
                            <img 
                              src={record.user.profileImageUrl} 
                              alt={`${record.user.firstName} ${record.user.lastName}`}
                              className="w-10 h-10 rounded-full object-cover mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                              <Users className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium">
                              {record.user?.firstName} {record.user?.lastName}
                            </div>
                            <div className="text-sm text-neutral">
                              {record.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.user?.department || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.checkInTime ? 
                          new Date(record.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                          '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral">
                        {record.checkOutTime ? 
                          new Date(record.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 
                          '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {record.hoursWorked ? `${parseFloat(record.hoursWorked).toFixed(1)}h` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={
                            record.status === 'checked_out' ? 'default' : 
                            record.status === 'checked_in' ? 'secondary' : 'destructive'
                          }
                        >
                          {record.status === 'checked_out' ? 'Complete' : 
                           record.status === 'checked_in' ? 'Present' : 'Absent'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary hover:text-primary/80"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!attendanceRecords?.length && (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-neutral">
                        No attendance records found for today
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Add Employee Modal */}
      <AddEmployeeModal 
        open={showAddEmployeeModal}
        onOpenChange={setShowAddEmployeeModal}
      />
    </div>
  );
}