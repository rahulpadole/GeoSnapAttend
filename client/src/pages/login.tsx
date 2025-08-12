import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, MapPin, Camera, Shield, Users, BarChart3 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      try {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        
        // Send the ID token to your backend for verification and session creation
        const response = await apiRequest("POST", "/api/auth/firebase-google", { 
          idToken 
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Authentication failed");
        }
        
        return response.json();
      } catch (error: any) {
        // Handle Firebase Auth errors
        if (error.code === 'auth/popup-closed-by-user') {
          throw new Error("Sign-in was cancelled");
        } else if (error.code === 'auth/popup-blocked') {
          throw new Error("Popup was blocked. Please allow popups and try again");
        } else if (error.code === 'auth/network-request-failed') {
          throw new Error("Network error. Please check your connection");
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Google Sign-In Failed",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleGoogleLogin = () => {
    googleLoginMutation.mutate();
  };

  const devLoginMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/dev-login", { email });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate auth query to refresh user state
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed", 
        description: error.message.includes("401") 
          ? "No invitation found for this email address" 
          : "Please try again",
        variant: "destructive"
      });
    }
  });

  const handleDevLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      devLoginMutation.mutate(email.trim());
    }
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

            {/* Development login form for employees */}
            <div className="space-y-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-neutral mb-4">Employee Login (Development)</p>
              </div>
              <form onSubmit={handleDevLogin} className="space-y-3">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  data-testid="input-email"
                />
                <Button 
                  type="submit"
                  disabled={devLoginMutation.isPending}
                  className="w-full bg-secondary hover:bg-secondary/90 text-white py-3"
                  data-testid="button-dev-login"
                >
                  {devLoginMutation.isPending ? "Signing In..." : "Sign In with Email"}
                </Button>
              </form>
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <Button 
              onClick={handleGoogleLogin}
              disabled={googleLoginMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-white py-4 text-lg"
              data-testid="button-oauth-login"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {googleLoginMutation.isPending ? "Signing in..." : "Continue with Google"}
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