import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Image as ImageIcon, Loader2, Save, Trash2 } from 'lucide-react';
import { Select } from '../components/common/Select';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { getImageUrl } from '../utils/image';
import {
  blogCategoryService,
  type BlogCategory,
} from '../services/blogCategory.service';
import {
  blogPostService,
  type BlogPost,
  type BlogPostStatus,
} from '../services/blogPost.service';

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('fa-IR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const BlogPostEditor = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'create';
  const navigate = useNavigate();

  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [post, setPost] = useState<BlogPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<BlogPostStatus>('DRAFT');
  const [publishedAtText, setPublishedAtText] = useState('');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [coverImageAlt, setCoverImageAlt] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [ogTitle, setOgTitle] = useState('');
  const [ogDescription, setOgDescription] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [robotsNoIndex, setRobotsNoIndex] = useState(false);
  const [robotsNoFollow, setRobotsNoFollow] = useState(false);

  useEffect(() => {
    blogCategoryService
      .getAll()
      .then(setCategories)
      .catch((e) => console.error('Failed to fetch blog categories', e));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const load = async () => {
      try {
        if (!isEdit) {
          if (categories.length > 0) {
            setCategoryId((prev) => prev || categories[0].id);
          }
          setPost(null);
          return;
        }
        const data = await blogPostService.getById(id as string);
        if (cancelled) return;
        setPost(data);
        setCategoryId(data.category?.id || '');
        setStatus(data.status);
        setPublishedAtText(
          data.publishedAt
            ? new Date(data.publishedAt).toISOString().slice(0, 16).replace('T', ' ')
            : '',
        );
        setTitle(data.title);
        setSlug(data.slug);
        setExcerpt(data.excerpt || '');
        setContent(data.content || '');
        setCoverImageUrl(data.coverImageUrl);
        setCoverImageAlt(data.coverImageAlt || '');
        setCoverFile(null);
        setCoverPreview(null);
        setSeoTitle(data.seoTitle || '');
        setSeoDescription(data.seoDescription || '');
        setSeoKeywords(Array.isArray(data.seoKeywords) ? data.seoKeywords.join(', ') : '');
        setCanonicalUrl(data.canonicalUrl || '');
        setOgTitle(data.ogTitle || '');
        setOgDescription(data.ogDescription || '');
        setOgImageUrl(data.ogImageUrl || '');
        setRobotsNoIndex(Boolean(data.robotsNoIndex));
        setRobotsNoFollow(Boolean(data.robotsNoFollow));
      } catch (error) {
        console.error('Failed to fetch blog post', error);
        setPost(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [categories, id, isEdit]);

  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setCoverPreview(null);
  }, [coverFile]);

  const keywordsArray = useMemo(() => {
    return seoKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }, [seoKeywords]);

  const coverResolved = coverPreview || getImageUrl(coverImageUrl) || null;

  const save = async () => {
    if (!title.trim()) {
      alert('عنوان الزامی است');
      return;
    }
    if (!categoryId) {
      alert('دسته‌بندی الزامی است');
      return;
    }
    if (!content.trim()) {
      alert('متن کامل پست الزامی است');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        categoryId,
        status,
        ...(status === 'PUBLISHED'
          ? {
              publishedAt: publishedAtText.trim()
                ? new Date(
                    publishedAtText.trim().replace(' ', 'T'),
                  ).toISOString()
                : undefined,
            }
          : {}),
        title: title.trim(),
        ...(slug.trim() ? { slug: slug.trim() } : {}),
        excerpt: excerpt.trim(),
        content,
        ...(coverImageUrl ? { coverImageUrl } : {}),
        coverImageAlt: coverImageAlt.trim(),
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        seoKeywords: keywordsArray,
        canonicalUrl: canonicalUrl.trim(),
        ogTitle: ogTitle.trim(),
        ogDescription: ogDescription.trim(),
        ogImageUrl: ogImageUrl.trim(),
        robotsNoIndex,
        robotsNoFollow,
      };

      let saved: BlogPost;
      if (isEdit) {
        saved = await blogPostService.update(id as string, payload);
      } else {
        saved = await blogPostService.create(payload);
      }

      if (coverFile) {
        const uploaded = await blogPostService.uploadCover(saved.id, coverFile);
        setCoverImageUrl(uploaded.coverImageUrl);
        setCoverFile(null);
      }
      if (!isEdit) {
        navigate(`/blog/posts/${saved.id}`, { replace: true });
      }

      setPost(saved);
      alert('ذخیره شد');
    } catch (error) {
      console.error('Failed to save blog post', error);
      alert('خطا در ذخیره‌سازی');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center bg-white rounded-xl shadow-sm border border-gray-100">
        <Loader2 className="animate-spin text-zafting-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            to="/blog/posts"
            className="p-2 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-gray-600"
          >
            <ArrowRight size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isEdit ? 'ویرایش پست' : 'افزودن پست جدید'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              آخرین بروزرسانی: {formatDateTime(post?.updatedAt || null)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEdit ? (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
              disabled={isSaving}
            >
              <Trash2 size={18} />
              حذف
            </button>
          ) : null}
          <button
            type="button"
            onClick={save}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zafting-accent text-white hover:bg-zafting-accent/90 transition-colors disabled:opacity-50"
            disabled={isSaving}
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            ذخیره
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="دسته‌بندی"
                value={categoryId}
                onChange={(e) => setCategoryId(String(e.target.value))}
                options={categories.map((c) => ({ value: c.id, label: c.title }))}
              />
              <Select
                label="وضعیت"
                value={status}
                onChange={(e) => setStatus(String(e.target.value) as BlogPostStatus)}
                options={[
                  { value: 'DRAFT', label: 'پیش‌نویس' },
                  { value: 'PUBLISHED', label: 'منتشر شده' },
                ]}
              />
            </div>

            {status === 'PUBLISHED' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  تاریخ انتشار (اختیاری)
                </label>
                <input
                  type="text"
                  value={publishedAtText}
                  onChange={(e) => setPublishedAtText(e.target.value)}
                  placeholder="YYYY-MM-DD HH:mm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr text-left"
                />
              </div>
            ) : null}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                عنوان
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                اسلاگ (اختیاری)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="مثال: spring-fashion-trends"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr text-left"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                متن کوتاه (اختیاری)
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                متن کامل
              </label>
              <div className="bg-white border border-gray-300 rounded-lg">
                <div className="flex items-center gap-2 p-2 border-b border-gray-200">
                  <button
                    type="button"
                    onClick={() => document.execCommand('bold')}
                    className="px-2 py-1 text-sm rounded hover:bg-gray-100"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    type="button"
                    onClick={() => document.execCommand('italic')}
                    className="px-2 py-1 text-sm rounded hover:bg-gray-100"
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    type="button"
                    onClick={() => document.execCommand('underline')}
                    className="px-2 py-1 text-sm rounded hover:bg-gray-100"
                    title="Underline"
                  >
                    U
                  </button>
                  <button
                    type="button"
                    onClick={() => document.execCommand('insertUnorderedList')}
                    className="px-2 py-1 text-sm rounded hover:bg-gray-100"
                    title="UL"
                  >
                    ••
                  </button>
                  <button
                    type="button"
                    onClick={() => document.execCommand('insertOrderedList')}
                    className="px-2 py-1 text-sm rounded hover:bg-gray-100"
                    title="OL"
                  >
                    1.
                  </button>
                  <button
                    type="button"
                    onClick={() => document.execCommand('formatBlock', false, 'h2')}
                    className="px-2 py-1 text-sm rounded hover:bg-gray-100"
                  >
                    H2
                  </button>
                </div>
                <div
                  className="min-h-[320px] px-3 py-2 outline-none prose max-w-none"
                  contentEditable
                  onInput={(e) => setContent((e.target as HTMLDivElement).innerHTML)}
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">کاور</h2>

            <div className="w-full aspect-[16/10] rounded-xl border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
              {coverResolved ? (
                <img src={coverResolved} alt="" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={28} className="text-gray-300" />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                آپلود عکس
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">حداکثر ۳ مگابایت</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt عکس (اختیاری)
              </label>
              <input
                type="text"
                value={coverImageAlt}
                onChange={(e) => setCoverImageAlt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setCoverFile(null);
                setCoverImageUrl(null);
              }}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              حذف کاور
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h2 className="text-lg font-bold text-gray-800">SEO</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Title (اختیاری)
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Description (اختیاری)
              </label>
              <textarea
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                کلمات کلیدی (با کاما جدا کنید)
              </label>
              <input
                type="text"
                value={seoKeywords}
                onChange={(e) => setSeoKeywords(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Canonical URL (اختیاری)
              </label>
              <input
                type="text"
                value={canonicalUrl}
                onChange={(e) => setCanonicalUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr text-left"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OG Title (اختیاری)
                </label>
                <input
                  type="text"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OG Description (اختیاری)
                </label>
                <textarea
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OG Image URL (اختیاری)
                </label>
                <input
                  type="text"
                  value={ogImageUrl}
                  onChange={(e) => setOgImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zafting-accent/20 dir-ltr text-left"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                id="robotsNoIndex"
                type="checkbox"
                checked={robotsNoIndex}
                onChange={(e) => setRobotsNoIndex(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="robotsNoIndex" className="text-sm text-gray-700">
                robots: noindex
              </label>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="robotsNoFollow"
                type="checkbox"
                checked={robotsNoFollow}
                onChange={(e) => setRobotsNoFollow(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="robotsNoFollow" className="text-sm text-gray-700">
                robots: nofollow
              </label>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={async () => {
          if (!id) return;
          setIsDeleting(true);
          try {
            await blogPostService.delete(id);
            setDeleteModalOpen(false);
            navigate('/blog/posts', { replace: true });
          } catch (error) {
            console.error('Failed to delete blog post', error);
            alert('خطا در حذف');
          } finally {
            setIsDeleting(false);
          }
        }}
        isLoading={isDeleting}
        title="حذف پست"
        message="آیا از حذف این پست مطمئن هستید؟"
        confirmText="حذف"
      />
    </div>
  );
};

export default BlogPostEditor;
