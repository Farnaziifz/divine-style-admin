import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { Table, type Column } from '../components/common/Table';
import { SearchInput } from '../components/common/SearchInput';
import { Select } from '../components/common/Select';
import { ConfirmModal } from '../components/common/ConfirmModal';
import {
  blogCategoryService,
  type BlogCategory,
} from '../services/blogCategory.service';
import {
  blogPostService,
  type BlogPostListItem,
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

const statusBadge = (status?: BlogPostStatus) => {
  if (status === 'PUBLISHED') return 'bg-green-100 text-green-700 border-green-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
};

const statusLabel = (status?: BlogPostStatus) => {
  if (status === 'PUBLISHED') return 'منتشر شده';
  return 'پیش‌نویس';
};

const BlogPosts = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<BlogPostListItem[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<BlogPostStatus | ''>('');
  const [categoryId, setCategoryId] = useState('');

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    id: string | null;
  }>({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    blogCategoryService
      .getAll()
      .then(setCategories)
      .catch((e) => console.error('Failed to fetch blog categories', e));
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await blogPostService.getAll({
        page,
        limit,
        ...(search.trim() ? { search: search.trim() } : {}),
        ...(status ? { status } : {}),
        ...(categoryId ? { categoryId } : {}),
      });
      setItems(res.data);
      setTotal(res.meta.total);
    } catch (error) {
      console.error('Failed to fetch blog posts', error);
    } finally {
      setIsLoading(false);
    }
  }, [categoryId, limit, page, search, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: Column<BlogPostListItem>[] = useMemo(
    () => [
      {
        key: 'title',
        title: 'عنوان',
        render: (p) => (
          <div className="min-w-0">
            <div className="font-medium text-gray-800 truncate">{p.title}</div>
            <div className="text-xs text-gray-500 font-mono dir-ltr text-left truncate">
              {p.slug}
            </div>
          </div>
        ),
      },
      {
        key: 'category',
        title: 'دسته‌بندی',
        render: (p) => p.category?.title || '—',
      },
      {
        key: 'status',
        title: 'وضعیت',
        render: (p) => (
          <span
            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${statusBadge(
              p.status,
            )}`}
          >
            {statusLabel(p.status)}
          </span>
        ),
      },
      {
        key: 'publishedAt',
        title: 'انتشار',
        render: (p) => formatDateTime(p.publishedAt),
      },
      {
        key: 'updatedAt',
        title: 'بروزرسانی',
        render: (p) => formatDateTime(p.updatedAt),
      },
      {
        key: 'actions',
        title: 'عملیات',
        render: (p) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/blog/posts/${p.id}`)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setDeleteModal({ isOpen: true, id: p.id })}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [navigate],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت پست‌های مجله</h1>
        <div className="flex items-center gap-2">
          <Link
            to="/blog/categories"
            className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
          >
            دسته‌بندی‌ها
          </Link>
          <button
            onClick={() => navigate('/blog/posts/create')}
            className="flex items-center gap-2 bg-zafting-accent text-white px-4 py-2 rounded-lg hover:bg-zafting-accent/90 transition-colors"
          >
            <Plus size={20} />
            <span>افزودن پست</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchInput
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="جستجو بر اساس عنوان یا اسلاگ"
          />
        </div>
        <div className="w-full md:w-56">
          <Select
            label="وضعیت"
            value={status}
            onChange={(e) => {
              setStatus(String(e.target.value) as BlogPostStatus | '');
              setPage(1);
            }}
            options={[
              { value: '', label: 'همه' },
              { value: 'DRAFT', label: 'پیش‌نویس' },
              { value: 'PUBLISHED', label: 'منتشر شده' },
            ]}
          />
        </div>
        <div className="w-full md:w-72">
          <Select
            label="دسته‌بندی"
            value={categoryId}
            onChange={(e) => {
              setCategoryId(String(e.target.value));
              setPage(1);
            }}
            options={[
              { value: '', label: 'همه' },
              ...categories.map((c) => ({ value: c.id, label: c.title })),
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="animate-spin text-zafting-accent" size={32} />
          </div>
        ) : (
          <Table
            data={items}
            columns={columns}
            emptyMessage="پستی یافت نشد"
            pagination={{
              page,
              limit,
              total,
              onPageChange: setPage,
            }}
          />
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, id: null })}
        onConfirm={async () => {
          if (!deleteModal.id) return;
          setIsDeleting(true);
          try {
            await blogPostService.delete(deleteModal.id);
            setDeleteModal({ isOpen: false, id: null });
            fetchData();
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

export default BlogPosts;

