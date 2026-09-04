/**
 * 게시판 API 클라이언트. 서버는 server/index.js.
 * 로그인 상태는 httpOnly 쿠키가 들고 있어 여기서 토큰을 다루지 않는다.
 */

export interface PostImage {
  id: number;
  alt: string;
  width: number | null;
  height: number | null;
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  category: string;
  summary: string;
  /** 문단은 빈 줄로 나뉜 평문. 화면에서 splitParagraphs 로 쪼갠다. */
  body: string;
  /** YYYY-MM-DD */
  date: string;
  published: boolean;
  images: PostImage[];
  updated_at?: string;
}

export interface PostNeighbor {
  slug: string;
  title: string;
}

export interface PostDetail extends Post {
  newer: PostNeighbor | null;
  older: PostNeighbor | null;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type FetchInit = NonNullable<Parameters<typeof fetch>[1]>;

async function request<T>(url: string, init: FetchInit = {}): Promise<T> {
  const headers: Record<string, string> = { ...(init.headers as Record<string, string>) };
  if (init.body && !(init.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { ...init, headers });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error ?? `요청에 실패했습니다 (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return data as T;
}

export const imageUrl = (id: number) => `/api/images/${id}`;

export const api = {
  posts: () => request<Post[]>('/api/posts'),
  post: (slug: string) => request<PostDetail>(`/api/posts/${encodeURIComponent(slug)}`),

  admin: {
    me: () => request<{ ok: true; db: boolean }>('/api/admin/me'),
    login: (password: string) =>
      request<{ ok: true }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) }),
    logout: () => request<{ ok: true }>('/api/admin/logout', { method: 'POST' }),

    posts: () => request<Post[]>('/api/admin/posts'),
    create: () => request<Post>('/api/admin/posts', { method: 'POST' }),
    get: (id: number) => request<Post>(`/api/admin/posts/${id}`),
    update: (id: number, data: Omit<Post, 'id' | 'images' | 'updated_at'>) =>
      request<Post>(`/api/admin/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id: number) => request<{ ok: true }>(`/api/admin/posts/${id}`, { method: 'DELETE' }),

    upload: (postId: number, file: File) => {
      const fd = new FormData();
      fd.append('image', file);
      return request<PostImage>(`/api/admin/posts/${postId}/images`, { method: 'POST', body: fd });
    },
    updateImage: (id: number, alt: string) =>
      request<PostImage>(`/api/admin/images/${id}`, { method: 'PUT', body: JSON.stringify({ alt }) }),
    removeImage: (id: number) => request<{ ok: true }>(`/api/admin/images/${id}`, { method: 'DELETE' }),
  },
};
