import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, MapPin, Camera, Shield, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Landing() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="bg-primary w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Clock className="text-white h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold text-textPrimary mb-2">
                AttendanceTracker Pro
              </h1>
              <p className="text-neutral">Smart attendance with geolocation</p>
            </div>

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

            <Link href="/login">
              <Button className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
