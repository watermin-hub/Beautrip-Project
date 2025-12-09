"use client";

import { useState } from "react";
import { FiArrowLeft, FiCamera, FiX, FiAlertCircle } from "react-icons/fi";

const surgicalAreas = [
  { id: "eyes", label: "눈" },
  { id: "nose", label: "코" },
  { id: "face", label: "안면윤곽" },
  { id: "breast", label: "가슴" },
  { id: "fat-graft", label: "지방이식" },
  { id: "liposuction", label: "지방흡입" },
  { id: "jaw", label: "양악" },
  { id: "petit", label: "쁘띠" },
  { id: "skin", label: "피부" },
  { id: "hairline", label: "헤어라인" },
  { id: "teeth", label: "치아" },
  { id: "other", label: "기타" },
];

const photoPlaceholders = [
  { id: 1, label: "좌측면" },
  { id: 2, label: "우측면" },
  { id: 3, label: "" },
  { id: 4, label: "" },
];

export default function QuoteRequestPage() {
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isReoperation, setIsReoperation] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { id: number; url: string }[]
  >([]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPhotos = files.map((file, index) => ({
        id: Date.now() + index,
        url: URL.createObjectURL(file),
      }));
      setUploadedPhotos([...uploadedPhotos, ...newPhotos].slice(0, 4));
    }
  };

  const removePhoto = (id: number) => {
    setUploadedPhotos((photos) => photos.filter((p) => p.id !== id));
  };

  return (
    <div className="w-full">
      {/* Content */}
      <div className="px-4 py-6 space-y-8">
        {/* Surgical Area Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-teal-400 rounded flex items-center justify-center">
              <span className="text-white text-xs">+</span>
            </div>
            <h2 className="text-base font-bold text-gray-900">수술부위</h2>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {surgicalAreas.map((area) => (
              <button
                key={area.id}
                onClick={() => setSelectedArea(area.id)}
                className={`py-3 px-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedArea === area.id
                    ? "bg-teal-400 text-white border-2 border-teal-400"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                }`}
              >
                {area.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reoperation Checkbox */}
        <div className="flex items-center gap-2">
          <FiAlertCircle className="text-gray-500 text-lg" />
          <span className="text-sm text-gray-700 flex-1">
            재수술인 경우 체크해주세요
          </span>
          <button
            onClick={() => setIsReoperation(!isReoperation)}
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isReoperation
                ? "bg-teal-400 border-teal-400"
                : "bg-white border-gray-300"
            }`}
          >
            {isReoperation && (
              <svg
                className="w-3 h-3 text-white"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Photo Upload Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FiCamera className="text-gray-700 text-lg" />
            <h2 className="text-base font-bold text-gray-900">사진 넣기</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {uploadedPhotos.length > 0 &&
              uploadedPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={photo.url}
                    alt="Uploaded"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"
                  >
                    <FiX className="text-xs" />
                  </button>
                </div>
              ))}
            {photoPlaceholders
              .slice(0, 4 - uploadedPhotos.length)
              .map((placeholder, index) => (
                <label
                  key={index}
                  htmlFor={`photo-${index}`}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-teal-400 transition-colors bg-gray-50"
                >
                  {placeholder.label && (
                    <span className="text-xs text-gray-500 mb-1">
                      {placeholder.label}
                    </span>
                  )}
                  <FiCamera className="text-gray-400 text-xl" />
                  <input
                    type="file"
                    id={`photo-${index}`}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            가이드에 맞지 않는 사진의 경우에는 병원의 답변이 없을 수 있습니다
          </p>
        </div>

        {/* Complete Button */}
        <button className="w-full bg-teal-400 hover:bg-teal-500 text-white py-4 rounded-lg font-semibold transition-colors">
          완료
        </button>
      </div>
    </div>
  );
}
