import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminShell } from './shared';
import Markdown from '../../components/Markdown';
import { POST_CATEGORIES } from '../../data/posts';
import { postMeta } from '../../data/seo';
import { headings, markdownToText } from '../../lib/markdown';
import { api, imageUrl, type Post, type PostImage } from '../../lib/api';

/*
  검색 결과에 잘리지 않는 길이. 한글 기준 구글·네이버가 보여주는 폭에서 잡았다 —
  제목은 30자 안팎, 설명은 90자 안팎에서 말줄임이 된다. 넘긴다고 막지는 않는다.
*/
const TITLE_MAX = 30;
const DESC_MIN = 50;
const DESC_MAX = 90;
/** 이보다 긴 본문은 소제목 없이 한 덩어리로 두지 않는 게 좋다 */
const LONG_BODY = 600;

export default function AdminEditorPage() {
  return (
    <AdminShell title="글 편집">
      <Editor />
    </AdminShell>
  );
}

type Draft = Pick<Post, 'title' | 'slug' | 'category' | 'summary' | 'body' | 'date' | 'published'>;

function Editor() {
  const { id: idParam } = useParams();
  const id = Number(idParam);
  const navigate = useNavigate();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [images, setImages] = useState<PostImage[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const dirty = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!Number.isInteger(id)) {
      setError('잘못된 주소입니다.');
      return;
    }
    api.admin
      .get(id)
      .then((p) => {
        setDraft({
          title: p.title,
          slug: p.slug,
          category: p.category,
          summary: p.summary,
          body: p.body,
          date: p.date,
          published: p.published,
        });
        setImages(p.images);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  // 저장 안 한 채 창을 닫으려 하면 브라우저가 한 번 묻는다
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (!dirty.current) return;
      e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    dirty.current = true;
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  };

  const save = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await api.admin.update(id, draft);
      setDraft({
        title: saved.title,
        slug: saved.slug,
        category: saved.category,
        summary: saved.summary,
        body: saved.body,
        date: saved.date,
        published: saved.published,
      });
      dirty.current = false;
      const t = new Date();
      setStatus(`저장됨 ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('이 글을 삭제할까요? 사진도 함께 지워지며 되돌릴 수 없습니다.')) return;
    try {
      await api.admin.remove(id);
      dirty.current = false;
      navigate('/admin');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  /* 서버는 한 번에 한 장만 받으므로 여러 장을 고르면 차례로 올린다 */
  const onFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const img = await api.admin.upload(id, file);
        setImages((list) => [...list, img]);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const updateAlt = async (img: PostImage, alt: string) => {
    if (alt === img.alt) return;
    try {
      const saved = await api.admin.updateImage(img.id, alt);
      setImages((list) => list.map((i) => (i.id === saved.id ? saved : i)));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const removeImage = async (img: PostImage) => {
    if (!window.confirm('이 사진을 삭제할까요?')) return;
    try {
      await api.admin.removeImage(img.id);
      setImages((list) => list.filter((i) => i.id !== img.id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (error && !draft) return <p className="admin-error">{error}</p>;
  if (!draft) return <p className="admin-note">불러오는 중…</p>;

  const titleLen = draft.title.trim().length;
  const descLen = (draft.summary.trim() || markdownToText(draft.body)).length;

  return (
    <form className="admin-form" onSubmit={save}>
      <div className="admin-form__grid">
        <label className="admin-field admin-field--wide">
          <span className="admin-field__label">
            제목
            <small>검색 결과의 제목. 핵심 낱말을 앞쪽에</small>
            <Counter value={titleLen} max={TITLE_MAX} />
          </span>
          <input
            className="admin-input admin-input--title"
            value={draft.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="예) 2025 부산국제보트쇼 Boat of the Year 대상 수상"
          />
        </label>

        <label className="admin-field">
          <span className="admin-field__label">분류</span>
          <select
            className="admin-input"
            value={draft.category}
            onChange={(e) => set('category', e.target.value)}
          >
            {POST_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-field__label">날짜</span>
          <input
            className="admin-input"
            type="date"
            value={draft.date}
            onChange={(e) => set('date', e.target.value)}
          />
        </label>

        <label className="admin-field admin-field--wide">
          <span className="admin-field__label">
            주소 <small>/board/ 뒤에 붙는 부분. 영문 소문자·숫자·하이픈</small>
          </span>
          <input
            className="admin-input admin-input--mono"
            value={draft.slug}
            onChange={(e) => set('slug', e.target.value)}
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
        </label>

        <label className="admin-field admin-field--wide">
          <span className="admin-field__label">
            요약 · 검색 설명
            <small>목록의 한 줄이자 검색 결과·공유 카드의 설명. 비우면 본문 앞부분이 쓰입니다</small>
            <Counter value={draft.summary.trim().length} max={DESC_MAX} />
          </span>
          <input
            className="admin-input"
            value={draft.summary}
            onChange={(e) => set('summary', e.target.value)}
          />
        </label>

        <div className="admin-field admin-field--wide">
          <div className="admin-field__row">
            <label htmlFor="post-body" className="admin-field__label">
              본문
              <small>
                <code>## 소제목</code> <code>**굵게**</code> <code>[글자](/models/wls560)</code>{' '}
                <code>- 목록</code> <code>&gt; 인용</code> · 문단은 빈 줄로
              </small>
            </label>
            <div className="admin-tabs" role="tablist" aria-label="본문 보기">
              <button
                type="button"
                role="tab"
                aria-selected={!preview}
                className={`admin-tab${preview ? '' : ' is-on'}`}
                onClick={() => setPreview(false)}
              >
                편집
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={preview}
                className={`admin-tab${preview ? ' is-on' : ''}`}
                onClick={() => setPreview(true)}
              >
                미리보기
              </button>
            </div>
          </div>
          {preview ? (
            <div className="admin-preview">
              {draft.body.trim() ? (
                <Markdown source={draft.body} className="post-body" />
              ) : (
                <p className="admin-note">본문이 비어 있습니다.</p>
              )}
            </div>
          ) : (
            <textarea
              id="post-body"
              className="admin-input admin-input--body"
              value={draft.body}
              onChange={(e) => set('body', e.target.value)}
              rows={18}
            />
          )}
        </div>
      </div>

      <SeoPanel draft={draft} images={images} titleLen={titleLen} descLen={descLen} />

      <section className="admin-images">
        <div className="admin-images__head">
          <span className="admin-field__label">
            사진 <small>본문 아래에 올린 순서대로 실립니다. 긴 변 1600px 로 자동 축소됩니다.</small>
          </span>
          <label className={`admin-btn${uploading ? ' is-busy' : ''}`}>
            {uploading ? '올리는 중…' : '+ 사진 추가'}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              onChange={onFiles}
              disabled={uploading}
              hidden
            />
          </label>
        </div>

        {images.length > 0 && (
          <ul className="admin-images__list">
            {images.map((img) => (
              <li key={img.id} className="admin-image">
                <img src={imageUrl(img.id)} alt={img.alt} loading="lazy" />
                <input
                  className="admin-input admin-input--small"
                  defaultValue={img.alt}
                  placeholder="사진 설명 (캡션으로 표시)"
                  onBlur={(e) => updateAlt(img, e.target.value.trim())}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn--small admin-btn--danger"
                  onClick={() => removeImage(img)}
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="admin-form__foot">
        <label className="admin-toggle">
          <input
            type="checkbox"
            checked={draft.published}
            onChange={(e) => set('published', e.target.checked)}
          />
          <span>게시판에 공개</span>
        </label>

        <div className="admin-form__actions">
          {status && !dirty.current && <span className="admin-note">{status}</span>}
          {error && <span className="admin-error">{error}</span>}
          {draft.published && (
            <Link to={`/board/${draft.slug}`} className="admin-btn" target="_blank" rel="noreferrer">
              새 창에서 보기
            </Link>
          )}
          <button type="button" className="admin-btn admin-btn--danger" onClick={remove}>
            삭제
          </button>
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? '저장 중…' : '저장'}
          </button>
        </div>
      </div>
    </form>
  );
}

function Counter({ value, max }: { value: number; max: number }) {
  return (
    <span className={`admin-count${value > max ? ' is-over' : ''}`} aria-live="polite">
      {value}/{max}자
    </span>
  );
}

/**
 * 검색 결과에 어떻게 보일지, 무엇이 빠졌는지.
 * 규칙은 권장 사항이라 저장을 막지는 않는다 — 수상 소식처럼 짧은 글은 소제목이 없어도 된다.
 */
function SeoPanel({
  draft,
  images,
  titleLen,
  descLen,
}: {
  draft: Draft;
  images: PostImage[];
  titleLen: number;
  descLen: number;
}) {
  const meta = postMeta(draft);
  const outline = headings(draft.body);
  const bodyLen = markdownToText(draft.body).length;
  const missingAlt = images.filter((i) => !i.alt.trim()).length;
  const cover = images[0];

  const checks: { ok: boolean; text: string }[] = [
    {
      ok: titleLen > 0 && titleLen <= TITLE_MAX,
      text: titleLen === 0 ? '제목이 없습니다' : `제목 ${titleLen}자 — ${TITLE_MAX}자 안이면 검색 결과에서 잘리지 않습니다`,
    },
    {
      ok: descLen >= DESC_MIN && descLen <= DESC_MAX,
      text:
        descLen < DESC_MIN
          ? `검색 설명 ${descLen}자 — ${DESC_MIN}자는 넘겨야 무슨 글인지 드러납니다`
          : `검색 설명 ${descLen}자 — ${DESC_MAX}자 안이면 끝까지 보입니다`,
    },
    {
      ok: bodyLen < LONG_BODY || outline.length > 0,
      text:
        outline.length > 0
          ? `소제목 ${outline.length}개: ${outline.map((h) => h.text).join(' / ')}`
          : bodyLen >= LONG_BODY
            ? `본문 ${bodyLen}자인데 소제목이 없습니다 — ## 로 두세 단락마다 나눠 주세요`
            : '짧은 글이라 소제목 없이도 괜찮습니다',
    },
    {
      ok: images.length === 0 || missingAlt === 0,
      text:
        images.length === 0
          ? '사진이 없습니다 — 한 장이라도 있으면 공유 카드와 이미지 검색에 걸립니다'
          : missingAlt === 0
            ? `사진 ${images.length}장 모두 설명이 있습니다`
            : `사진 설명(캡션)이 빈 사진 ${missingAlt}장 — 검색엔진은 사진을 이 글로 읽습니다`,
    },
  ];

  return (
    <aside className="admin-seo" aria-labelledby="seo-title">
      <h2 id="seo-title" className="admin-field__label">
        검색 노출 <small>저장하면 이대로 검색 결과와 카카오톡 공유 카드에 나갑니다</small>
      </h2>

      <div className="admin-seo__grid">
        <div className="admin-snippet" aria-label="검색 결과 미리보기">
          <span className="admin-snippet__site">원다마린산업 › board › {draft.slug}</span>
          <span className="admin-snippet__title">{meta.title}</span>
          <span className="admin-snippet__desc">{meta.description || '(설명 없음)'}</span>
        </div>

        <div className="admin-cover">
          {cover ? (
            <img src={imageUrl(cover.id)} alt={cover.alt} />
          ) : (
            <span className="admin-cover__empty">대표 사진 없음</span>
          )}
          <small>공유 카드 사진 — 첫 번째 사진이 쓰입니다</small>
        </div>
      </div>

      <ul className="admin-checks">
        {checks.map((c, i) => (
          <li key={i} className={c.ok ? 'is-ok' : 'is-warn'}>
            {c.text}
          </li>
        ))}
      </ul>
    </aside>
  );
}
