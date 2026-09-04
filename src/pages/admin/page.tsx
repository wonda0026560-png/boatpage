import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AdminShell } from './shared';
import { formatPostDate } from '../../data/posts';
import { api, type Post } from '../../lib/api';

export default function AdminPage() {
  return (
    <AdminShell title="게시판 글 관리">
      <PostList />
    </AdminShell>
  );
}

function PostList() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api.admin
      .posts()
      .then(setPosts)
      .catch((e: Error) => {
        setError(e.message);
        setPosts([]);
      });
  }, []);

  /* 빈 초안을 만들고 바로 편집기로 넘어간다. 사진은 글 id 가 있어야 붙기 때문이다. */
  const createPost = async () => {
    setCreating(true);
    try {
      const post = await api.admin.create();
      navigate(`/admin/posts/${post.id}`);
    } catch (e) {
      setError((e as Error).message);
      setCreating(false);
    }
  };

  return (
    <>
      <div className="admin-toolbar">
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={createPost}
          disabled={creating}
        >
          {creating ? '만드는 중…' : '+ 새 글 쓰기'}
        </button>
        <p className="admin-note">
          공개 전 글은 게시판에 보이지 않습니다. 편집기에서 '공개'를 켜야 올라갑니다.
        </p>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {posts === null ? (
        <p className="admin-note">불러오는 중…</p>
      ) : posts.length === 0 ? (
        <p className="admin-note">아직 글이 없습니다. 위 버튼으로 첫 글을 만들어 보세요.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>분류</th>
              <th>제목</th>
              <th>사진</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.id} className={p.published ? '' : 'is-draft'}>
                <td>{formatPostDate(p.date)}</td>
                <td>{p.category}</td>
                <td className="admin-table__title">{p.title || <em>제목 없음</em>}</td>
                <td>{p.images.length ? `${p.images.length}장` : '—'}</td>
                <td>
                  <span className={`admin-badge${p.published ? ' is-on' : ''}`}>
                    {p.published ? '공개' : '초안'}
                  </span>
                </td>
                <td className="admin-table__actions">
                  <Link to={`/admin/posts/${p.id}`} className="admin-btn admin-btn--small">
                    편집
                  </Link>
                  {p.published && (
                    <Link to={`/board/${p.slug}`} className="admin-btn admin-btn--small">
                      보기
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
