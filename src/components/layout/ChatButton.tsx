/**
 * 우측 하단 고정 문의 버튼.
 *
 * ⚠️ 카카오톡 채널 주소를 여기에 넣어주세요.
 *    카카오톡 채널 관리자센터 → 채널 관리 → 상세설정 에서 확인할 수 있고,
 *    보통 https://pf.kakao.com/_XXXXX/chat 형태입니다.
 *
 * 비워두면 카카오톡 대신 이메일 문의 버튼으로 표시됩니다.
 * 노란 카카오 버튼이 메일 앱을 여는 건 사용자를 속이는 셈이라, 주소가
 * 채워지기 전까지는 라벨과 색을 메일용으로 바꿔서 내보낸다.
 */
const KAKAO_CHANNEL_URL = '';

const EMAIL_URL = 'mailto:wonda0026@kakao.com';

export default function ChatButton() {
  const isKakao = KAKAO_CHANNEL_URL.length > 0;
  const href = isKakao ? KAKAO_CHANNEL_URL : EMAIL_URL;
  const label = isKakao ? '카카오톡 문의' : '메일 문의';

  return (
    <a
      className={`chat-fab${isKakao ? ' chat-fab--kakao' : ''}`}
      href={href}
      target={isKakao ? '_blank' : undefined}
      rel={isKakao ? 'noreferrer noopener' : undefined}
      aria-label={label}
      data-cursor="expand"
    >
      {/*
        3중 구조가 필요하다. 바깥은 접히는 그리드 트랙, 가운데는 잘라내는 상자,
        안쪽이 여백을 든 실제 글자다. 여백을 가운데에 주면 트랙이 0으로 접혀도
        여백만큼 폭이 남아 버튼이 정사각형이 되지 않는다.
      */}
      <span className="chat-fab__label">
        <span className="chat-fab__label-clip">
          <span className="chat-fab__label-text">{label}</span>
        </span>
      </span>
      <span className="chat-fab__icon" aria-hidden="true">
        {isKakao ? (
          // 말풍선. 카카오 로고 마크 자체가 아니라 일반적인 채팅 아이콘이다.
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              fill="currentColor"
              d="M12 3C6.9 3 2.8 6.3 2.8 10.3c0 2.6 1.7 4.8 4.3 6.1l-1 3.8c-.1.3.3.6.6.4l4.5-3c.3 0 .5.1.8.1 5.1 0 9.2-3.3 9.2-7.4S17.1 3 12 3Z"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              d="M3 6h18v12H3z M3 6l9 7 9-7"
            />
          </svg>
        )}
      </span>
    </a>
  );
}
