import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AdminShell } from './shared';
import { POST_CATEGORIES } from '../../data/posts';
import { api, imageUrl, type Post, type PostImage } from '../../lib/api';

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

  return (
    <form className="admin-form" onSubmit={save}>
      <div className="admin-form__grid">
        <label className="admin-field admin-field--wide">
          <span className="admin-field__label">제목</span>
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
            요약 <small>목록에 보이는 한 줄</small>
          </span>
          <input
            className="admin-input"
            value={draft.summary}
            onChange={(e) => set('summary', e.target.value)}
          />
        </label>

        <label className="admin-field admin-field--wide">
          <span className="admin-field__label">
            본문 <small>문단은 빈 줄로 나눕니다</small>
          </span>
          <textarea
            className="admin-input admin-input--body"
            value={draft.body}
            onChange={(e) => set('body', e.target.value)}
            rows={14}
          />
        </label>
      </div>

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
