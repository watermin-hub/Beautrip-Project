import type { LanguageCode } from "@/contexts/LanguageContext";

export type RecoveryGroupKey =
  | "jaw"
  | "breast"
  | "body"
  | "upperFace"
  | "nose"
  | "eyeSurgery"
  | "eyeVolume"
  | "faceFat"
  | "lifting"
  | "procedures";

export type WeekContent = {
  label: string;
  subtitle: string;
  description: string[];
  tips: string[];
  cautions: string[];
  quote?: string;
};

export type RecoveryGroupContent = {
  title: string;
  badge: string;
  summary: string;
  recommended?: string;
  procedures?: string;
  weeks: WeekContent[];
  summaryTitle?: string;
  summaryBody?: string[];
  closingTitle?: string;
  closingBody?: string[];
};

type RecoveryContentByLang = Record<
  LanguageCode,
  Record<RecoveryGroupKey, RecoveryGroupContent>
>;

// NOTE:
// - KR: 원문을 중심으로 구성
// - EN: 외국인을 위한 자연스러운 요약 번역
// - JP, CN: 우선 EN 내용을 재사용 (추후 개별 번역 시 교체)

export const recoveryGuideContent: RecoveryContentByLang = {
  KR: {
    jaw: {
      title: "턱·윤곽·양악 수술",
      badge: "뼈 수술",
      summary: "턱·윤곽·양악 등 얼굴 뼈 구조가 크게 변하는 수술군",
      recommended: "권장 회복 기간: 4주 이상",
      procedures:
        "V라인축소술, 사각턱수술, 턱끝수술, 턱끝축소, 피질절골, 교근축소술, 비절개턱성형, 이중턱근육묶기, 하악수술, 상악수술, 양악수술, 턱끝보형물, 턱끝보형물제거, 턱끝이물질제거",
      weeks: [
        {
          label: "🕐 1주차 (Day 0–7)",
          subtitle: "몸이 ‘수술을 인지하고 가장 강하게 반응하는 시기’",
          description: [
            "수술 부위와 주변 조직이 ‘얼굴 구조에 큰 변화가 생겼다’는 사실을 인지하며 붓기, 멍, 당김, 압박감을 가장 강하게 만들어내는 단계입니다.",
            "뼈의 위치가 바뀌고, 그 위를 덮고 있던 근육·피부·신경이 아직 새로운 위치에 적응하지 못해 얼굴은 실제 결과보다 더 부어 있고, 더 넓고, 더 둔탁해 보이는 것이 정상입니다.",
            "이 시기의 외형은 수술 결과를 판단할 수 있는 기준이 아니며, 의학적으로도 ‘회복 전 단계의 임시 모습’에 해당합니다.",
            "몸의 입장에서는 아직 회복이 본격적으로 진행되기보다는 ‘회복을 시작하기 위한 준비 단계’라고 이해하시면 됩니다.",
          ],
          tips: [
            "가능한 한 일정은 최소화하고, 회복을 최우선으로 두기",
            "수면 시 머리를 살짝 높여 붓기 압력 줄이기",
            "하루 여러 번, 방 안이나 복도에서 3–5분 정도 짧게 걷기 (혈액순환과 붓기 관리에 도움이 됩니다)",
          ],
          cautions: [
            "거울을 자주 보며 결과를 평가하지 않기",
            "무리한 외출, 장시간 이동 피하기",
            "통증·붓기가 있다고 해서 ‘문제가 생겼다’고 단정하지 않기",
          ],
          quote:
            "이 시기의 목표는 ‘얼굴이 예뻐 보이게 만드는 것’이 아니라 ‘붓기를 키우지 않고, 몸이 회복을 시작하도록 돕는 것’입니다.",
        },
        {
          label: "🕑 2주차 (Day 8–14)",
          subtitle: "강한 붓기는 줄고, ‘변화의 방향’이 보이기 시작하는 시기",
          description: [
            "2주차부터는 수술 직후의 강한 염증 반응이 조금씩 가라앉으면서 얼굴 전체 부피감이 서서히 줄어듭니다.",
            "아직은 큰 붓기와 잔붓기가 섞여 있는 과도기이기 때문에 아침에는 둔탁하고, 오후에는 조금 가벼워지는 ‘아침–저녁 컨디션 차이’를 느낄 수 있습니다.",
            "이 패턴은 턱·윤곽·양악 수술에서 매우 흔한 회복 양상이며, 회복이 잘못되고 있다는 신호가 아닙니다.",
            "이 시점에서는 ‘윤곽이 이런 방향으로 바뀌는구나’ 정도의 큰 흐름만 가볍게 확인하시면 충분합니다.",
          ],
          tips: [
            "카페·쇼핑몰처럼 앉아서 쉬는 시간이 포함된 일정 위주로 외출하기",
            "사진은 조명·각도를 고정해서 기록용으로만 남기기",
            "가벼운 산책은 붓기 순환에 도움이 됩니다.",
          ],
          cautions: [
            "수술 전 사진이나 타인의 후기와 과도하게 비교하지 않기",
            "과음·밤샘 일정은 붓기 회복을 늦출 수 있으므로 피하기",
            "‘왜 아직도 부어 있지?’라는 조급한 판단 줄이기",
          ],
        },
        {
          label: "🕒 3주차 (Day 15–21)",
          subtitle: "겉으로는 자연스러워 보이고, 몸은 적응을 마무리하는 시기",
          description: [
            "3주차에는 외관상 붓기가 많이 정리되어 주변 사람들은 이미 자연스럽다고 느끼는 경우가 많습니다.",
            "하지만 턱 주변 근육·관절·저작 근육은 여전히 새로운 위치와 사용 패턴에 적응을 마무리하는 단계에 있습니다.",
            "하루 일정을 많이 소화했거나 말을 많이 한 날에는 턱이 뻐근하거나 피로감이 다시 느껴질 수 있는데, 이는 적응 과정에서 나타나는 정상적인 신호입니다.",
          ],
          tips: [
            "사진 촬영, 가벼운 여행 일정은 가능합니다.",
            "일정 중간중간 의도적으로 쉬는 시간을 넣어주기",
            "피곤한 날은 일정을 줄이는 것도 회복의 일부라고 생각하기",
          ],
          cautions: [
            "격한 운동이나 턱을 과하게 쓰는 활동은 아직 피하기",
            "‘이제 다 끝났다’는 생각으로 무리하지 않기",
          ],
        },
        {
          label: "🕓 4주차 (Day 22–28)",
          subtitle: "일상은 정상, 회복은 아직 진행 중인 시기",
          description: [
            "4주차가 되면 일상생활·출근·일반적인 여행은 대부분 가능합니다.",
            "하지만 턱·윤곽·양악 수술의 진짜 안정화는 3–6개월에 걸쳐 진행되기 때문에, 지금 모습은 ‘최종 결과’라기보다 안정적으로 회복되고 있는 중간 단계입니다.",
            "이 시점에서 너무 엄격하게 결과를 평가하면 불필요한 불안만 커질 수 있습니다.",
          ],
          tips: [
            "가벼운 운동은 의료진이 허용한 범위 내에서 천천히 시작",
            "1·2주차 기록 사진과 비교하며 변화 확인하기",
            "피로 신호가 오면 휴식을 최우선으로 두기",
          ],
          cautions: [
            "4주차에 결과를 단정 짓지 않기",
            "‘아직 불편하다 = 실패’로 연결하지 않기",
          ],
          quote:
            "지금 얼굴은 이미 충분히 회복이 잘 진행되고 있고, 앞으로 더 편안해질 여지가 남아 있는 상태입니다.",
        },
      ],
      summaryTitle: "이 그룹의 핵심 정리",
      summaryBody: [
        "턱·윤곽·양악 수술의 회복은 속도가 아니라 순서입니다.",
        "지금 주차에 맞는 관리만 꾸준히 해주고 있다면, 결과는 대부분 그 다음에 자연스럽게 따라옵니다.",
      ],
    },
    // 나머지 그룹들은 우선 간단한 요약 버전만 구성 (필요 시 점진적으로 세부 문구 보강)
    breast: {
      title: "가슴 + 유두·유륜 + 여유증 + 부유방",
      badge: "가슴 수술",
      summary:
        "보형물·지방이식·거상·축소 및 유두·유륜·여유증·부유방 수술군의 회복 흐름",
      procedures:
        "가슴보형물 / 가슴보형물+지방이식 / 가슴거상술 / 가슴거상술+확대 / 가슴축소 / 가슴보형물제거 / 가슴이물질제거 / 가슴재수술 / 가슴지방이식 / 부유방흡입 / 부유방제거수술 / 몽고메리결절제거 / 유두축소 / 유륜미백 / 유륜축소 / 유륜문신 / 함몰유두교정 / 여유증(시술) / 여유증수술",
      weeks: [
        {
          label: "🕐 1주차 (Day 0–7)",
          subtitle: "몸이 '상체 구조 변화'를 강하게 인지하는 시기",
          description: [
            "가슴뿐 아니라 흉곽·겨드랑이·등·어깨까지 상체 전체가 무게 중심과 구조가 바뀌었다는 사실을 인지하며 통증, 압박감, 묵직함, 당김을 강하게 느끼는 단계입니다.",
            "겉으로 보이는 모양은 실제 결과보다 더 위로 올라가 있고 단단하며 부자연스럽게 보일 수 있지만, 이 시기의 외형은 최종 결과와 직접적인 연관이 없습니다.",
          ],
          tips: [
            "상체를 완전히 눕히지 말고 베개를 이용해 살짝 세운 자세로 휴식",
            "압박 브라·붕대는 불편해도 지시된 기간 동안 유지",
            "팔 사용을 최소화하고 모든 동작은 천천히 하기",
          ],
          cautions: [
            "팔을 머리 위로 드는 동작, 갑작스러운 상체 회전 금지",
            "무거운 가방이나 캐리어 들지 않기",
            "거울을 자주 보며 모양을 평가하지 않기",
          ],
        },
        {
          label: "🕑 2주차 (Day 8–14)",
          subtitle: "통증은 줄고, 묵직함이 중심이 되는 시기",
          description: [
            "날카로운 통증보다는 묵직함·당김·뻐근함이 중심이 되는 시기입니다.",
            "보형물·거상 수술은 아직 윗가슴이 높고 단단하게 느껴질 수 있고, 축소·여유증 수술은 어깨와 목이 가벼워지면서 절개 부위가 예민해질 수 있습니다.",
          ],
          tips: [
            "앉아서 쉴 수 있는 짧은 일정 위주로 구성",
            "앞에서 여미는 옷, 부드러운 면 소재 착용",
            "흉터 부위는 문지르지 말고 처방된 연고만 사용",
          ],
          cautions: [
            "와이어 브라, 타이트한 상의 착용 금지",
            "쇼핑처럼 팔을 반복적으로 많이 쓰는 일정 자제",
            "흉터 색·가슴 위치를 하루 단위로 비교하지 않기",
          ],
        },
        {
          label: "🕒 3주차 (Day 15–21)",
          subtitle: "일상 동작은 가능하지만, 상체 보호는 계속 필요한 시기",
          description: [
            "카페·쇼핑·가벼운 외출 등 대부분의 일상 동작이 가능해집니다.",
            "사진상으로는 자연스러워 보이지만 촉감·움직임에서는 아직 완전히 내 몸 같은 느낌까지는 아닐 수 있습니다.",
          ],
          tips: [
            "실내 위주 일정, 짧은 근교 이동 추천",
            "앉아서 쉴 수 있는 동선을 우선 선택",
            "쿠션 있는 의자를 사용해 상체 부담 줄이기",
          ],
          cautions: [
            "점프, 상체 근력 운동, 격한 팔 동작은 아직 금지",
            "‘이제 다 괜찮다’는 생각으로 관리를 갑자기 줄이지 않기",
          ],
        },
        {
          label: "🕓 4주차 (Day 22–28)",
          subtitle: "겉보기엔 안정적이지만, 조직은 계속 자리 잡는 중",
          description: [
            "외출·출근·여행이 대부분 가능해지고 타인이 보기엔 수술 티가 거의 나지 않을 수 있습니다.",
            "다만 안쪽 조직의 안정은 3–6개월에 걸쳐 진행되므로 지금 모습은 완성이 아니라 중간 단계에 해당합니다.",
          ],
          tips: [
            "일상 복귀는 가능하되 피로 누적 시 휴식 우선",
            "담당의 허용 시 가벼운 유산소 운동부터 시작",
            "흉터 관리 루틴을 생활화하기",
          ],
          cautions: [
            "고강도 운동·수영·웨이트는 반드시 의료진 상담 후 진행",
            "1개월 차 모습을 최종 결과로 확정 짓지 않기",
          ],
        },
      ],
      closingTitle: "의사·간호사 공통 안내",
      closingBody: [
        "가슴 수술은 짧은 시간에 완성되는 수술이 아니라 시간을 두고 점점 자연스러워지는 수술입니다.",
        "지금의 모습은 이미 회복이 안정적으로 진행되고 있는 상태이며, 앞으로 더 편안하고 자연스러운 형태로 이어질 가능성이 충분합니다.",
      ],
    },
    body: {
      title: "바디 지방흡입 · 거상 · 재수술 + 힙업 · 골반지방이식",
      badge: "바디 라인",
      summary: "몸 전체 실루엣과 힙업·골반 볼륨을 다루는 수술·시술군",
      procedures:
        "등지방흡입 / 러브핸들지방흡입 / 복부지방흡입 / 복부피부지방절제술 / 허벅지지방흡입 / 종아리지방흡입 / 발목지방흡입 / 무릎지방흡입 / 팔지방흡입 / 전신지방흡입 / 지방흡입재수술 / 복부거상술 / 팔거상술 / 목주름거상술 / 엉덩이지방이식 / 힙업성형 / 골반지방이식 / 손등지방이식",
      weeks: [
        {
          label: "🕐 1주차 (Day 0–7)",
          subtitle: "몸이 '바디 실루엣 변화'를 강하게 인지하는 시기",
          description: [
            "지방이 제거되거나 이동된 부위뿐 아니라 압박복이 닿는 범위 전체를 하나의 수술 부위로 인식하는 단계입니다.",
            "겉으로 보기엔 라인이 더 울퉁불퉁해 보이거나 부은 살 때문에 오히려 더 커 보일 수 있지만, 이 시기의 외형은 결과를 판단할 수 있는 단계가 아닙니다.",
          ],
          tips: [
            "압박복은 답답해도 의료진 지시에 맞춰 착용 유지",
            "침대에서 일어날 때는 옆으로 돌아누운 뒤 천천히 움직이기",
            "방 안이나 복도에서 짧게, 자주 걷기",
          ],
          cautions: [
            "‘지방이 빠졌는데 왜 더 부어 보이지?’라고 걱정하지 않기",
            "하루 만보 걷기, 무리한 산책은 금지",
            "압박복을 임의로 더 조이거나 마음대로 벗지 않기",
          ],
        },
        {
          label: "🕑 2주차 (Day 8–14)",
          subtitle: "붓기가 이동하며 실루엣이 오락가락하는 시기",
          description: [
            "아침에는 비교적 가벼운데 오후로 갈수록 다리·복부가 무거워지는 붓기 리듬을 느낄 수 있습니다.",
            "압박복을 벗었을 때 라인이 정리된 듯하다가도 울퉁불퉁해 보이는 과도기적인 모습이 나타날 수 있습니다.",
          ],
          tips: [
            "일정은 평지 위주, 엘리베이터 필수 동선으로 선택",
            "장시간 앉아 있을 땐 30–40분마다 자세 바꾸기",
            "수분 섭취를 늘려 림프 순환을 돕기",
          ],
          cautions: [
            "압박복을 벗은 상태로 장시간 외출하지 않기",
            "거울로 허벅지·복부를 확대해서 평가하지 않기",
            "하체 근력 운동·요가 스트레치는 아직 금지",
          ],
        },
        {
          label: "🕒 3주차 (Day 15–21)",
          subtitle: "몸이 '가벼워졌다'는 체감을 하기 시작하는 시기",
          description: [
            "바지·치마·원피스를 입었을 때 실루엣 변화가 눈에 띄게 느껴지기 시작합니다.",
            "촉감상 딱딱함이나 뭉침이 남아 있을 수 있지만 대부분 정상적인 회복 과정에 포함됩니다.",
          ],
          tips: [
            "근교 이동, 카페 투어 등 사진 위주 일정 가능",
            "쿠션 있는 의자·카페 좌석을 적극 활용",
            "가벼운 산책은 회복에 도움",
          ],
          cautions: [
            "달리기·점프·격한 하체 운동은 여전히 금지",
            "‘라인이 완성된 것 같다’는 생각으로 관리 중단하지 않기",
          ],
        },
        {
          label: "🕓 4주차 (Day 22–28)",
          subtitle: "라인은 정리되기 시작하지만, 아직은 중간 단계",
          description: [
            "외관상으로는 이미 충분히 달라진 몸처럼 느껴질 수 있습니다.",
            "하지만 바디 지방흡입·거상·지방이식의 진짜 완성은 3–6개월에 걸쳐 라인이 더 매끈해지면서 이루어집니다.",
          ],
          tips: [
            "가벼운 유산소·스트레칭은 단계적으로 시작",
            "피곤한 날엔 압박복 착용 시간을 다시 늘리기",
            "장시간 서 있는 일정 뒤에는 휴식을 우선하기",
          ],
          cautions: [
            "고강도 운동·헬스·러닝은 의료진 상담 후 시작",
            "1개월 차 몸을 최종 결과로 규정하지 않기",
          ],
        },
      ],
      closingTitle: "의사·간호사 공통 안내",
      closingBody: [
        "바디 수술은 눈에 보이는 변화보다 몸 안에서의 회복이 더 오래 걸리는 수술입니다.",
        "지금의 몸은 이미 회복이 안정 궤도에 올라 있으며, 시간이 지날수록 라인은 더 부드럽고 자연스럽게 이어질 가능성이 충분합니다.",
      ],
    },
    upperFace: {
      title: "광대 · 관자 · 이마 · 뒤통수 · 눈썹뼈 · 안면윤곽 재수술",
      badge: "상안면 윤곽",
      summary: "얼굴 윗구조와 안면윤곽 재수술에 해당하는 수술군",
      procedures:
        "광대보형물 / 광대축소(앞광대·옆광대·전체) / 퀵광대 / 앞광대보형물 / 관자놀이보형물 / 관자놀이축소술 / 이마보형물 / 이마축소 / 눈썹뼈축소술 / 뒤통수보형물 / 광대이물질제거 / 관자놀이이물질제거 / 이마이물질제거 / 심부볼제거 / 안면윤곽재수술",
      weeks: [
        {
          label: "🕐 1주차 (Day 0–7)",
          subtitle: "얼굴 '윗구조 전체가 바뀌었다'고 인식하는 시기",
          description: [
            "광대·관자·이마·눈썹뼈·뒤통수 중 한 부위만 수술했더라도 몸은 상·중안면 전체를 하나의 수술 부위로 인식합니다.",
            "얼굴 윗부분이 헬멧을 쓴 것처럼 단단하고 무겁게 느껴질 수 있으며, 정면에서 폭이 넓어 보이고 윤곽이 둔탁해 보이는 것이 정상입니다.",
          ],
          tips: [
            "머리는 너무 높이지 말고 살짝만 올린 상태로 휴식",
            "얼굴을 손으로 만지거나 문지르지 않기",
            "실내 위주로 조용히 지내며 자극 최소화",
          ],
          cautions: [
            "거울을 자주 보며 얼굴 폭·광대 크기 평가하지 않기",
            "모자를 깊게 눌러 쓰거나 얼굴을 압박하지 않기",
            "웃음·표정을 과도하게 사용하지 않기",
          ],
        },
        {
          label: "🕑 2주차 (Day 8–14)",
          subtitle: "붓기 속에서 윤곽이 보이기 시작하는 시기",
          description: [
            "붓기가 한 번에 빠지기보다 부위별로 다르게 움직이며 윤곽이 오락가락하는 느낌을 줄 수 있습니다.",
            "정면에서는 여전히 넓어 보일 수 있지만, 측면이나 45도 각도에서 이전과 다른 입체감이 보이기 시작합니다.",
          ],
          tips: [
            "오전보다 오후 컨디션 기준으로 일정 잡기",
            "머리카락·앞머리·모자를 활용해 윤곽을 자연스럽게 정리",
            "카페·전시 등 앉아서 쉬는 일정 위주로 구성",
          ],
          cautions: [
            "조명 강한 장소에서 얼굴 클로즈업 촬영 피하기",
            "광대·관자 부위를 누르거나 마사지하지 않기",
            "하루 단위로 얼굴 윤곽을 비교 분석하지 않기",
          ],
        },
        {
          label: "🕒 3주차 (Day 15–21)",
          subtitle: "주변에서 변화가 먼저 보이는 시기",
          description: [
            "본인보다 주변에서 ‘얼굴 작아졌다’, ‘입체감이 생겼다’는 말을 먼저 듣는 경우가 많아지는 시기입니다.",
            "사진에서 변화가 특히 잘 드러나며, 여행·촬영 일정도 비교적 자유로워집니다.",
          ],
          tips: [
            "한복 스냅, 카페 촬영 등 사진 일정 가능",
            "장시간 촬영 시 중간중간 휴식 시간 넣기",
            "머리카락 스타일로 윤곽을 부드럽게 보완",
          ],
          cautions: [
            "격한 표정 연기, 장시간 웃음 유지는 피하기",
            "밤샘·과음으로 붓기 재발 유발하지 않기",
          ],
        },
        {
          label: "🕓 4주차 (Day 22–28)",
          subtitle: "겉보기엔 자연스럽지만, 안쪽 구조는 계속 적응 중",
          description: [
            "타인이 보기엔 수술 여부를 알아채기 어려울 정도로 윤곽이 자연스러워질 수 있습니다.",
            "하지만 뼈·근막·연부조직이 함께 움직인 수술이기 때문에 3–6개월 동안 미세한 변화가 계속됩니다.",
          ],
          tips: [
            "일상 복귀는 가능하되 피로 누적 시 즉시 휴식",
            "가벼운 스트레칭·산책은 회복에 도움",
            "3개월 차를 기준으로 변화 관찰하기",
          ],
          cautions: [
            "경락·윤곽 마사지·강한 압박은 아직 금지",
            "미세한 비대칭을 과도하게 확대 해석하지 않기",
          ],
        },
      ],
      closingTitle: "의사·간호사 공통 안내",
      closingBody: [
        "상안면 윤곽 수술은 짧은 시간에 완성되는 수술이 아니라 시간이 지나면서 자연스럽게 자리 잡는 수술입니다.",
        "지금의 모습은 회복이 매우 정상적으로 진행되고 있는 상태이며, 앞으로 더 부드럽고 안정적인 윤곽으로 이어질 가능성이 충분합니다.",
      ],
    },
    nose: {
      title: "코끝 · 콧볼 · 복코 · 비공 라인 개선",
      badge: "코 성형",
      summary: "코끝·콧볼·복코·비공 및 콧대 라인을 다루는 수술·시술군",
      procedures:
        "복코교정(수술) / 복코교정(시술) / 콧볼축소 / 비절개콧볼축소 / 코끝보형물 / 코끝자가연골 / 코끝기증연골 / 코끝기증진피 / 비공내리기 / 비절개코끝시술 / 미스코 / 하이코 / 고양이수술 / 콧대보형물 / 콧대인공조직 / 콧대자가조직 / 비주연장술 / 코길이연장술 / 비절개코교정",
      weeks: [
        {
          label: "🕐 1주차 (Day 0–7)",
          subtitle:
            "코가 '호흡·표정·중심 구조 변화'를 동시에 인지하는 시기",
          description: [
            "코끝·콧볼·비공·콧대 중 한 부위만 시술했더라도 얼굴의 중심 구조가 바뀌었다고 인지하며 붓기·압박감·당김·이물감이 가장 강하게 나타나는 단계입니다.",
            "겉으로 보이는 코는 실제 결과보다 더 크고 뭉툭하거나 더 들려 보일 수 있으며, 콧볼이 넓어 보이거나 코끝이 둔해 보이는 착시가 생기기 쉽습니다.",
          ],
          tips: [
            "얼굴을 베개·손에 파묻지 않고 정면을 향한 자세 유지",
            "물을 자주 마셔 비강·점막 건조를 방지",
            "병원에서 안내한 세척·연고·찜질 루틴만 정확히 지키기",
          ],
          cautions: [
            "코를 비비거나 만지는 행동 금지",
            "마스크를 코끝에 강하게 눌러 쓰지 않기",
            "뜨거운 음식·과음으로 붓기를 유발하지 않기",
          ],
        },
        {
          label: "🕑 2주차 (Day 8–14)",
          subtitle:
            "붓기 속에서 '코 라인의 방향성'이 보이기 시작하는 시기",
          description: [
            "코끝과 콧볼의 붓기가 조금씩 정리되며 ‘방향은 이렇게 잡혔구나’라는 느낌이 들기 시작합니다.",
            "수술 계열은 여전히 단단함과 당김이 남아 있지만, 정면·측면에서 이전과 다른 실루엣이 서서히 보이기 시작합니다.",
          ],
          tips: [
            "마스크는 사람 많은 곳에서만 착용하고 압박은 최소화",
            "카페·쇼핑 등 가벼운 외출 가능",
            "사진은 자연광에서 정면·45도 각도로 기록",
          ],
          cautions: [
            "콧볼·코끝을 눌러 모양 확인하지 않기",
            "‘아직 뭔가 어색하다’는 감정을 과도하게 키우지 않기",
            "강한 햇빛·사우나·찜질방 피하기",
          ],
        },
        {
          label: "🕒 3주차 (Day 15–21)",
          subtitle: "사진과 일상에서 코 변화가 자연스럽게 드러나는 시기",
          description: [
            "코가 얼굴 전체에 자연스럽게 섞여 보이기 시작합니다.",
            "수술 계열도 일반적인 사진·영상에서는 수술 티가 크게 느껴지지 않을 수 있으며, 시술 계열은 가장 예쁘게 라인이 유지되는 시기입니다.",
          ],
          tips: [
            "포토부스·카페 촬영·스냅 사진 가능",
            "살짝 위에서 아래로 찍는 각도가 안정적",
            "피부톤 위주의 가벼운 메이크업부터 시작",
          ],
          cautions: [
            "사람 많은 곳에서 부딪히지 않도록 주의",
            "과음·밤샘 일정으로 붓기 재발 유발하지 않기",
          ],
        },
        {
          label: "🕓 4주차 (Day 22–28)",
          subtitle: "남에게는 완성처럼 보이지만, 코는 계속 변하는 중",
          description: [
            "4주차 코는 주변 사람이 보기에 이미 충분히 자연스럽고 안정적으로 보일 수 있습니다.",
            "하지만 코끝·콧볼·복코·비공 라인은 연골·연부조직·피부가 함께 적응하는 구조라 3–6개월까지도 미세한 변화가 이어집니다.",
          ],
          tips: [
            "일상·여행·비행 대부분 무리 없이 가능",
            "3개월 차 사진을 기준으로 변화 비교 계획 세우기",
            "코 주변 자극 없는 생활 습관 유지",
          ],
          cautions: [
            "코 마사지·경락·강한 압박은 아직 금지",
            "미세한 높이·각도 차이에 집착하지 않기",
          ],
        },
      ],
      closingTitle: "의사·간호사 공통 안내",
      closingBody: [
        "코 성형과 코 라인 시술은 얼굴 중심에 위치한 만큼 회복 과정에서 심리적 흔들림이 큰 편입니다.",
        "지금의 변화는 정상적인 회복 흐름 안에 있으며, 시간이 지날수록 표정과 조화롭게 어우러진 코로 이어질 가능성이 충분합니다.",
      ],
    },
    eyeSurgery: {
      title: "눈 성형 · 트임 · 눈밑 지방 · 재수술",
      badge: "눈 성형",
      summary: "쌍꺼풀·트임·눈밑 수술 및 재수술 전반",
      procedures:
        "쌍꺼풀(매몰/부분절개/자연유착/절개), 눈매교정, 돌출눈수술, 상안검성형, 아이링, 하안검성형, 앞트임, 뒤트임, 밑트임, 윗트임, 레이저트임성형, 몽고트임, 트임복원, 눈꺼풀지방제거, 눈밑지방재배치, 눈밑지방제거, 눈재수술, 트임재수술",
      weeks: [
        {
          label: "🕐 1주차 (Day 0–7)",
          subtitle: "눈이 '시야·표정·피로'를 동시에 인지하는 시기",
          description: [
            "눈꺼풀·눈꼬리·눈밑 중 어느 한 부위만 수술했더라도 눈 주변 전체가 시야와 표정 구조가 바뀌었다고 인지하며 붓기·압박감·이물감·당김이 가장 강하게 나타나는 단계입니다.",
            "겉으로 보이는 눈은 실제 결과보다 라인이 높고 두껍게 보이거나, 트임 부위가 과장돼 보이고, 눈밑이 울퉁불퉁하거나 부풀어 보이는 것이 정상입니다.",
          ],
          tips: [
            "화면 사용은 최소화하고 눈 감고 쉬는 시간을 자주 갖기",
            "처방된 냉찜질·안약·인공눈물 루틴을 정확히 지키기",
            "실내 조명은 부드럽게, 직사광선은 피하기",
          ],
          cautions: [
            "눈 비비기, 세게 깜빡이기 금지",
            "렌즈 착용, 아이메이크업은 아직 금지",
            "거울로 라인 높이·대칭을 반복 평가하지 않기",
          ],
        },
        {
          label: "🕑 2주차 (Day 8–14)",
          subtitle: "붓기 속에서 '눈 라인의 방향'이 보이기 시작하는 시기",
          description: [
            "눈꺼풀과 눈밑 붓기가 조금씩 내려가며 라인이 이렇게 잡히는구나 하는 방향성이 느껴지기 시작합니다.",
            "쌍꺼풀·눈매교정 수술은 여전히 원하는 라인보다 조금 더 진하고 과장돼 보일 수 있지만, 이는 붓기와 아직 풀리지 않은 근육 반응 때문입니다.",
          ],
          tips: [
            "가벼운 외출·카페 일정은 가능",
            "마스크·선글라스로 눈 주변 자극 최소화",
            "사진은 정면보다는 45도 각도 위주로 기록",
          ],
          cautions: [
            "진한 아이메이크업·마스카라 사용은 자제",
            "눈꼬리·눈밑을 손으로 눌러 확인하지 않기",
            "하루 단위로 라인 변화를 집요하게 비교하지 않기",
          ],
        },
        {
          label: "🕒 3주차 (Day 15–21)",
          subtitle: "사진과 표정에서 눈 변화가 자연스럽게 드러나는 시기",
          description: [
            "사진·영상·대화 중 표정에서 눈의 변화가 비교적 자연스럽게 드러나는 시기입니다.",
            "쌍꺼풀·트임·눈밑 수술은 사진상으로 수술 티가 거의 느껴지지 않을 수 있으며, 눈매 인상이 전반적으로 또렷해집니다.",
          ],
          tips: [
            "포토부스·셀프사진관·한복 스냅 촬영 가능",
            "가벼운 아이메이크업은 단계적으로 시작",
            "자연광에서 찍은 사진으로 변화 기록",
          ],
          cautions: [
            "밤샘·과음으로 눈 붓기 재발 유발하지 않기",
            "장시간 촬영으로 눈 피로를 누적시키지 않기",
          ],
        },
        {
          label: "🕓 4주차 (Day 22–28)",
          subtitle: "남에게는 자연스럽지만, 눈은 계속 안정되는 중",
          description: [
            "4주차가 되면 주변에서 ‘눈이 훨씬 또렷해졌다’는 말을 듣기 쉬운 시기입니다.",
            "하지만 눈 성형은 라인·흉터·근육 움직임이 3–6개월에 걸쳐 서서히 더 부드러워지는 수술입니다.",
          ],
          tips: [
            "일상생활 대부분 무리 없이 가능",
            "렌즈 착용은 반드시 의료진 허용 후 시작",
            "눈가 보습·자외선 차단에 신경 쓰기",
          ],
          cautions: [
            "눈가 마사지·경락은 아직 금지",
            "미세한 라인 차이에 과도하게 집착하지 않기",
          ],
        },
      ],
      closingTitle: "의사·간호사 공통 안내",
      closingBody: [
        "눈 성형은 얼굴 인상을 크게 바꾸는 수술인 만큼 회복 과정에서 심리적인 기복이 생기기 쉽습니다.",
        "지금의 변화는 정상적인 회복 흐름 안에 있으며, 시간이 지날수록 표정과 자연스럽게 어우러진 눈으로 이어질 가능성이 충분합니다.",
      ],
    },
    eyeVolume: {
      title: "눈 지방이식 · 눈물골 · 애교살 · 눈 주변 지방",
      badge: "눈 볼륨 시술",
      summary: "눈밑·눈물골·애교살 지방이식·필러 등 볼륨 교정 시술군",
      procedures:
        "눈지방이식 / 눈밑지방이식 / 눈물골지방이식 / 애교살지방이식 / 눈주변지방이식 / 눈밑꺼짐교정 / 눈밑꺼짐재수술 / 눈물골필러 / 애교살필러 / 눈밑필러 / 눈지방재배치(보완) / 눈밑지방이식재수술",
      weeks: [
        {
          label: "🕐 1주차 (Day 0–7)",
          subtitle: "눈 주변이 '볼륨 변화와 압박'을 동시에 인지하는 시기",
          description: [
            "피부가 얇고 혈관이 많은 눈밑·눈물골·애교살 부위에 볼륨이 새로 들어오면서 몸이 이를 강하게 인지하는 단계입니다.",
            "조금만 부어도 다크서클처럼 어둡게 보이거나 눈이 더 부어 보이는 착시가 생기기 쉽습니다.",
          ],
          tips: [
            "고개를 너무 숙이지 않고 정면을 향한 자세 유지",
            "엎드려 자지 말고, 베개를 살짝 높여 수면",
            "눈 주변을 만지거나 눌러보지 않기",
          ],
          cautions: [
            "눈밑 볼륨을 손으로 만져 확인하지 않기",
            "거울을 가까이 대고 확대해서 보지 않기",
            "과한 메이크업으로 억지로 가리려 하지 않기",
          ],
        },
        {
          label: "🕑 2주차 (Day 8–14)",
          subtitle: "볼륨이 퍼지며 자연스러움을 찾아가는 시기",
          description: [
            "눈밑과 눈물골의 붓기가 서서히 빠지면서 볼륨이 한 지점에 몰려 보이던 느낌이 조금씩 퍼지기 시작합니다.",
            "지방이식은 자리 잡는 볼륨과 흡수될 볼륨이 섞여 있어 다소 오락가락해 보일 수 있습니다.",
          ],
          tips: [
            "자연광에서 정면·45도 각도로 변화 기록",
            "가벼운 아이메이크업 가능",
            "눈 밑이 건조하면 보습을 충분히 해주기",
          ],
          cautions: [
            "눈 주변 마사지·경락·지압 금지",
            "‘빠지는 것 같아 불안하다’는 감정에 휘둘리지 않기",
          ],
        },
        {
          label: "🕒 3주차 (Day 15–21)",
          subtitle: "눈 인상이 부드럽게 바뀌는 시기",
          description: [
            "눈밑 꺼짐·눈물골 음영이 완화되면서 피곤해 보이던 인상이 전반적으로 부드러워집니다.",
            "사진에서 다크서클이 옅어 보이거나 애교살이 자연스럽게 살아나는 변화를 체감하는 경우가 많습니다.",
          ],
          tips: [
            "촬영·데이트·약속 일정 무리 없이 가능",
            "자연스러운 웃는 표정 연습 가능",
            "충분한 수분 섭취 유지",
          ],
          cautions: [
            "강한 눈 화장으로 볼륨을 과하게 강조하지 않기",
            "눈 주변을 세게 문지르는 습관을 재개하지 않기",
          ],
        },
        {
          label: "🕓 4주차 (Day 22–28)",
          subtitle: "볼륨은 안정되고, 미세 조정만 남은 시기",
          description: [
            "눈밑과 애교살 볼륨은 외관상 상당히 안정돼 보이지만 지방이식의 경우 최종 생착률은 아직 확정되지 않은 상태입니다.",
            "눈 주변 볼륨 시술은 1개월은 안정 단계, 3개월이 진짜 판단 시점에 가깝습니다.",
          ],
          tips: [
            "일상·여행·촬영 대부분 무리 없이 가능",
            "눈가 보습과 자외선 차단을 생활화",
            "3개월 차를 기준으로 리터치 여부 판단 계획 세우기",
          ],
          cautions: [
            "눈가 마사지·경락은 아직 금지",
            "미세한 볼륨 차이에 집착하지 않기",
          ],
        },
      ],
      closingTitle: "의사·간호사 공통 안내",
      closingBody: [
        "눈 주변 볼륨 시술은 눈에 띄는 변화를 주지만 동시에 심리적인 예민함도 커질 수 있는 시술입니다.",
        "지금의 변화는 정상적인 회복 흐름 안에 있으며, 시간이 지날수록 더 자연스럽고 안정된 눈 인상으로 이어질 가능성이 충분합니다.",
      ],
    },
    faceFat: {
      title: "얼굴 지방이식 · 팔자 · 풀페이스 볼륨",
      badge: "얼굴 볼륨",
      summary: "얼굴 지방이식·팔자·풀페이스 볼륨 교정 시술군",
      procedures:
        "얼굴지방이식 / 풀페이스지방이식 / 이마지방이식 / 관자지방이식 / 앞광대지방이식 / 볼지방이식 / 팔자지방이식 / 인디언주름지방이식 / 마리오넷라인지방이식 / 입가주름지방이식 / 얼굴지방이식재수술 / 볼꺼짐교정 / 얼굴볼륨교정",
      weeks: [
        {
          label: "🕐 1주차 (Day 0–7)",
          subtitle: "얼굴이 '전체 볼륨 변화'를 강하게 인지하는 시기",
          description: [
            "특정 부위만 시술했더라도 얼굴 전체가 볼륨 중심이 바뀌었다고 인식하며 붓기·묵직함·당김·압박감을 강하게 느끼는 단계입니다.",
            "지방이 들어간 부위뿐 아니라 주변 조직까지 함께 반응해 얼굴이 전반적으로 커 보이거나 과하게 통통해 보일 수 있습니다.",
          ],
          tips: [
            "얼굴을 아래로 오래 숙이지 않고 정면 자세 유지",
            "베개를 살짝 높여 붓기 압력을 줄이기",
            "외출은 최소화하고 숙소에서 충분히 휴식",
          ],
          cautions: [
            "얼굴을 누르거나 만져서 볼륨 확인하지 않기",
            "‘너무 과한 것 같다’는 생각으로 조급해하지 않기",
          ],
        },
        {
          label: "🕑 2주차 (Day 8–14)",
          subtitle: "볼륨이 퍼지며 얼굴 비율이 정리되기 시작하는 시기",
          description: [
            "얼굴에 몰려 있던 붓기가 조금씩 퍼지면서 볼륨이 부위별로 정리되기 시작합니다.",
            "이마·관자·앞광대는 먼저 안정되는 편이고, 팔자·입가·마리오넷 라인은 상대적으로 붓기가 늦게 빠질 수 있습니다.",
          ],
          tips: [
            "자연광에서 정면·45도 사진으로 변화 기록",
            "가벼운 메이크업 가능",
            "수분 섭취를 늘려 순환을 돕기",
          ],
          cautions: [
            "얼굴 마사지·경락·롤러 사용 금지",
            "거울을 가까이 대고 확대해서 비교하지 않기",
          ],
        },
        {
          label: "🕒 3주차 (Day 15–21)",
          subtitle: "인상이 부드러워지고, 볼륨감이 자연스럽게 느껴지는 시기",
          description: [
            "얼굴이 과하게 통통해 보이던 느낌이 줄고 전체 인상이 한결 부드러워집니다.",
            "사진에서 광대·팔자·입가 라인이 자연스럽게 이어져 보이며 피곤해 보이던 인상이 완화됩니다.",
          ],
          tips: [
            "촬영·약속·데이트 일정 무리 없이 가능",
            "평소 스타일 메이크업으로 점진적 복귀",
            "충분한 수면으로 생착 환경 유지",
          ],
          cautions: [
            "강한 경락·압박 마사지는 금지",
            "급격한 체중 감량 시도 피하기",
          ],
        },
        {
          label: "🕓 4주차 (Day 22–28)",
          subtitle: "볼륨은 안정되지만, 최종 판단은 아직 이른 시기",
          description: [
            "외관상 얼굴 볼륨이 상당히 자연스럽게 느껴질 수 있습니다.",
            "하지만 얼굴 지방이식은 1개월은 안정 단계, 3개월이 최종 생착 판단 시점입니다.",
          ],
          tips: [
            "일상·여행·촬영 대부분 가능",
            "자외선 차단과 보습 관리 지속",
            "체중 변화 없이 생활 리듬 유지",
          ],
          cautions: [
            "얼굴 마사지·고주파 시술은 의료진 상담 후 진행",
            "1개월 차 얼굴을 최종 결과로 단정하지 않기",
          ],
        },
      ],
      closingTitle: "의사·간호사 공통 안내",
      closingBody: [
        "얼굴 지방이식과 볼륨 교정은 시간을 두고 자연스럽게 완성되는 시술입니다.",
        "지금의 인상은 회복이 안정적으로 진행되고 있는 상태이며, 시간이 지날수록 표정과 더 조화롭게 어우러진 얼굴로 이어질 가능성이 충분합니다.",
      ],
    },
    lifting: {
      title: "안면거상 · 이마거상 · 팔자박리 · 주름 개선 수술",
      badge: "거상 수술",
      summary: "안면거상·이마거상·팔자박리 등 주름 개선 수술군",
      procedures:
        "안면거상술 / 미니거상 / SMAS거상 / 목거상술 / 이마거상술 / 눈썹거상술 / 팔자박리술 / 마리오넷라인박리 / 중안면거상 / 하안면거상 / 주름개선수술 / 거상재수술",
      weeks: [
        {
          label: "🕐 1주차 (Day 0–7)",
          subtitle: "얼굴이 '당겨지고 재배치되었다'고 강하게 인지하는 시기",
          description: [
            "피부뿐 아니라 그 아래 근막(SMAS)과 연부조직이 함께 이동하면서 얼굴 전체가 강한 당김과 압박 변화를 인지하는 단계입니다.",
            "겉으로는 더 당겨져 보이거나 귀 주변·두피·턱선이 어색해 보일 수 있지만, 아직 결과 판단 단계는 아닙니다.",
          ],
          tips: [
            "얼굴을 과하게 움직이지 않고 표정 사용 최소화",
            "수면 시 머리를 살짝 높여 당김·부종 완화",
            "병원에서 안내한 압박 밴드·거즈 관리를 철저히 하기",
          ],
          cautions: [
            "입을 크게 벌리는 동작, 과한 하품은 피하기",
            "귀 주변·두피를 손으로 만지거나 문지르지 않기",
          ],
        },
        {
          label: "🕑 2주차 (Day 8–14)",
          subtitle: "당김은 줄고, 붓기와 뻣뻣함이 남는 시기",
          description: [
            "초기의 강한 당김은 서서히 완화되고 뻣뻣함·묵직함·감각 둔함이 중심이 되는 시기입니다.",
            "신경과 조직이 새로운 위치에 적응하면서 위화감이 생길 수 있으나 대부분 정상적인 반응입니다.",
          ],
          tips: [
            "짧은 외출·카페 일정 가능",
            "부드러운 음식 위주로 천천히 식사",
            "얼굴을 아래로 오래 숙이지 않기",
          ],
          cautions: [
            "경락·마사지·롤러 사용 금지",
            "귀 뒤·두피 절개 부위를 눌러 확인하지 않기",
          ],
        },
        {
          label: "🕒 3주차 (Day 15–21)",
          subtitle: "얼굴 윤곽과 주름 개선 효과가 보이기 시작하는 시기",
          description: [
            "팔자·마리오넷·턱선이 전보다 정돈돼 보인다는 느낌을 받기 시작합니다.",
            "주변에서는 ‘피부가 정리됐다’, ‘인상이 단정해졌다’는 말을 먼저 듣는 경우도 많아집니다.",
          ],
          tips: [
            "촬영·약속·가벼운 여행 일정 가능",
            "웃는 표정은 자연스럽게, 과하지 않게",
            "자외선 차단과 보습 관리에 신경 쓰기",
          ],
          cautions: [
            "장시간 웃거나 말해야 하는 일정은 무리하지 않기",
            "밤샘·과음으로 붓기 재발 유발하지 않기",
          ],
        },
        {
          label: "🕓 4주차 (Day 22–28)",
          subtitle: "겉보기엔 정리됐지만, 안쪽은 계속 안정 중",
          description: [
            "타인이 보기엔 주름 개선과 윤곽 변화가 자연스럽게 느껴질 수 있습니다.",
            "하지만 근막과 조직의 위치를 바꾸는 수술이기 때문에 최종 안정까지 3–6개월이 필요합니다.",
          ],
          tips: [
            "일상·출근·외출 대부분 무리 없이 가능",
            "가벼운 산책·스트레칭부터 단계적으로 운동 재개",
            "흉터 관리 루틴을 생활화",
          ],
          cautions: [
            "강한 얼굴 마사지·고주파 시술은 의료진 상담 후",
            "1개월 차 얼굴을 최종 결과로 규정하지 않기",
          ],
        },
      ],
      closingTitle: "의사·간호사 공통 안내",
      closingBody: [
        "안면거상과 주름 개선 수술은 시간이 지나면서 ‘잘 당긴 얼굴’이 아니라 ‘정돈된 인상’으로 완성되는 수술입니다.",
        "지금의 변화는 정상적인 회복 흐름 안에 있으며, 앞으로 더 부드럽고 자연스러운 인상으로 이어질 가능성이 충분합니다.",
      ],
    },
    procedures: {
      title: "시술 (필러 · 보톡스 · 지방분해 · 리프팅 · 레이저)",
      badge: "시술",
      summary: "필러·보톡스·지방분해·리프팅·레이저 전반",
      procedures:
        "이마필러 / 관자필러 / 앞광대필러 / 볼필러 / 팔자필러 / 마리오넷필러 / 입술필러 / 턱끝필러 / 코필러 / 애교필러 / 눈밑필러 / 필러제거주사 / 필러제거수술 / 보톡스(사각턱·이마·미간·눈가·턱끝·스킨보톡스) / 지방분해주사 / 윤곽주사 / 인모드 / 슈링크 / 울쎄라 / 써마지 / 온다 / 튠페이스 / IPL / 토닝 / 피코레이저 / 프락셀 / 제네시스 / 잡티·홍조·모공 레이저 전반",
      weeks: [
        {
          label: "🕐 1주차 (Day 0–7)",
          subtitle: "몸이 '자극과 변화'를 동시에 인지하는 시기",
          description: [
            "수술이 아닌 시술이라도 피부·지방층·근육·혈관이 외부 자극과 볼륨 변화를 인지하며 붓기·열감·뻐근함·이물감을 보이는 단계입니다.",
            "필러·보톡스는 주입 직후 모양보다 조직 반응이 먼저 나타나기 때문에 더 부어 보이거나 뭉쳐 보이거나 어색해 보일 수 있습니다.",
          ],
          tips: [
            "시술 부위는 만지지 않고 자극을 최소화",
            "충분한 수분 섭취로 순환 돕기",
            "세안·메이크업은 병원 안내 시점 이후부터 시작",
          ],
          cautions: [
            "시술 부위를 눌러 모양 확인하지 않기",
            "사우나·찜질방·격한 운동 피하기",
            "시술 다음 날 얼굴로 결과 판단하지 않기",
          ],
        },
        {
          label: "🕑 2주차 (Day 8–14)",
          subtitle: "자극은 가라앉고, 효과의 방향이 보이기 시작하는 시기",
          description: [
            "초기 붓기와 열감이 줄어들며 필러 볼륨·윤곽 변화·피부결 개선의 방향성이 서서히 느껴지기 시작합니다.",
            "보톡스는 이 시점부터 근육 힘이 약해지거나 표정이 부드러워졌다는 체감이 생깁니다.",
          ],
          tips: [
            "가벼운 외출·촬영 가능",
            "자외선 차단을 철저히 유지",
            "피부 보습 루틴을 평소보다 강화",
          ],
          cautions: [
            "필러·보톡스 효과를 거울로 집요하게 분석하지 않기",
            "추가 시술을 즉흥적으로 결정하지 않기",
          ],
        },
        {
          label: "🕒 3주차 (Day 15–21)",
          subtitle: "시술 효과가 얼굴에 자연스럽게 섞이는 시기",
          description: [
            "필러·보톡스·리프팅 효과가 얼굴 전체 인상에 자연스럽게 녹아들기 시작하는 시기입니다.",
            "주변에서 ‘뭔가 달라 보인다’는 말을 먼저 듣는 경우가 많아지고, 사진에서도 피부결·윤곽·볼륨 변화가 안정적으로 보입니다.",
          ],
          tips: [
            "데이트·여행·촬영 일정 무리 없이 가능",
            "평소 메이크업 루틴으로 복귀",
            "충분한 수면과 수분 섭취 유지",
          ],
          cautions: [
            "과음·밤샘으로 시술 효과를 소모시키지 않기",
            "피부가 안정됐다고 자극적인 관리 재개하지 않기",
          ],
        },
        {
          label: "🕓 4주차 (Day 22–28)",
          subtitle: "효과는 유지되고, 다음 관리 시점을 판단하는 시기",
          description: [
            "시술 효과는 외관상 충분히 안정돼 보이며, 대부분의 일상·여행·비행 일정에 무리가 없습니다.",
            "다만 필러·보톡스·리프팅·레이저는 유지 관리가 중요한 시술이므로, 이 시점은 완성이라기보다 다음 관리 시점을 계획하는 단계입니다.",
          ],
          tips: [
            "현재 상태를 기준으로 다음 시술 시점을 메모",
            "자외선 차단·보습·클렌징 루틴 유지",
            "과한 욕심보다 ‘지금 상태 유지’를 목표로 설정",
          ],
          cautions: [
            "효과가 좋다고 시술 주기를 무리하게 당기지 않기",
            "미세한 변화에 과도하게 집착하지 않기",
          ],
        },
      ],
      closingTitle: "의사·간호사 공통 안내",
      closingBody: [
        "시술은 짧은 시간에 인상을 바꿀 수 있지만, 가장 중요한 것은 지금 상태를 어떻게 유지하느냐입니다.",
        "지금의 변화는 정상적인 반응과 효과가 잘 나타난 상태이며, 생활 습관과 관리에 따라 훨씬 더 안정적으로 이어질 수 있습니다.",
      ],
    },
  },
  EN: {} as any, // EN, JP, CN은 아래에서 채움
  JP: {} as any,
  CN: {} as any,
};

// EN 버전: 한국어 내용을 간결하게 영어로 정리 (여기서는 jaw 그룹만 예시로 자세히, 나머지는 요약)
const enBase: Record<RecoveryGroupKey, RecoveryGroupContent> = {
  jaw: {
    title: "Jaw · Contouring · Orthognathic Surgery",
    badge: "Jaw & facial contouring surgery",
    summary:
      "Procedures that significantly change the jaw and facial bone structure, such as V-line and orthognathic surgery.",
    recommended: "Recommended recovery period: 4+ weeks",
    procedures:
      "V-line reduction, square jaw reduction, chin surgery, chin reduction, cortical osteotomy, masseter reduction, non-incisional chin contouring, double-chin muscle tie, mandibular surgery, maxillary surgery, bimaxillary surgery, chin implant, chin implant removal, chin foreign-body removal",
    weeks: [
      {
        label: "🕐 Week 1 (Day 0–7)",
        subtitle:
          "The body reacts most strongly as it recognizes a major structural change",
        description: [
          "Tissues around the operated area recognize that the facial structure has changed, so swelling, bruising, tightness and pressure are at their peak.",
          "Because the bone position has changed and muscles, skin and nerves are not yet adapted, it is normal for your face to look more swollen, wider and duller than the final result.",
          "This is a temporary early‑stage appearance and not a valid basis for judging the outcome.",
          "Think of this phase as a preparation stage before recovery fully kicks in.",
        ],
        tips: [
          "Keep your schedule to a minimum and make recovery your top priority.",
          "Sleep with your head slightly elevated to reduce swelling pressure.",
          "Take short 3–5 minute indoor walks several times a day to support circulation and swelling control.",
        ],
        cautions: [
          "Avoid repeatedly checking the mirror and judging the result.",
          "Avoid strenuous outings and long travel.",
          "Don’t jump to conclusions that something is wrong just because you have pain or swelling.",
        ],
        quote:
          "The goal this week is not to “look pretty” but to avoid increasing swelling and to help your body start the healing process.",
      },
      {
        label: "🕑 Week 2 (Day 8–14)",
        subtitle:
          "Strong swelling eases and the overall direction of change becomes visible",
        description: [
          "Inflammation from surgery gradually settles and total facial volume slowly begins to decrease.",
          "This is a transition phase where major swelling and residual puffiness coexist, so the face may look heavier in the morning and lighter toward evening.",
          "This morning‑evening difference is a very common recovery pattern and is not a sign of poor healing.",
          "At this stage, it’s enough to simply check the overall direction of your new contour without over‑analyzing details.",
        ],
        tips: [
          "Plan outings around places where you can sit and rest, such as cafés or malls.",
          "If you take photos, keep the same lighting and angle and use them only for tracking, not for harsh evaluation.",
          "Light walks help circulation and swelling drainage.",
        ],
        cautions: [
          "Avoid excessive comparison with old photos or other people’s results.",
          "Limit heavy drinking and all‑nighters, which delay recovery.",
          "Try not to fixate on thoughts like “Why am I still swollen?”.",
        ],
      },
      {
        label: "🕒 Week 3 (Day 15–21)",
        subtitle:
          "The outside looks more natural while the inside is still adapting",
        description: [
          "By week 3, visible swelling is much improved and many people around you may already say you look natural.",
          "Inside, however, the jaw muscles, joints and chewing muscles are still finishing their adaptation to the new position and usage pattern.",
          "On days when you talk a lot or have a busy schedule, it is normal to feel fatigue or dull ache in the jaw again.",
        ],
        tips: [
          "Photo shoots and light trips are usually fine.",
          "Intentionally schedule short rest breaks throughout the day.",
          "On very tired days, reducing your schedule is also part of good recovery.",
        ],
        cautions: [
          "Avoid high‑intensity exercise or activities that overuse the jaw.",
          "Don’t assume that this is the final result and overexert yourself.",
        ],
      },
      {
        label: "🕓 Week 4 (Day 22–28)",
        subtitle:
          "Daily life feels almost normal, but recovery is still in progress",
        description: [
          "Most people can return to work, school and general travel by week 4.",
          "Medically, however, true stabilization of jaw and contour surgery takes about 3–6 months, so what you see now is an in‑between stage, not the final result.",
          "Judging the outcome too strictly at this time only increases unnecessary anxiety.",
        ],
        tips: [
          "Start light exercise only within the range approved by your surgeon.",
          "Compare with your week‑1 and week‑2 photos to see progress rather than perfection.",
          "If you feel fatigue signals, prioritize rest over plans.",
        ],
        cautions: [
          "Do not finalize your opinion of the result at 4 weeks.",
          "Avoid interpreting remaining discomfort as “failure.”",
        ],
        quote:
          "At this stage your face is recovering well and still has room to become more comfortable and refined over the coming months.",
      },
    ],
    summaryTitle: "Key takeaway for this group",
    summaryBody: [
      "Recovery after jaw and facial contouring is about sequence, not speed.",
      "As long as you are following week‑appropriate care, the final result usually follows naturally afterward.",
    ],
  },
  breast: {
    ...recoveryGuideContent.KR.breast,
    title: "Breast + Nipple/Areola + Gynecomastia + Accessory Breast",
    badge: "Breast surgery",
    summary:
      "Covers implant, fat graft, lift, reduction and nipple/areola, gynecomastia and accessory breast procedures.",
  },
  body: {
    ...recoveryGuideContent.KR.body,
    title: "Body Liposuction · Lift · Revision + Hip/Buttock & Pelvic Fat Graft",
    badge: "Body contour",
  },
  upperFace: {
    ...recoveryGuideContent.KR.upperFace,
    title: "Zygoma · Temple · Forehead · Occiput · Brow Bone · Contour Revision",
    badge: "Upper‑face contour",
  },
  nose: {
    ...recoveryGuideContent.KR.nose,
    title: "Tip · Alar · Bulbous Nose · Nostril Line",
    badge: "Nose",
  },
  eyeSurgery: {
    ...recoveryGuideContent.KR.eyeSurgery,
    title: "Eye Surgery · Epicanthoplasty · Lower Fat · Revision",
    badge: "Eye surgery",
  },
  eyeVolume: {
    ...recoveryGuideContent.KR.eyeVolume,
    title: "Eye Fat Graft · Tear Trough · Aegyo‑sal · Periorbital Volume",
    badge: "Eye volume",
  },
  faceFat: {
    ...recoveryGuideContent.KR.faceFat,
    title: "Facial Fat Graft · Nasolabial Fold · Full‑face Volume",
    badge: "Facial volume",
  },
  lifting: {
    ...recoveryGuideContent.KR.lifting,
    title: "Facelift · Forehead Lift · Nasolabial Dissection · Wrinkle Surgery",
    badge: "Lifting surgery",
  },
  procedures: {
    ...recoveryGuideContent.KR.procedures,
    title: "Injectables · Fat‑dissolving · Lifting Devices · Lasers",
    badge: "Non‑surgical procedures",
  },
};

recoveryGuideContent.EN = enBase as Record<
  RecoveryGroupKey,
  RecoveryGroupContent
>;
recoveryGuideContent.JP = enBase as Record<
  RecoveryGroupKey,
  RecoveryGroupContent
>;
recoveryGuideContent.CN = enBase as Record<
  RecoveryGroupKey,
  RecoveryGroupContent
>;


