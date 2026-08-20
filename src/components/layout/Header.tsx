import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import NavLink from './NavLink';
import logoWordmark from '../../assets/logo-wordmark.png';

const NAV_ITEMS = [
  { label: '모델', to: '/models' },
  { label: '건조 과정', to: '/#process' },
  { label: '기업소개', to: '/about' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // 페이지가 바뀌면 열려 있던 모바일 메뉴는 닫는다.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  // 메뉴가 열린 동안은 뒤 배경이 스크롤되지 않도록 잠근다.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <>
      {/*
        헤더에 mix-blend-mode: difference가 걸려 있어 배경색을 반전시킨다.
        메뉴 오버레이가 열리면 글자가 반전돼 읽히지 않으므로 블렌드를 끈다.
      */}
      <header className={`site-header${menuOpen ? ' is-menu-open' : ''}`}>
        <NavLink to="/" className="site-header__brand">
          {/*
            디자이너 원본 중 반전(흰색) 버전을 쓴다. 헤더에 걸린
            mix-blend-mode: difference가 밝은 배경에서는 어둡게, 어두운 배경에서는
            밝게 뒤집어 주므로 페이지마다 이미지를 갈아끼울 필요가 없다.
            기존 텍스트 워드마크와 정확히 같은 거동이다.
          */}
          <img
            className="site-header__logo"
            src={logoWordmark}
            alt="원다마린산업 WONDA MARINE INDUSTRY"
            width={420}
            height={120}
          />
        </NavLink>

        <nav className="site-header__nav" aria-label="주 메뉴">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className="tlink">
              {item.label}
            </NavLink>
          ))}
        </nav>

        <NavLink to="/#contact" className="site-header__cta tlink">
          문의하기 ↗
        </NavLink>

        <button
          type="button"
          className="site-header__burger"
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? '메뉴 닫기' : '메뉴 열기'}
        >
          <span className={`site-header__burger-bar${menuOpen ? ' is-x-top' : ''}`} />
          <span className={`site-header__burger-bar${menuOpen ? ' is-x-bottom' : ''}`} />
        </button>
      </header>

      <div
        id="mobile-menu"
        className={`mobile-menu${menuOpen ? ' is-open' : ''}`}
        hidden={!menuOpen}
      >
        <nav className="mobile-menu__nav" aria-label="모바일 메뉴">
          {[{ label: '홈', to: '/' }, ...NAV_ITEMS, { label: '문의하기', to: '/#contact' }].map(
            (item, i) => (
              <NavLink
                key={item.to}
                to={item.to}
                className="mobile-menu__link"
                onNavigate={() => setMenuOpen(false)}
              >
                <span className="mobile-menu__num">{String(i + 1).padStart(2, '0')}</span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="mobile-menu__foot">
          <a href="mailto:wonda0026@kakao.com" className="tlink">
            wonda0026@kakao.com
          </a>
          <span>전라남도 완도군 노화읍 노화로831번길 79</span>
        </div>
      </div>
    </>
  );
}
