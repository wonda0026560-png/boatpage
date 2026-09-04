import { Link, useLocation } from 'react-router-dom';
import Cursor from '../components/layout/Cursor';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';

/**
 * 없는 주소로 들어왔을 때. 막다른 길이 되지 않도록
 * 사람들이 실제로 찾아왔을 법한 곳으로 가는 길을 남긴다.
 */
export default function NotFound() {
  const location = useLocation();

  return (
    <div>
      <Cursor />
      <Header />

      <main className="notfound">
        <p className="notfound__code">404</p>
        <h1 className="notfound__title">페이지를 찾을 수 없습니다</h1>
        <p className="notfound__path">{location.pathname}</p>
        <p className="notfound__body">
          주소가 바뀌었거나 삭제된 페이지입니다. 아래에서 찾으시던 곳으로 이동해 주세요.
        </p>

        <nav className="notfound__links" aria-label="주요 페이지">
          <Link to="/" className="tlink" data-cursor="expand">
            홈으로 →
          </Link>
          <Link to="/models" className="tlink" data-cursor="expand">
            어선·레저보트 라인업 →
          </Link>
          <Link to="/board" className="tlink" data-cursor="expand">
            게시판 →
          </Link>
          <a href="mailto:wonda0026@kakao.com" className="tlink" data-cursor="expand">
            wonda0026@kakao.com →
          </a>
        </nav>
      </main>

      <Footer />
    </div>
  );
}
