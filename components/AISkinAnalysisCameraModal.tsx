"use client";

import { useState, useRef, useEffect } from "react";
import { FiX, FiCamera } from "react-icons/fi";

interface AISkinAnalysisCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageData: string) => void;
  isUploading?: boolean;
}

export default function AISkinAnalysisCameraModal({
  isOpen,
  onClose,
  onCapture,
  isUploading = false,
}: AISkinAnalysisCameraModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCaptured, setIsCaptured] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && !isCaptured) {
      startCamera();
    } else if (!isOpen) {
      stopCamera();
      setIsCaptured(false);
      setCapturedImage(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, isCaptured]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 400 },
          height: { ideal: 400 },
        },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("카메라 접근 오류:", err);
      alert("카메라 접근에 실패했습니다. 브라우저 권한을 확인해주세요.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 비디오를 미러링하므로 다시 뒤집어서 그리기
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    // Canvas를 이미지 데이터로 변환
    const imageData = canvas.toDataURL("image/png");
    setCapturedImage(imageData);
    setIsCaptured(true);
    stopCamera();
  };

  const handleConfirm = () => {
    if (capturedImage && !isUploading) {
      onCapture(capturedImage);
      // 업로드 후 이미지 데이터 정리 (메모리 최소화)
      setTimeout(() => {
        setCapturedImage(null);
      }, 100);
    }
  };

  const handleRetake = () => {
    setIsCaptured(false);
    setCapturedImage(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white overflow-y-auto w-full max-w-full">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
        <div className="w-10"></div>
        <h2 className="text-lg font-bold text-gray-900">얼굴 촬영</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-50 rounded-full transition-colors"
        >
          <FiX className="text-gray-700 text-xl" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-4 py-8 min-h-[calc(100vh-60px)]">
        <p className="text-center text-lg font-semibold text-gray-900 mb-8">
          얼굴을 화면에 맞춰주세요
        </p>

        <div className="relative w-full max-w-[256px] aspect-[2/3] border-2 border-gray-400 rounded-full overflow-hidden bg-gray-100 mb-8">
          {!isCaptured ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : capturedImage ? (
            <img
              src={capturedImage}
              alt="촬영된 사진"
              className="w-full h-full object-cover"
            />
          ) : null}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {!isCaptured ? (
          <button
            onClick={capturePhoto}
            className="w-full max-w-[320px] bg-primary-main hover:bg-[#2DB8A0] text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <FiCamera className="text-xl" />
            촬영
          </button>
        ) : (
          <div className="w-full max-w-[320px] flex gap-3">
            <button
              onClick={handleRetake}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold transition-colors"
            >
              다시 촬영
            </button>
            <button
              onClick={handleConfirm}
              disabled={isUploading}
              className="flex-1 bg-primary-main hover:bg-[#2DB8A0] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "업로드 중..." : "확인"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
