"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { FiGift, FiCheckCircle } from "react-icons/fi";

export default function MissionSection() {
  const { t } = useLanguage();
  
  const missions = [
    {
      id: 1,
      titleKey: "home.mission.attendance",
      descKey: "home.mission.attendanceDesc",
      progress: 5,
      max: 7,
      rewardKey: "home.mission.points",
      rewardValue: "500P",
      icon: "📅",
    },
    {
      id: 2,
      titleKey: "home.mission.review",
      descKey: "home.mission.reviewDesc",
      progress: 0,
      max: 1,
      rewardKey: "home.mission.points",
      rewardValue: "1000P",
      icon: "✍️",
    },
    {
      id: 3,
      titleKey: "home.mission.invite",
      descKey: "home.mission.inviteDesc",
      progress: 2,
      max: 3,
      rewardKey: "home.mission.coupon",
      rewardValue: "1장",
      icon: "👥",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-4 mb-6 border border-purple-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          {t("home.mission")}
        </h3>
        <button className="text-sm text-primary-main font-medium hover:underline">
          {t("home.missionViewAll")}
        </button>
      </div>

      <div className="space-y-3">
        {missions.map((mission) => {
          const progressPercent = (mission.progress / mission.max) * 100;
          const isCompleted = mission.progress >= mission.max;

          return (
            <div
              key={mission.id}
              className="bg-white rounded-xl p-3 border border-gray-100"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{mission.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {t(mission.titleKey)}
                    </h4>
                    <p className="text-xs text-gray-500">{t(mission.descKey)}</p>
                  </div>
                </div>
                {isCompleted && (
                  <FiCheckCircle className="text-green-500 text-lg flex-shrink-0" />
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isCompleted
                        ? "bg-green-500"
                        : "bg-gradient-to-r from-purple-400 to-pink-400"
                    }`}
                    style={{ width: `${Math.min(progressPercent, 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
                  {mission.progress}/{mission.max}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {t("home.mission.reward")}: <span className="font-semibold text-primary-main">{t(mission.rewardKey)} {mission.rewardValue}</span>
                </span>
                {!isCompleted && (
                  <button className="text-xs bg-primary-main/10 text-primary-main px-2 py-1 rounded-full font-medium hover:bg-primary-main/20 transition-colors">
                    {t("home.mission.participate")}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

