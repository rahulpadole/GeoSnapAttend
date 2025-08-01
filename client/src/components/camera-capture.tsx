import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Camera, CheckCircle, RotateCcw } from "lucide-react";

interface CameraCaptureProps {
  onCapture: (photoData: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function CameraCapture({ onCapture, disabled, isLoading }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoTaken, setPhotoTaken] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: 640, 
          height: 480,
          facingMode: 'user' // Use front camera for selfies
        } 
      });
      setStream(mediaStream);
      setIsCapturing(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please ensure camera permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);
        setShowPreview(true);
        // Don't stop camera yet - let user preview first
      }
    }
  };

  const confirmPhoto = () => {
    setPhotoTaken(true);
    setShowPreview(false);
    stopCamera();
  };

  const discardPhoto = () => {
    setCapturedPhoto(null);
    setShowPreview(false);
    // Keep camera running for another shot
  };

  const retakePhoto = () => {
    setPhotoTaken(false);
    setCapturedPhoto(null);
    setShowPreview(false);
    startCamera();
  };

  const handleSubmit = () => {
    if (capturedPhoto) {
      onCapture(capturedPhoto);
    }
  };

  return (
    <div className="space-y-4">
      {isCapturing && !showPreview && (
        <div className="relative">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-48 object-cover rounded-lg bg-gray-200"
          />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <Button onClick={capturePhoto} className="bg-primary hover:bg-primary/90">
              <Camera className="mr-2 h-4 w-4" />
              Capture Photo
            </Button>
          </div>
        </div>
      )}

      {/* Photo Preview */}
      {showPreview && capturedPhoto && (
        <div className="space-y-4">
          <div className="relative">
            <img
              ref={previewRef}
              src={capturedPhoto}
              alt="Photo preview"
              className="w-full h-48 object-cover rounded-lg bg-gray-200"
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
              <RotateCcw className="mr-2 h-4 w-4" />
              Retake
            </Button>
            <Button 
              onClick={confirmPhoto}
              className="flex-1 bg-secondary hover:bg-secondary/90"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Use This Photo
            </Button>
          </div>
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />

      {!isCapturing && !photoTaken && !showPreview && (
        <Button 
          onClick={startCamera}
          disabled={disabled}
          className="w-full bg-primary hover:bg-primary/90 text-white py-4 text-lg"
        >
          <Camera className="mr-2 h-5 w-5" />
          Take Verification Photo
        </Button>
      )}

      {photoTaken && capturedPhoto && !showPreview && (
        <div className="space-y-4">
          {/* Final photo preview */}
          <div className="relative">
            <img
              src={capturedPhoto}
              alt="Captured photo"
              className="w-full h-32 object-cover rounded-lg bg-gray-200"
            />
            <div className="absolute top-2 left-2 bg-secondary/90 text-white px-2 py-1 rounded text-xs">
              ✓ Ready
            </div>
          </div>
          
          <div className="flex items-center justify-center p-4 bg-secondary/10 rounded-lg">
            <CheckCircle className="h-5 w-5 text-secondary mr-2" />
            <span className="text-secondary font-medium">Photo captured successfully!</span>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={retakePhoto}
              variant="outline" 
              className="flex-1"
            >
              Retake Photo
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-secondary hover:bg-secondary/90"
            >
              {isLoading ? 'Checking in...' : 'Check In'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}