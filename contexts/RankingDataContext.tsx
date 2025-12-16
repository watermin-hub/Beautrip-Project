"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { loadTreatmentsPaginated, Treatment } from "@/lib/api/beautripApi";

interface RankingDataContextType {
  allTreatments: Treatment[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  lastUpdated: Date | null;
}

const RankingDataContext = createContext<RankingDataContextType | undefined>(
  undefined
);

export function RankingDataProvider({ children }: { children: ReactNode }) {
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 여러 번 호출하여 모든 데이터 가져오기 (최대 5000개)
      let allData: Treatment[] = [];
      let page = 1;
      const pageSize = 1000; // Supabase 최대 limit
      let hasMore = true;
      const maxData = 5000; // 최대 로드 개수 제한

      console.log("🔄 [RankingDataContext] 전체 랭킹 데이터 로드 시작...");

      while (hasMore && allData.length < maxData) {
        const result = await loadTreatmentsPaginated(page, pageSize, {
          skipPlatformSort: true,
          categoryLarge: undefined,
          categoryMid: undefined,
        });

        allData = [...allData, ...result.data];
        hasMore = result.hasMore && result.data.length === pageSize;
        page++;

        console.log(
          `📥 [RankingDataContext] ${allData.length}개 로드 완료 (${
            page - 1
          }회 호출)`
        );

        // 무한 루프 방지
        if (page > 10) {
          console.warn("⚠️ [RankingDataContext] 최대 호출 횟수 도달, 중단");
          break;
        }
      }

      setAllTreatments(allData);
      setLastUpdated(new Date());
      console.log(
        `✅ [RankingDataContext] 전체 데이터 로드 완료: ${allData.length}개`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "데이터 로드 실패";
      setError(errorMessage);
      console.error("❌ [RankingDataContext] 데이터 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드 (컴포넌트 마운트 시 한 번만)
  useEffect(() => {
    loadAllData();
  }, []);

  const refreshData = async () => {
    await loadAllData();
  };

  return (
    <RankingDataContext.Provider
      value={{
        allTreatments,
        loading,
        error,
        refreshData,
        lastUpdated,
      }}
    >
      {children}
    </RankingDataContext.Provider>
  );
}

export function useRankingData() {
  const context = useContext(RankingDataContext);
  if (context === undefined) {
    throw new Error("useRankingData must be used within RankingDataProvider");
  }
  return context;
}
