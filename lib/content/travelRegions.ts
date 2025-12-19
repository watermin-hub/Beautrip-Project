// Travel Region Data - Base interface and Korean version

export interface RegionData {
  id: string;
  name: string;
  nameEn: string;
  oneLine: string;
  description: string;
  recommendations: string[];
  caption: string;
  images: string[];
}

export const travelRegions: RegionData[] = [
  {
    id: "hongdae",
    name: "홍대입구",
    nameEn: "Hongdae",
    oneLine: "젊음·예술·거리 문화가 살아있는 한국 감성의 중심지.",
    description:
      "홍대입구는 서울에서 가장 자유롭고 창의적인 분위기를 가진 지역으로, '한국의 젊음'이 가장 생생하게 느껴지는 곳입니다. 골목마다 서로 다른 개성을 가진 카페와 로컬 디자이너의 작은 편집숍이 자리하고 있어 걷기만 해도 새로운 영감을 받기 좋아요. 특히 주말 저녁이 되면 거리 곳곳에서 버스커들의 음악이 흘러나와 홍대만의 활기찬 에너지를 만들어냅니다. 예술대학이 인근에 있어 그래피티, 스트리트 아트, 실험적인 전시 공간 등 '홍대만의 예술문화'도 깊게 퍼져 있어, 한국의 트렌드와 창작 분위기를 한눈에 경험할 수 있어요. 밤이 되면 네온사인이 켜지고 사람들의 웃음소리와 음악이 뒤섞여 활기가 넘치는 야경을 선물합니다.",
    recommendations: [
      "감성 카페 & 디저트 투어",
      "버스킹 공연 감상",
      "편집숍 패션 쇼핑",
      "그래피티·거리 예술 사진 스팟",
    ],
    caption: "한국의 젊음과 예술이 모인 거리, 홍대입구",
    images: [
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HD04.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HD01.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HD02.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HD03.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HD05.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HD06.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HD07.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HD08.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/HD09.png",
    ],
  },
  {
    id: "gangnam",
    name: "강남역",
    nameEn: "Gangnam Station",
    oneLine: "한국 현대문화의 중심지, 쇼핑과 먹거리의 끝판왕.",
    description:
      "강남역은 서울의 현대적인 모습이 가장 잘 드러나는 대표적인 번화가로, 쇼핑과 음식, 한국의 일상 문화가 모두 응축된 지역입니다. 도심 한복판을 걷다 보면 최신 패션 브랜드와 코스메틱 매장이 줄지어 있고, 골목마다 다양한 콘셉트의 카페와 레스토랑이 즐비해 여행객이 원하는 어떤 분위기도 쉽게 찾을 수 있어요. 낮에는 쇼핑과 카페 문화가 중심이라면, 저녁이 되면 강남역은 완전히 다른 모습의 도시가 됩니다. 빛나는 간판과 사람들이 채운 거리는 활기 넘치는 에너지를 뿜어내며, '한국 직장인의 일상'과 '도시의 야간 라이프스타일'을 동시에 볼 수 있는 독특한 매력을 지니죠. 패션·뷰티에 관심 있는 여행객, 사람 많은 도시 분위기를 좋아하는 여행자들에게 강남역은 언제 방문해도 재미있는 곳입니다.",
    recommendations: [
      "로드숍 쇼핑 & 화장품 브랜드 탐방",
      "강남역 맛집 라인업",
      "한국 직장인 라이프스타일 구경",
      "야경 사진 스팟",
    ],
    caption: "서울의 에너지와 트렌드를 느끼고 싶다면, 강남역",
    images: [
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GN01.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GN02.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GN03.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GN04.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GN05.png",
    ],
  },
  {
    id: "apgujeong",
    name: "압구정 · 청담",
    nameEn: "Apgujeong / Cheongdam",
    oneLine:
      "K-POP 엔터 본사, 명품 쇼핑, 세련된 분위기까지 — 한국 럭셔리의 상징.",
    description:
      "압구정과 청담은 '럭셔리 서울'을 경험할 수 있는 상징적인 지역으로 유명합니다. 이곳에는 수많은 K-POP 엔터테인먼트 회사가 모여 있어, 평소 좋아하던 아티스트의 사옥을 실제로 방문하는 재미도 쏠쏠합니다. 또한, 갤러리아 백화점을 비롯해 명품 브랜드의 플래그십 스토어가 거리마다 자리하고 있어 전 세계 여행객들이 '한국의 하이엔드 쇼핑 문화'를 체험하러 찾는 곳이기도 하죠. 청담동은 그 자체로 고급스러운 분위기를 가지고 있어 특별한 카페, 감각적인 레스토랑, 세련된 헤어·뷰티샵까지 하나의 라이프스타일 클러스터처럼 구성되어 있습니다. 거리 자체가 조용하고 정돈되어 있어 '고급스러운 한국의 일상'을 경험하기에도 좋습니다. 럭셔리 여행자, K-스타 팬, 트렌드를 즐기는 여행객 모두에게 매력적인 지역입니다.",
    recommendations: [
      "K-pop 엔터테인먼트 회사 방문",
      "갤러리아백화점 명품 쇼핑",
      "청담 스타일 감성 카페",
      "럭셔리 거리 산책",
    ],
    caption: "K-스타 감성과 하이엔드 쇼핑의 중심, 압구정·청담",
    images: [
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/AGJ01.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/AGJ02.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/AGJ03.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/AGJ04.png",
    ],
  },
  {
    id: "myeongdong",
    name: "명동",
    nameEn: "Myeongdong",
    oneLine: "한국 최대 규모 스트릿 푸드 + 쇼핑 천국.",
    description:
      "명동은 한국을 대표하는 쇼핑 거리이자 외국인 관광객이 가장 먼저 떠올리는 여행지 중 하나입니다. 거리 양쪽을 따라 늘어선 스트리트 푸드 노점에서는 치즈 호떡, 꼬치, 미니 만두, 쫀득한 떡 등 한국의 다양한 간식들을 맛볼 수 있어 '한국 음식'을 경험하기에 최고의 장소예요. 또한 글로벌 화장품 브랜드와 한국 로컬 뷰티 브랜드가 밀집해 있어 트렌드에 민감한 여행객이라면 꼭 들러야 하는 곳이죠. 명동성당, 광장 주변의 거리 공연 등 문화 요소도 함께 즐길 수 있어 관광과 쇼핑을 동시에 즐기는 복합 여행지로 사랑받고 있습니다. 저녁 시간에는 불빛이 켜지고 사람들의 활기가 더해져 '한국식 쇼핑 거리의 생동감'을 가장 잘 느낄 수 있는 곳입니다.",
    recommendations: [
      "한국 스트릿푸드 20종 투어",
      "뷰티 브랜드 쇼핑",
      "명동성당 방문",
      "밤거리 야경 감상",
    ],
    caption: "한국 스트릿푸드의 진짜 맛을 즐길 수 있는 명동 거리",
    images: [
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/MD01.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/MD02.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/MD03.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/MD04.png",
    ],
  },
  {
    id: "gwanghwamun",
    name: "광화문",
    nameEn: "Gwanghwamun",
    oneLine: "한국의 역사와 현대가 만나는 웅장한 도시 중심부.",
    description:
      "광화문은 한국의 역사와 현대 도시 분위기를 모두 담고 있는 특별한 지역입니다. 웅장한 광화문 광장을 중심으로 한쪽에는 고궁인 경복궁이 자리하고, 반대편에는 현대적인 고층 빌딩들이 서 있어 전통과 현대가 어우러진 독특한 풍경을 만들어냅니다. 경복궁에서는 한국의 역사와 건축미를 가까이서 느낄 수 있으며, 한복을 입고 사진을 찍는 체험도 여행객에게 매우 인기 있어요. 광화문 주변 박물관과 전시관에서는 한국의 예술과 문화를 깊이 이해할 수 있으며, 세종대로를 따라 걷다 보면 서울의 상징적인 풍경과 조용한 여백을 동시에 느낄 수 있습니다. 한국 여행에서 '한국다움'을 찾고 싶다면 꼭 들러야 하는 곳입니다.",
    recommendations: [
      "경복궁 산책 & 한복 체험",
      "광화문광장 & 세종대왕 동상",
      "국립박물관·미술관 방문",
      "사진 명소 다수",
    ],
    caption: "한국의 역사와 도시가 만나는 곳, 광화문",
    images: [
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GHM01.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GHM02.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GHM03.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GHM04.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GHM05.png",
      "https://ecimg.cafe24img.com/pg1989b96667141076/pagesoomin/beautrip/contents_place/GHM06.png",
    ],
  },
];

// Get travel regions by language
export async function getTravelRegionsByLanguage(
  language: string
): Promise<RegionData[]> {
  try {
    if (language === "JP") {
      const { travelRegions: jpRegions } = await import("./travelRegions.ja");
      return jpRegions || travelRegions;
    }
    if (language === "CN") {
      const { travelRegions: zhRegions } = await import("./travelRegions.zh");
      return zhRegions || travelRegions;
    }
    if (language === "EN") {
      const { travelRegions: enRegions } = await import("./travelRegions.en");
      return enRegions || travelRegions;
    }
    // 기본값은 한국어 (KR 등)
    return travelRegions;
  } catch (error) {
    console.error(
      `[getTravelRegionsByLanguage] Failed to load travel regions for ${language}:`,
      error
    );
    // 실패 시 한국어 기본값 반환
    return travelRegions;
  }
}
