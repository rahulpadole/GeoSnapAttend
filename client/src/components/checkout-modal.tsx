import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, Camera, CheckCircle, MapPin } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  location: { lat: number; lng: number; address?: string } | null;
}

export default function CheckoutModal({ isOpen, onClose, location }: CheckoutModalProps) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: async ({ location, photo }: { location: any; photo: string }) => {
      return await apiRequest("POST", "/api/attendance/checkout", { location, photo });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Checked out successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/history"] });
      onClose();
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
        description: error.message || "Failed to check out",
        variant: "destructive",
      });
    },
  });

  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      setIsCapturing(true);
      
      // Create video element
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
      
      // Create canvas and capture frame
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      
      if (context) {
        context.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setPhoto(photoData);
        setShowPreview(true);
      }
      
      // Stop camera
      stream.getTracks().forEach(track => track.stop());
      setIsCapturing(false);
    } catch (error) {
      console.error("Error capturing photo:", error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive",
      });
      setIsCapturing(false);
    }
  };

  const confirmPhoto = () => {
    setShowPreview(false);
  };

  const discardPhoto = () => {
    setPhoto(null);
    setShowPreview(false);
  };

  const handleCheckout = () => {
    if (!location) {
      toast({
        title: "Location Required",
        description: "Location verification is required for checkout",
        variant: "destructive",
      });
      return;
    }

    if (!photo) {
      toast({
        title: "Photo Required",
        description: "Please take a verification photo to check out",
        variant: "destructive",
      });
      return;
    }

    checkoutMutation.mutate({ location, photo });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center text-center">
            <div className="bg-accent w-16 h-16 rounded-xl flex items-center justify-center mb-4">
              <LogOut className="text-white h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">Check Out</DialogTitle>
            <p className="text-neutral">Complete verification to check out</p>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Location Verification */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Location Verification</span>
              <Badge variant={location ? "default" : "secondary"}>
                {location ? "Verified" : "Required"}
              </Badge>
            </div>
            {location && (
              <div className="flex items-center text-xs text-neutral">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{location.address || `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`}</span>
              </div>
            )}
          </div>

          {/* Selfie Verification */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Identity Verification</span>
              <Badge variant={photo && !showPreview ? "default" : "secondary"}>
                {photo && !showPreview ? "Completed" : "Required"}
              </Badge>
            </div>
            
            {!photo ? (
              <div className="space-y-3">
                <div className="bg-gray-100 w-full h-32 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Camera className="text-gray-400 h-8 w-8 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">Take checkout selfie</p>
                  </div>
                </div>
                <Button 
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  {isCapturing ? 'Capturing...' : 'Capture Photo'}
                </Button>
              </div>
            ) : showPreview ? (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={photo}
                    alt="Photo preview"
                    className="w-full h-32 object-cover rounded-lg bg-gray-200"
                  />
                  <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                    Preview
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button 
                    onClick={discardPhoto}
                    variant="outline" 
                    className="flex-1"
                  >
                    Retake
                  </Button>
                  <Button 
                    onClick={confirmPhoto}
                    className="flex-1 bg-secondary hover:bg-secondary/90"
                  >
                    Use This Photo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={photo}
                    alt="Captured photo"
                    className="w-full h-20 object-cover rounded-lg bg-gray-200"
                  />
                  <div className="absolute top-1 left-1 bg-secondary/90 text-white px-1.5 py-0.5 rounded text-xs">
                    ✓ Ready
                  </div>
                </div>
                <div className="flex items-center justify-center p-3 bg-secondary/10 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-secondary mr-2" />
                  <span className="text-secondary font-medium text-sm">Photo captured!</span>
                </div>
                <Button 
                  onClick={() => setPhoto(null)}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Retake Photo
                </Button>
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCheckout}
              disabled={checkoutMutation.isPending || !location || !photo}
              className="flex-1 bg-accent hover:bg-accent/90 text-white"
            >
              {checkoutMutation.isPending ? 'Checking out...' : 'Complete Check Out'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}