export type CrmEventType = 'signup' | 'review';

interface CrmEventPayload {
  event_type: CrmEventType;
  email: string;
  nickname: string;
  content?: string;      // 후기 내용 (회원가입이면 없어도 됨)
  event_time?: string;   // ISO 문자열, 없으면 내부에서 now() 사용
  lang?: string;         // 언어 코드 (KR, JP, CN, EN)
}

/**
 * CRM 이벤트를 Google Apps Script Webhook으로 전송
 * (→ 거기서 스프레드시트에 저장 + Zapier 트리거)
 */
export async function logCrmEventToSheet(payload: CrmEventPayload) {
  const webhookUrl = process.env.NEXT_PUBLIC_GAS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('GAS_WEBHOOK_URL 이 설정되어 있지 않습니다.');
    return;
  }

  const nowIso =
    payload.event_time ?? new Date().toISOString();

  const body = {
    ...payload,
    event_time: nowIso,
    content: payload.content ?? '',
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error('CRM Webhook 호출 실패', res.status, await res.text());
    }
  } catch (err) {
    console.error('CRM Webhook 호출 중 오류', err);
  }
}

