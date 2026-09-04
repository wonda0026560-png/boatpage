import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Cursor from '../../components/layout/Cursor';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { POST_CATEGORIES, formatPostDate } from '../../data/posts';
import { api, type Post } from '../../lib/api';

gsap.registerPlugin(ScrollTrigger);

const ALL = '전체';

export default function BoardPage() {
  const rootRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [filter, setFilter] = useState<string>(ALL);
  // null 이면 아직 불러오는 중
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  useSmoothScroll();

  useEffect(() => {
    let alive = true;
    api
      .posts()
      .then((list) => alive && setPosts(list))
      .catch((e: Error) => {
        if (!alive) return;
        setLoadError(e.message);
        setPosts([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  // 글이 실제로 존재하는 분류만 버튼으로 내보낸다.
  const categories = useMemo(() => {
    const used = new Set((posts ?? []).map((p) => p.category));
    return [ALL, ...POST_CATEGORIES.filter((c) => used.has(c))];
  }, [posts]);

  const visible = useMemo(() => {
    const list = posts ?? [];
    return filter === ALL ? list : list.filter((p) => p.category === filter);
  }, [filter, posts]);

  useLayoutEffect(() => {
    if (!posts) return;
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gsap.set('.post-row', { opacity: 1, y: 0 });
        return;
      }

      gsap.utils.toArray<HTMLElement>('.post-row').forEach((row) => {
        gsap.fromTo(
          row,
          { opacity: 0, y: 56 },
          {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 88%' },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, [filter, posts]);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const ctx = gsap.context(() => {
      gsap.from('.board-head__title span', { yPercent: 115, duration: 1.1, ease: 'power4.out' });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <Cursor />
      <Header />

      <main className="board">
        <header className="board-head">
          <p className="board-head__eyebrow">원다마린산업 소식</p>
          <h1 className="board-head__title">
            <span className="board-head__line">
              <span>News</span>
            </span>
          </h1>
          <p className="board-head__body">
            보트쇼 수상, 수출 실적, 신모델 공개처럼 알려드릴 일이 생기면 이곳에 올립니다.
          </p>
        </header>

        {categories.length > 1 && (
          <div className="board-filters" role="tablist" aria-label="분류">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={filter === c}
                className={`board-filter${filter === c ? ' is-active' : ''}`}
                onClick={() => setFilter(c)}
                data-cursor="expand"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {posts === null ? (
          <p className="board-status" role="status">
            불러오는 중…
          </p>
        ) : visible.length === 0 ? (
          /* 글이 없을 때. 고장난 화면처럼 보이지 않도록 안내를 남긴다. */
          <div className="board-empty">
            <p className="board-empty__title">아직 등록된 글이 없습니다</p>
            <p className="board-empty__body">
              새로운 소식이 준비되는 대로 이곳에 올리겠습니다. 문의는 아래 메일로 주시면 빠르게
              답변드립니다.
            </p>
            {loadError && <p className="board-empty__note">{loadError}</p>}
            <a
              href="mailto:wonda0026@kakao.com"
              className="board-empty__link tlink"
              data-cursor="expand"
            >
              wonda0026@kakao.com →
            </a>
          </div>
        ) : (
          <div className="post-list">
            {visible.map((post) => (
              <article
                className="post-row"
                key={post.id}
                onClick={() => navigate(`/board/${post.slug}`)}
                data-cursor="expand"
              >
                <time className="post-row__date" dateTime={post.date}>
                  {formatPostDate(post.date)}
                </time>

                <div className="post-row__main">
                  <span className="post-row__category">{post.category}</span>
                  <h2 className="post-row__title">{post.title}</h2>
                  {post.summary && <p className="post-row__summary">{post.summary}</p>}
                </div>

                <span className="post-row__go" aria-hidden="true">
                  자세히 →
                </span>

                {/* 카드 전체가 클릭 대상이지만 키보드·스크린리더용 실제 링크도 둔다 */}
                <Link className="post-row__link" to={`/board/${post.slug}`}>
                  {post.title} 자세히 보기
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
