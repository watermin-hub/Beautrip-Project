"use client";

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { FiCalendar, FiChevronRight } from "react-icons/fi";

export default function CalendarSidebar() {
  const { t } = useLanguage();
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);

  const upcomingEvents = [
    {
      id: 1,
      date: "2024-01-15",
      title: "리쥬란 힐러 상담",
      hospital: "강남비비의원",
      type: "consultation",
    },
    {
      id: 2,
      date: "2024-01-20",
      title: "써마지 시술",
      hospital: "압구정 클리닉",
      type: "procedure",
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FiCalendar className="text-primary-main" />
          {t("calendar.mySchedule")}
        </h3>
        <button className="text-sm text-primary-main font-medium hover:underline flex items-center gap-1">
          {t("calendar.viewAll")}
          <FiChevronRight className="text-xs" />
        </button>
      </div>

      <div className="space-y-3">
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <FiCalendar className="text-gray-300 text-4xl mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t("calendar.noSchedule")}</p>
          </div>
        ) : (
          upcomingEvents.map((event) => {
            const eventDate = new Date(event.date);
            const isToday = 
              eventDate.getDate() === today.getDate() &&
              eventDate.getMonth() === today.getMonth() &&
              eventDate.getFullYear() === today.getFullYear();

            return (
              <div
                key={event.id}
                className={`border rounded-xl p-3 ${
                  isToday
                    ? "border-primary-main bg-primary-main/5"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-gray-600">
                        {eventDate.getMonth() + 1}월 {eventDate.getDate()}일
                      </span>
                      {isToday && (
                        <span className="bg-primary-main text-white text-[10px] px-2 py-0.5 rounded-full">
                          {t("calendar.today")}
                        </span>
                      )}
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-500">{event.hospital}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      event.type === "consultation"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {event.type === "consultation" ? t("calendar.consultation") : t("calendar.procedure")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

