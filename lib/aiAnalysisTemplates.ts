/**
 * AI 피부 분석 결과 템플릿 데이터
 * beautrip만의 색깔로 다양한 결과 템플릿 제공
 */

export interface SkinAnalysisResult {
  score: number;
  skinType: string;
  skinTypeDescription: string;
  summary: string;
  diagramLabels: {
    top: string;
    rightTop: string;
    rightBottom: string;
    bottom: string;
    leftBottom: string;
    leftTop: string;
  };
  recommendedIngredients: Array<{
    label: string;
    name: string;
    description: string;
  }>;
  cautionIngredients: Array<{
    label: string;
    name: string;
    description: string;
  }>;
  detailAnalysis: Array<{
    title: string;
    description: string;
  }>;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

// beautrip 브랜드 컬러를 기반으로 한 다양한 템플릿
export const analysisTemplates: SkinAnalysisResult[] = [
  {
    score: 85,
    skinType: "건조성 피부",
    skinTypeDescription: "수분 부족으로 인한 건조함이 주요 특징입니다",
    summary:
      "피부 전반적으로 수분 함량이 낮아 건조한 상태입니다. 특히 눈가와 볼 부위의 수분 손실이 두드러지며, 피부 장벽 기능이 약화되어 외부 자극에 민감할 수 있습니다. 수분 공급과 보습 관리가 시급하며, 세라마이드와 히알루론산 성분이 함유된 제품 사용을 권장합니다.",
    diagramLabels: {
      top: "수분",
      rightTop: "유분",
      rightBottom: "민감도",
      bottom: "탄력",
      leftBottom: "모공",
      leftTop: "주름",
    },
    recommendedIngredients: [
      {
        label: "A",
        name: "히알루론산",
        description: "강력한 수분 보유력으로 피부 촉촉함 유지",
      },
      {
        label: "B",
        name: "세라마이드",
        description: "피부 장벽 강화로 수분 증발 방지",
      },
      {
        label: "C",
        name: "글리세린",
        description: "수분 흡수 및 보유력 향상",
      },
    ],
    cautionIngredients: [
      {
        label: "D",
        name: "알코올",
        description: "건조함을 악화시킬 수 있어 주의 필요",
      },
      {
        label: "E",
        name: "AHA/BHA",
        description: "과도한 각질 제거로 건조 가중 가능",
      },
      {
        label: "F",
        name: "향료",
        description: "민감한 피부에 자극을 줄 수 있음",
      },
    ],
    detailAnalysis: [
      {
        title: "1. 수분 공급 및 보습 관리",
        description:
          "피부 수분 함량이 평균보다 낮아 보습 제품의 적극적인 사용이 필요합니다. 오일과 크림을 함께 사용하여 수분을 잠그는 관리가 효과적입니다.",
      },
      {
        title: "2. 피부 장벽 강화",
        description:
          "세라마이드, 콜레스테롤, 지방산이 함유된 제품으로 피부 장벽을 복원하면 수분 손실을 줄일 수 있습니다.",
      },
      {
        title: "3. 자외선 차단",
        description:
          "건조한 피부는 자외선에 더 취약하므로 매일 SPF30 이상의 선크림 사용을 권장합니다.",
      },
      {
        title: "4. 온도 관리",
        description:
          "과도한 온수 사용과 실내 건조함을 피하고, 가습기를 활용하여 환경 수분을 유지하세요.",
      },
    ],
    colorScheme: {
      primary: "#2DB8A0", // beautrip primary
      secondary: "#1A9B8A",
      accent: "#FF6B9D",
    },
  },
  {
    score: 78,
    skinType: "지성 피부",
    skinTypeDescription: "피지 분비가 활발하여 번들거림이 나타납니다",
    summary:
      "T존과 이마 부위의 피지 분비가 활발한 지성 피부입니다. 모공이 넓고 피지로 인한 번들거림이 자주 발생하며, 트러블 발생 가능성이 높습니다. 피지 조절과 모공 관리에 중점을 둔 케어가 필요하며, 수분과 유분의 균형을 맞추는 것이 중요합니다.",
    diagramLabels: {
      top: "유분",
      rightTop: "수분",
      rightBottom: "모공",
      bottom: "탄력",
      leftBottom: "트러블",
      leftTop: "번들거림",
    },
    recommendedIngredients: [
      {
        label: "A",
        name: "나이아신아마이드",
        description: "피지 분비 조절 및 모공 관리",
      },
      {
        label: "B",
        name: "살리실산",
        description: "각질 제거 및 모공 정화",
      },
      {
        label: "C",
        name: "티트리 오일",
        description: "항균 효과로 트러블 예방",
      },
    ],
    cautionIngredients: [
      {
        label: "D",
        name: "과도한 오일",
        description: "피지 분비를 더욱 촉진할 수 있음",
      },
      {
        label: "E",
        name: "코메도제닉 성분",
        description: "모공을 막아 트러블 유발 가능",
      },
      {
        label: "F",
        name: "알코올",
        description: "일시적 피지 조절 후 역효과 가능",
      },
    ],
    detailAnalysis: [
      {
        title: "1. 피지 조절 및 모공 관리",
        description:
          "논코메도제닉 제품을 선택하고, 주 2-3회 클레이 마스크나 BHA 제품으로 모공을 정화하세요.",
      },
      {
        title: "2. 수분 공급",
        description:
          "지성 피부라도 수분은 충분히 공급해야 합니다. 오일 프리 수분 크림이나 젤 타입 제품을 사용하세요.",
      },
      {
        title: "3. 클렌징",
        description:
          "하루 2회 적절한 클렌징으로 피지와 불순물을 제거하되, 과도한 세안은 피부 장벽을 손상시킬 수 있습니다.",
      },
      {
        title: "4. 선크림",
        description:
          "지성 피부용 논코메도제닉 선크림을 매일 사용하여 자외선으로 인한 피지 분비 증가를 방지하세요.",
      },
    ],
    colorScheme: {
      primary: "#FF6B9D", // beautrip accent
      secondary: "#E55A8A",
      accent: "#2DB8A0",
    },
  },
  {
    score: 92,
    skinType: "복합성 피부",
    skinTypeDescription: "T존은 지성, U존은 건조한 특성을 보입니다",
    summary:
      "T존은 피지 분비가 활발하지만 볼과 턱 부위는 건조한 복합성 피부입니다. 부위별로 다른 케어가 필요하며, T존은 피지 조절, U존은 수분 공급에 중점을 두어야 합니다. 유수분 밸런스를 맞추는 것이 핵심입니다.",
    diagramLabels: {
      top: "유수분 밸런스",
      rightTop: "T존 관리",
      rightBottom: "U존 관리",
      bottom: "전체 균형",
      leftBottom: "모공",
      leftTop: "수분",
    },
    recommendedIngredients: [
      {
        label: "A",
        name: "히알루론산",
        description: "U존 수분 공급 및 전반적 보습",
      },
      {
        label: "B",
        name: "나이아신아마이드",
        description: "T존 피지 조절 및 모공 관리",
      },
      {
        label: "C",
        name: "세라마이드",
        description: "피부 장벽 강화로 균형 유지",
      },
    ],
    cautionIngredients: [
      {
        label: "D",
        name: "과도한 오일",
        description: "T존 피지 분비 증가 유발",
      },
      {
        label: "E",
        name: "강한 각질 제거",
        description: "U존 건조함 악화 가능",
      },
      {
        label: "F",
        name: "일률적 관리",
        description: "부위별 특성 무시로 문제 발생",
      },
    ],
    detailAnalysis: [
      {
        title: "1. 부위별 맞춤 관리",
        description:
          "T존은 가벼운 제품으로 피지 조절하고, U존은 수분 크림으로 충분히 보습하세요. 멀티 마스킹도 효과적입니다.",
      },
      {
        title: "2. 유수분 밸런스",
        description:
          "전체적으로는 수분 중심의 가벼운 제품을 사용하되, T존에만 추가로 피지 조절 제품을 도포하세요.",
      },
      {
        title: "3. 계절별 관리",
        description:
          "여름에는 T존 관리에, 겨울에는 U존 보습에 더 중점을 두어 계절에 맞게 관리법을 조정하세요.",
      },
      {
        title: "4. 클렌징",
        description:
          "적절한 세안으로 T존의 피지와 불순물을 제거하되, U존은 건조하지 않도록 주의하세요.",
      },
    ],
    colorScheme: {
      primary: "#9B59B6", // 보라색 계열
      secondary: "#8E44AD",
      accent: "#2DB8A0",
    },
  },
  {
    score: 88,
    skinType: "민감성 피부",
    skinTypeDescription: "외부 자극에 민감하게 반응하는 피부입니다",
    summary:
      "피부 장벽이 약해 외부 자극에 쉽게 붉어지고 따가움을 느낄 수 있는 민감성 피부입니다. 홍조와 가려움증이 자주 발생하며, 제품 사용 시에도 즉각적인 반응을 보일 수 있습니다. 저자극 진정 제품으로 꾸준한 관리가 필요합니다.",
    diagramLabels: {
      top: "민감도",
      rightTop: "장벽 기능",
      rightBottom: "진정 필요도",
      bottom: "회복력",
      leftBottom: "수분",
      leftTop: "자극도",
    },
    recommendedIngredients: [
      {
        label: "A",
        name: "판테놀",
        description: "진정 효과 및 피부 장벽 복원",
      },
      {
        label: "B",
        name: "알란토인",
        description: "염증 완화 및 자극 완화",
      },
      {
        label: "C",
        name: "세라마이드",
        description: "피부 장벽 강화로 외부 자극 차단",
      },
    ],
    cautionIngredients: [
      {
        label: "D",
        name: "향료/향수",
        description: "알레르기 반응 및 자극 유발",
      },
      {
        label: "E",
        name: "알코올",
        description: "건조함과 홍조 악화",
      },
      {
        label: "F",
        name: "강한 각질 제거제",
        description: "피부 장벽 손상 및 자극 증가",
      },
    ],
    detailAnalysis: [
      {
        title: "1. 저자극 제품 선택",
        description:
          "향료, 알코올, 파라벤 등 자극 성분이 없는 제품을 선택하고, 패치 테스트 후 사용하세요.",
      },
      {
        title: "2. 진정 관리",
        description:
          "카모마일, 시카, 판테놀 등 진정 성분이 함유된 제품으로 일상적인 진정 케어를 하세요.",
      },
      {
        title: "3. 피부 장벽 강화",
        description:
          "세라마이드, 콜라겐, 히알루론산으로 피부 장벽을 강화하면 외부 자극에 대한 저항력이 향상됩니다.",
      },
      {
        title: "4. 자극 최소화",
        description:
          "과도한 마사지, 뜨거운 물, 강한 클렌징을 피하고, 부드러운 제품으로 최소한의 관리만 하세요.",
      },
    ],
    colorScheme: {
      primary: "#3498DB", // 파란색 계열
      secondary: "#2980B9",
      accent: "#FF6B9D",
    },
  },
  {
    score: 90,
    skinType: "건강한 피부",
    skinTypeDescription: "전반적으로 균형 잡힌 건강한 피부 상태입니다",
    summary:
      "수분과 유분의 밸런스가 잘 맞춰져 있고, 피부 장벽 기능도 양호한 건강한 피부입니다. 모공이 깨끗하고 탄력이 좋으며, 외부 자극에도 잘 견디는 상태입니다. 현재의 관리 루틴을 유지하면서 예방적 케어를 지속하시면 됩니다.",
    diagramLabels: {
      top: "균형",
      rightTop: "수분",
      rightBottom: "유분",
      bottom: "탄력",
      leftBottom: "장벽",
      leftTop: "회복력",
    },
    recommendedIngredients: [
      {
        label: "A",
        name: "비타민 C",
        description: "항산화 및 미백 효과",
      },
      {
        label: "B",
        name: "레티놀",
        description: "주름 개선 및 피부 재생",
      },
      {
        label: "C",
        name: "나이아신아마이드",
        description: "모공 관리 및 톤 개선",
      },
    ],
    cautionIngredients: [
      {
        label: "D",
        name: "과도한 성분",
        description: "여러 강한 성분 동시 사용은 주의",
      },
      {
        label: "E",
        name: "자외선 노출",
        description: "선크림 없이 외출 시 피부 노화 가속",
      },
      {
        label: "F",
        name: "스트레스",
        description: "생활 습관이 피부 상태에 영향",
      },
    ],
    detailAnalysis: [
      {
        title: "1. 예방적 관리",
        description:
          "현재 건강한 상태를 유지하기 위해 꾸준한 수분 공급과 자외선 차단을 지속하세요.",
      },
      {
        title: "2. 항산화 케어",
        description:
          "비타민 C, E, 레티놀 등 항산화 성분으로 피부 노화를 예방하고 톤을 개선하세요.",
      },
      {
        title: "3. 균형 유지",
        description:
          "과도한 케어보다는 적절한 관리로 현재 상태를 유지하는 것이 중요합니다.",
      },
      {
        title: "4. 생활 습관",
        description:
          "충분한 수면, 수분 섭취, 스트레스 관리가 피부 건강의 기초입니다.",
      },
    ],
    colorScheme: {
      primary: "#2DB8A0", // beautrip primary
      secondary: "#27AE60",
      accent: "#FF6B9D",
    },
  },
];

/**
 * 랜덤으로 분석 결과 템플릿 선택
 */
export function getRandomAnalysisResult(): SkinAnalysisResult {
  const randomIndex = Math.floor(Math.random() * analysisTemplates.length);
  return analysisTemplates[randomIndex];
}










