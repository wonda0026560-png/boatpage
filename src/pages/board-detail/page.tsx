import { useLayoutEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Cursor from '../../components/layout/Cursor';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import NavLink from '../../components/layout/NavLink';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { getAdjacentPosts, getPostBySlug, formatPostDate } from '../../data/posts';

gsap.registerPlugin(ScrollTrigger);

export default function BoardDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const post = getPostBySlug(slug);

  useSmoothScroll();

  useLayoutEffect(() => {
    if (!post) return;
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gsap.set('.post-body p, .post-figure', { opacity: 1, y: 0 });
        return;
      }
      gsap.from('.post-detail__title', {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });
      gsap.utils.toArray<HTMLElement>('.post-body p, .post-figure').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 32 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 90%' },
          }
        );
      });
    }, rootRef);
    return () => ctx.revert();
  }, [post]);

  if (!post) {
    return (
      <div>
        <Cursor />
        <Header />
        <main className="detail-missing">
          <h1 className="detail-missing__title">글을 찾을 수 없습니다</h1>
          <NavLink to="/board" className="tlink detail-missing__back">
            ← 게시판으로 돌아가기
          </NavLink>
        </main>
        <Footer />
      </div>
    );
  }

  const { newer, older } = getAdjacentPosts(post.slug);

  return (
    <div ref={rootRef}>
      <Cursor />
      <Header />

      <main className="post-detail">
        <nav className="detail-crumb" aria-label="현재 위치">
          <NavLink to="/board" className="tlink">
            게시판
          </NavLink>
          <span aria-hidden="true">→</span>
          <span className="detail-crumb__current">{post.category}</span>
        </nav>

        <header className="post-detail__head">
          <div className="post-detail__meta">
            <span className="post-detail__category">{post.category}</span>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          </div>
          <h1 className="post-detail__title">{post.title}</h1>
          <p className="post-detail__summary">{post.summary}</p>
        </header>

        <div className="post-body">
          {post.body.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {post.images?.map((img) => (
          <figure className="post-figure" key={img.src}>
            <img src={img.src} alt={img.alt} loading="lazy" />
            <figcaption>{img.alt}</figcaption>
          </figure>
        ))}

        <nav className="detail-nav" aria-label="다른 글">
          {older && (
            <button
              type="button"
              className="detail-nav__item"
              onClick={() => navigate(`/board/${older.slug}`)}
              data-cursor="expand"
            >
              <span className="detail-nav__dir">← 이전 글</span>
              <span className="detail-nav__name post-detail__nav-title">{older.title}</span>
            </button>
          )}
          {newer && (
            <button
              type="button"
              className="detail-nav__item detail-nav__item--next"
              onClick={() => navigate(`/board/${newer.slug}`)}
              data-cursor="expand"
            >
              <span className="detail-nav__dir">다음 글 →</span>
              <span className="detail-nav__name post-detail__nav-title">{newer.title}</span>
            </button>
          )}
        </nav>
      </main>

      <Footer />
    </div>
  );
}
