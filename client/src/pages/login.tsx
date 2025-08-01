import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, Camera, Shield, Users, BarChart3 } from "lucide-react";

export default function Login() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8">
        {/* Left side - Login */}
        <Card className="shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="bg-primary w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Clock className="text-white h-8 w-8" />
            </div>
            <CardTitle className="text-2xl font-bold text-textPrimary mb-2">
              AttendanceTracker Pro
            </CardTitle>
            <p className="text-neutral">Smart attendance with geolocation verification</p>
          </CardHeader>
          
          <CardContent className="p-8">
            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3 text-sm">
                <MapPin className="h-5 w-5 text-secondary" />
                <span>Geolocation verification</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Camera className="h-5 w-5 text-secondary" />
                <span>Selfie authentication</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <Shield className="h-5 w-5 text-secondary" />
                <span>Secure attendance tracking</span>
              </div>
            </div>

            <Button 
              onClick={handleLogin}
              className="w-full bg-primary hover:bg-primary/90 text-white py-4 text-lg"
            >
              Sign In to Continue
            </Button>

            <div className="mt-6 text-center text-xs text-neutral">
              <p>By signing in, you agree to our terms of service</p>
            </div>
          </CardContent>
        </Card>

        {/* Right side - Features */}
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-textPrimary mb-4">
              Modern Workforce Management
            </h2>
            <p className="text-neutral text-lg">
              Streamline attendance tracking with advanced verification features
            </p>
          </div>

          <div className="grid gap-4">
            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-secondary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Users className="text-secondary h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-textPrimary mb-2">Employee Dashboard</h3>
                  <p className="text-neutral text-sm">
                    Quick check-in/out with location and photo verification
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  <BarChart3 className="text-primary h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-textPrimary mb-2">Admin Analytics</h3>
                  <p className="text-neutral text-sm">
                    Comprehensive reporting and employee management tools
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center">
                  <Shield className="text-accent h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-textPrimary mb-2">Secure & Reliable</h3>
                  <p className="text-neutral text-sm">
                    Advanced authentication with biometric verification
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}