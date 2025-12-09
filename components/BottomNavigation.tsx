"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { FiHome, FiCompass, FiUsers, FiCalendar, FiUser } from "react-icons/fi";
import { useLanguage } from "@/contexts/LanguageContext";

const navItems = [
  { icon: FiHome, labelKey: "nav.home", path: "/" },
  { icon: FiCompass, labelKey: "nav.explore", path: "/explore" },
  { icon: FiUsers, labelKey: "nav.community", path: "/community" },
  { icon: FiCalendar, labelKey: "nav.schedule", path: "/schedule" },
  { icon: FiUser, labelKey: "nav.mypage", path: "/mypage" },
];

interface BottomNavigationProps {
  disabled?: boolean;
}

export default function BottomNavigation({ disabled = false }: BottomNavigationProps) {
  const pathname = usePathname();
  const { t } = useLanguage();

  return (
    <nav className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 z-50 ${disabled ? "pointer-events-none" : ""}`}>
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-1 py-1 px-2 min-w-0 flex-1 transition-colors ${
                disabled 
                  ? "text-gray-300 cursor-not-allowed" 
                  : isActive 
                  ? "text-primary-main" 
                  : "text-gray-500"
              }`}
            >
              <Icon
                className={`text-xl ${
                  disabled
                    ? "text-gray-300"
                    : isActive 
                    ? "text-primary-main" 
                    : "text-gray-500"
                }`}
              />
              <span
                className={`text-xs whitespace-nowrap ${
                  disabled
                    ? "text-gray-300"
                    : isActive 
                    ? "text-primary-main font-medium" 
                    : "text-gray-500"
                }`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
