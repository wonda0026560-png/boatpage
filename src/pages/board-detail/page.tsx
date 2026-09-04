import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Cursor from '../../components/layout/Cursor';
import Header from '../../components/layout/Header';
import Footer from '../../components/layout/Footer';
import NavLink from '../../components/layout/NavLink';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';
import { formatPostDate, splitParagraphs } from '../../data/posts';
import { api, imageUrl, type PostDetail } from '../../lib/api';

gsap.registerPlugin(ScrollTrigger);

export default function BoardDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  // undefined = 불러오는 중, null = 없는 글
  const [post, setPost] = useState<PostDetail | null | undefined>(undefined);

  useSmoothScroll();

  useEffect(() => {
    let alive = true;
    setPost(undefined);
    if (!slug) {
      setPost(null);
      return;
    }
    api
      .post(slug)
      .then((p) => alive && setPost(p))
      .catch(() => alive && setPost(null));
    return () => {
      alive = false;
    };
  }, [slug]);

  useLayoutEffect(() => {
    if (!post) return;
    const ctx = gsap.context(() => {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReduced) {
        gsap.set('.post-body p, .post-figure', { opacity: 1, y: 0 });
        return;
      }
      gsap.from('.post-detail__title', { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out' });
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

  if (post === undefined) {
    return (
      <div>
        <Cursor />
        <Header />
        <main className="detail-missing">
          <p className="board-status" role="status">
            불러오는 중…
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  if (post === null) {
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

  const paragraphs = splitParagraphs(post.body);

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
          {post.summary && <p className="post-detail__summary">{post.summary}</p>}
        </header>

        <div className="post-body">
          {paragraphs.map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {post.images.map((img) => (
          <figure className="post-figure" key={img.id}>
            <img
              src={imageUrl(img.id)}
              alt={img.alt}
              width={img.width ?? undefined}
              height={img.height ?? undefined}
              loading="lazy"
            />
            {img.alt && <figcaption>{img.alt}</figcaption>}
          </figure>
        ))}

        <nav className="detail-nav" aria-label="다른 글">
          {post.older && (
            <button
              type="button"
              className="detail-nav__item"
              onClick={() => navigate(`/board/${post.older!.slug}`)}
              data-cursor="expand"
            >
              <span className="detail-nav__dir">← 이전 글</span>
              <span className="detail-nav__name post-detail__nav-title">{post.older.title}</span>
            </button>
          )}
          {post.newer && (
            <button
              type="button"
              className="detail-nav__item detail-nav__item--next"
              onClick={() => navigate(`/board/${post.newer!.slug}`)}
              data-cursor="expand"
            >
              <span className="detail-nav__dir">다음 글 →</span>
              <span className="detail-nav__name post-detail__nav-title">{post.newer.title}</span>
            </button>
          )}
        </nav>
      </main>

      <Footer />
    </div>
  );
}
