import api from './api';

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED';

export interface BlogPostCategoryRef {
  id: string;
  title: string;
  slug: string;
}

export interface BlogPostListItem {
  id: string;
  category: BlogPostCategoryRef;
  status: BlogPostStatus;
  publishedAt: string | null;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost extends BlogPostListItem {
  content: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageUrl: string | null;
  robotsNoIndex: boolean;
  robotsNoFollow: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

export const blogPostService = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: BlogPostStatus;
    categoryId?: string;
  }) => {
    const response = await api.get<PaginatedResponse<BlogPostListItem>>(
      '/admin/blog/posts',
      { params },
    );
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<BlogPost>(`/admin/blog/posts/${id}`);
    return response.data;
  },

  create: async (payload: {
    categoryId: string;
    status?: BlogPostStatus;
    publishedAt?: string;
    title: string;
    slug?: string;
    excerpt?: string;
    content: string;
    coverImageUrl?: string;
    coverImageAlt?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string[];
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImageUrl?: string;
    robotsNoIndex?: boolean;
    robotsNoFollow?: boolean;
  }) => {
    const response = await api.post<BlogPost>('/admin/blog/posts', payload);
    return response.data;
  },

  update: async (
    id: string,
    payload: Partial<{
      categoryId: string;
      status: BlogPostStatus;
      publishedAt: string;
      title: string;
      slug: string;
      excerpt: string;
      content: string;
      coverImageUrl: string;
      coverImageAlt: string;
      seoTitle: string;
      seoDescription: string;
      seoKeywords: string[];
      canonicalUrl: string;
      ogTitle: string;
      ogDescription: string;
      ogImageUrl: string;
      robotsNoIndex: boolean;
      robotsNoFollow: boolean;
    }>,
  ) => {
    const response = await api.patch<BlogPost>(`/admin/blog/posts/${id}`, payload);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.patch<{ id: string }>(`/admin/blog/posts/${id}/delete`);
    return response.data;
  },

  uploadCover: async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ id: string; coverImageUrl: string | null }>(
      `/admin/blog/posts/${id}/cover`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },
};

