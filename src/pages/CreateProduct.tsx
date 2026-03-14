import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchableSelectWithAdd } from '../components/common/SearchableSelectWithAdd';
import { Modal } from '../components/common/Modal';
import {
  categoryService,
  type Category,
} from '../services/category.service';
import {
  collectionService,
  type Collection,
} from '../services/collection.service';
import {
  specificationService,
  type SpecificationKey,
} from '../services/specification.service';
import { productService } from '../services/product.service';
import { uploadService } from '../services/upload.service';
import {
  X,
  Plus,
  Upload,
  Loader2,
} from 'lucide-react';

const SPEC_TYPES = [
  { label: 'متن', value: 'TEXT' },
  { label: 'عدد', value: 'NUMBER' },
  { label: 'لیست تک‌انتخابی', value: 'SELECT' },
  { label: 'لیست چندانتخابی', value: 'MULTI_SELECT' },
] as const;

/** فرمت عدد با جداکنندهٔ هزارگان (برای نمایش قیمت). برای input خالی وقتی ۰ است '' برمی‌گرداند. */
function formatPriceWithSeparator(value: number, emptyWhenZero = true): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return emptyWhenZero ? '' : '۰';
  if (value === 0) return emptyWhenZero ? '' : '۰';
  return value.toLocaleString('fa-IR', { maximumFractionDigits: 0 });
}

/** تبدیل رشتهٔ قیمت (با یا بدون جداکننده، اعداد فارسی یا انگلیسی) به عدد */
function parsePriceWithSeparator(input: string): number {
  const persianDigits = '۰۱۲۳۴۵۶۷۸۹';
  let normalized = input.replace(/[^\d۰-۹]/g, '');
  for (let i = 0; i < 10; i++) {
    normalized = normalized.replace(new RegExp(persianDigits[i], 'g'), String(i));
  }
  if (normalized === '') return 0;
  const n = parseInt(normalized, 10);
  return Number.isNaN(n) ? 0 : n;
}

const CreateProduct = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Data Sources
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [specKeys, setSpecKeys] = useState<SpecificationKey[]>([]);

  // Form State - Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [isFeatured, setIsFeatured] = useState(false);
const [showInIntro, setShowInIntro] = useState(false);

  // Modals: Add Category / Add Collection
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalTitle, setCategoryModalTitle] = useState('');
  const [categoryModalDescription, setCategoryModalDescription] = useState('');
  const [isCategoryModalSaving, setIsCategoryModalSaving] = useState(false);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [collectionModalTitle, setCollectionModalTitle] = useState('');
  const [collectionModalDescription, setCollectionModalDescription] = useState('');
  const [isCollectionModalSaving, setIsCollectionModalSaving] = useState(false);
  const [searchCategoryLoading, setSearchCategoryLoading] = useState(false);
  const [searchCollectionLoading, setSearchCollectionLoading] = useState(false);
  
  // Form State - Media
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Form State - Variants
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');

  interface Variant {
    id: string; // temp id
    sku: string;
    size?: string;
    color?: string;
    price: number;
    discountPercent?: number;
    stock: number;
    specifications: Record<string, string | number>;
  }

  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]); // Selected Spec Key IDs

  // Add new specification key (step 1)
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecLabel, setNewSpecLabel] = useState('');
  const [newSpecType, setNewSpecType] = useState<'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT'>('TEXT');
  const [newSpecOptionsStr, setNewSpecOptionsStr] = useState('');
  const [isSavingNewSpec, setIsSavingNewSpec] = useState(false);
  
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [cats, cols, specs] = await Promise.all([
        categoryService.getAll(1, 50),
        collectionService.getAll(1, 50),
        specificationService.getAll(),
      ]);
      setCategories(cats.data);
      setCollections(cols.data);
      setSpecKeys(specs);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchCategoriesWithSearch = useCallback(async (search: string) => {
    setSearchCategoryLoading(true);
    try {
      const res = await categoryService.getAll(1, 50, search);
      setCategories(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setSearchCategoryLoading(false);
    }
  }, []);

  const fetchCollectionsWithSearch = useCallback(async (search: string) => {
    setSearchCollectionLoading(true);
    try {
      const res = await collectionService.getAll(1, 50, search);
      setCollections(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setSearchCollectionLoading(false);
    }
  }, []);

  const handleAddCategory = async () => {
    if (!categoryModalTitle.trim()) {
      alert('عنوان دسته‌بندی را وارد کنید.');
      return;
    }
    setIsCategoryModalSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', categoryModalTitle.trim());
      if (categoryModalDescription.trim()) formData.append('description', categoryModalDescription.trim());
      const created = await categoryService.create(formData);
      const res = await categoryService.getAll(1, 50);
      setCategories(res.data);
      setCategoryId(created.id);
      setIsCategoryModalOpen(false);
      setCategoryModalTitle('');
      setCategoryModalDescription('');
    } catch (error) {
      console.error(error);
      alert('خطا در ایجاد دسته‌بندی');
    } finally {
      setIsCategoryModalSaving(false);
    }
  };

  const handleAddCollection = async () => {
    if (!collectionModalTitle.trim()) {
      alert('عنوان کالکشن را وارد کنید.');
      return;
    }
    setIsCollectionModalSaving(true);
    try {
      const created = await collectionService.create({
        title: collectionModalTitle.trim(),
        description: collectionModalDescription.trim() || undefined,
      });
      const res = await collectionService.getAll(1, 50);
      setCollections(res.data);
      setCollectionId(created.id);
      setIsCollectionModalOpen(false);
      setCollectionModalTitle('');
      setCollectionModalDescription('');
    } catch (error) {
      console.error(error);
      alert('خطا در ایجاد کالکشن');
    } finally {
      setIsCollectionModalSaving(false);
    }
  };

  const handleAddNewSpec = async () => {
    const key = newSpecKey.trim().replace(/\s+/g, '_');
    const label = newSpecLabel.trim();
    if (!key || !label) {
      alert('کلید و عنوان نمایشی را وارد کنید.');
      return;
    }
    if (specKeys.some((s) => s.key === key)) {
      alert('این کلید قبلاً وجود دارد.');
      return;
    }
    setIsSavingNewSpec(true);
    try {
      const options =
        newSpecType === 'SELECT' || newSpecType === 'MULTI_SELECT'
          ? newSpecOptionsStr
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : undefined;
      const created = await specificationService.create({
        key,
        label,
        type: newSpecType,
        options,
      });
      setSpecKeys((prev) => [...prev, created]);
      setSelectedSpecs((prev) => (prev.includes(created.key) ? prev : [...prev, created.key]));
      setNewSpecKey('');
      setNewSpecLabel('');
      setNewSpecType('TEXT');
      setNewSpecOptionsStr('');
    } catch (error) {
      console.error(error);
      alert('خطا در ایجاد مشخصه.');
    } finally {
      setIsSavingNewSpec(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setImages((prev) => [...prev, ...files]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const addColor = () => {
    if (colorInput && !colors.includes(colorInput)) {
      setColors([...colors, colorInput]);
      setColorInput('');
    }
  };

  const addSize = () => {
    if (sizeInput && !sizes.includes(sizeInput)) {
      setSizes([...sizes, sizeInput]);
      setSizeInput('');
    }
  };

  useEffect(() => {
    setVariants((prev) => {
      const newVariants: Variant[] = [];
      const findExisting = (c?: string, s?: string) =>
        prev.find((v) => v.color === c && v.size === s);

      if (colors.length > 0 && sizes.length > 0) {
        colors.forEach((c) => {
          sizes.forEach((s) => {
            const existing = findExisting(c, s);
            if (existing) newVariants.push(existing);
            else
              newVariants.push({
                id: Math.random().toString(36).substr(2, 9),
                sku: `${c}-${s}`,
                color: c,
                size: s,
                price: basePrice,
                stock: 0,
                specifications: {},
              });
          });
        });
      } else if (colors.length > 0) {
        colors.forEach((c) => {
          const existing = findExisting(c, undefined);
          if (existing) newVariants.push(existing);
          else
            newVariants.push({
              id: Math.random().toString(36).substr(2, 9),
              sku: c,
              color: c,
              price: basePrice,
              stock: 0,
              specifications: {},
            });
        });
      } else if (sizes.length > 0) {
        sizes.forEach((s) => {
          const existing = findExisting(undefined, s);
          if (existing) newVariants.push(existing);
          else
            newVariants.push({
              id: Math.random().toString(36).substr(2, 9),
              sku: s,
              size: s,
              price: basePrice,
              stock: 0,
              specifications: {},
            });
        });
      } else {
        const existing = findExisting(undefined, undefined);
        if (existing) newVariants.push(existing);
        else
          newVariants.push({
            id: Math.random().toString(36).substr(2, 9),
            sku: 'default',
            price: basePrice,
            stock: 0,
            specifications: {},
          });
      }
      return newVariants;
    });
  }, [colors, sizes, basePrice]);

  const updateVariant = (
    id: string,
    field: keyof Variant,
    value: string | number | undefined,
  ) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const updateVariantSpec = (id: string, key: string, value: string) => {
    setVariants((prev) =>
      prev.map((v) =>
        v.id === id
          ? {
              ...v,
              specifications: { ...v.specifications, [key]: value },
            }
          : v
      )
    );
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const uploadPromises = images.map((file) => uploadService.upload(file));
      const uploadedUrls = await Promise.all(uploadPromises);

      const payload = {
        title,
        description,
        categoryId,
        collectionIds: collectionId ? [collectionId] : undefined,
        images: uploadedUrls,
        isFeatured,
        showInIntro,
        variants: variants.map((v) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, ...rest } = v;
          return rest;
        }),
      };

      await productService.create(payload);
      navigate('/products');
    } catch (error) {
      console.error(error);
      alert('خطا در ایجاد محصول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">افزودن محصول جدید</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                activeStep >= step
                  ? 'bg-zafting-accent text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`w-20 h-1 bg-gray-200 mx-2 ${
                  activeStep > step ? 'bg-zafting-accent' : ''
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Info */}
      {activeStep === 1 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xl font-bold mb-4">اطلاعات پایه</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                عنوان محصول
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none"
              />
            </div>
            <div>
              <SearchableSelectWithAdd
                label="دسته‌بندی"
                options={categories.map((c) => ({ id: c.id, title: c.title }))}
                value={categoryId}
                onChange={(id) => setCategoryId(id)}
                onSearchChange={fetchCategoriesWithSearch}
                onAddClick={() => setIsCategoryModalOpen(true)}
                placeholder="انتخاب دسته‌بندی"
                loading={searchCategoryLoading}
                addButtonLabel="افزودن دسته‌بندی"
              />
            </div>
            <div>
              <SearchableSelectWithAdd
                label="کالکشن"
                options={[
                  { id: '', title: 'بدون کالکشن' },
                  ...collections.map((c) => ({ id: c.id, title: c.title })),
                ]}
                value={collectionId}
                onChange={(id) => setCollectionId(id)}
                onSearchChange={fetchCollectionsWithSearch}
                onAddClick={() => setIsCollectionModalOpen(true)}
                placeholder="انتخاب کالکشن"
                loading={searchCollectionLoading}
                addButtonLabel="افزودن کالکشن"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              توضیحات
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none"
            />
          </div>
           <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                قیمت پایه (تومان)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formatPriceWithSeparator(basePrice)}
                onChange={(e) => setBasePrice(parsePriceWithSeparator(e.target.value))}
                placeholder="مثال: ۴۰٬۰۰۰٬۰۰۰"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none"
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-zafting-accent focus:ring-zafting-accent"
                />
                <span className="text-sm font-medium text-gray-700">محصول منتخب</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInIntro}
                  onChange={(e) => setShowInIntro(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-zafting-accent focus:ring-zafting-accent"
                />
                <span className="text-sm font-medium text-gray-700">نمایش در اینترو</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                مشخصات فنی محصول
              </label>
              <div className="border border-gray-200 rounded-xl p-4 flex flex-wrap gap-2">
                 {specKeys.length === 0 ? (
                     <p className="text-sm text-gray-500">هیچ مشخصه‌ای تعریف نشده است.</p>
                 ) : (
                     specKeys.map(spec => (
                         <button
                            key={spec.id}
                            type="button"
                            onClick={() => {
                                if (selectedSpecs.includes(spec.key)) {
                                    setSelectedSpecs(prev => prev.filter(k => k !== spec.key));
                                } else {
                                    setSelectedSpecs(prev => [...prev, spec.key]);
                                }
                            }}
                            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${selectedSpecs.includes(spec.key) ? 'bg-zafting-accent text-white border-zafting-accent' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                         >
                             {spec.label}
                         </button>
                     ))
                 )}
              </div>
              <p className="text-xs text-gray-500 mt-1">مشخصاتی که در اینجا انتخاب می‌کنید، در مرحله ۳ برای هر تنوع قابل مقداردهی خواهند بود.</p>

              {/* افزودن کلید مشخصات جدید */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">افزودن کلید مشخصات جدید</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">کلید (انگلیسی)</label>
                    <input
                      type="text"
                      value={newSpecKey}
                      onChange={(e) => setNewSpecKey(e.target.value)}
                      placeholder="مثال: bust"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-zafting-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">عنوان نمایشی</label>
                    <input
                      type="text"
                      value={newSpecLabel}
                      onChange={(e) => setNewSpecLabel(e.target.value)}
                      placeholder="مثال: دور سینه"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-zafting-accent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">نوع</label>
                    <select
                      value={newSpecType}
                      onChange={(e) => setNewSpecType(e.target.value as typeof newSpecType)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-zafting-accent outline-none"
                    >
                      {SPEC_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={handleAddNewSpec}
                      disabled={isSavingNewSpec}
                      className="flex items-center gap-1 px-4 py-2 rounded-lg bg-zafting-accent text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {isSavingNewSpec ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Plus size={16} />
                      )}
                      افزودن
                    </button>
                  </div>
                </div>
                {(newSpecType === 'SELECT' || newSpecType === 'MULTI_SELECT') && (
                  <div className="mt-3">
                    <label className="block text-xs text-gray-500 mb-1">گزینه‌ها (با کاما جدا کنید)</label>
                    <input
                      type="text"
                      value={newSpecOptionsStr}
                      onChange={(e) => setNewSpecOptionsStr(e.target.value)}
                      placeholder="گزینه۱, گزینه۲, گزینه۳"
                      className="w-full max-w-md px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-zafting-accent outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
        </div>
      )}

      {/* Step 2: Media */}
      {activeStep === 2 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h2 className="text-xl font-bold mb-4">تصاویر و ویدیو</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center gap-2 text-gray-500">
              <Upload size={32} />
              <span>برای آپلود تصاویر کلیک کنید یا رها کنید</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {imagePreviews.map((src, i) => (
              <div key={i} className="relative group">
                <img
                  src={src}
                  alt={`Preview ${i}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Variants */}
      {activeStep === 3 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
            <h2 className="text-xl font-bold mb-4">تنوع محصول (رنگ و سایز)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  رنگ‌ها
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={colorInput}
                    onChange={(e) => setColorInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addColor()}
                    placeholder="مثال: قرمز"
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 outline-none"
                  />
                  <button
                    onClick={addColor}
                    className="bg-gray-100 p-2 rounded-xl hover:bg-gray-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {colors.map((c) => (
                    <span
                      key={c}
                      className="bg-purple-50 text-purple-700 px-2 py-1 rounded-lg text-sm flex items-center gap-1"
                    >
                      {c}
                      <X
                        size={14}
                        className="cursor-pointer"
                        onClick={() =>
                          setColors(colors.filter((item) => item !== c))
                        }
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  سایزها
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sizeInput}
                    onChange={(e) => setSizeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addSize()}
                    placeholder="مثال: 42, XL"
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-200 outline-none"
                  />
                  <button
                    onClick={addSize}
                    className="bg-gray-100 p-2 rounded-xl hover:bg-gray-200"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {sizes.map((s) => (
                    <span
                      key={s}
                      className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-sm flex items-center gap-1"
                    >
                      {s}
                      <X
                        size={14}
                        className="cursor-pointer"
                        onClick={() =>
                          setSizes(sizes.filter((item) => item !== s))
                        }
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
          </div>

          {variants.length > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">لیست تنوع‌ها</h2>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">ویژگی‌های فعال:</span>
                        <div className="flex flex-wrap gap-1">
                             {selectedSpecs.length === 0 ? <span className="text-xs text-gray-400">هیچ</span> : 
                                selectedSpecs.map(key => {
                                    const spec = specKeys.find(s => s.key === key);
                                    return spec ? (
                                        <span key={key} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs border border-gray-200">
                                            {spec.label}
                                        </span>
                                    ) : null;
                                })
                             }
                        </div>
                    </div>
                </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="py-3 text-right">SKU</th>
                      <th className="py-3 text-right">رنگ</th>
                      <th className="py-3 text-right">سایز</th>
                      <th className="py-3 text-right">قیمت</th>
                      <th className="py-3 text-right">تخفیف (%)</th>
                      <th className="py-3 text-right">قیمت نهایی</th>
                      <th className="py-3 text-right">موجودی</th>
                      <th className="py-3 text-right">مشخصات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((variant) => (
                      <tr key={variant.id} className="border-b border-gray-50">
                        <td className="py-3">{variant.sku}</td>
                        <td className="py-3">{variant.color || '-'}</td>
                        <td className="py-3">{variant.size || '-'}</td>
                        <td className="py-3">
                            <input 
                                type="text"
                                inputMode="numeric"
                                value={formatPriceWithSeparator(variant.price)}
                                onChange={(e) => updateVariant(variant.id, 'price', parsePriceWithSeparator(e.target.value))}
                                placeholder="۰"
                                className="w-28 px-2 py-1 border rounded text-left"
                            />
                        </td>
                        <td className="py-3">
                            <input 
                                type="number"
                                min={0}
                                max={100}
                                value={variant.discountPercent ?? ''}
                                onChange={(e) =>
                                  updateVariant(
                                    variant.id,
                                    'discountPercent',
                                    e.target.value === '' ? undefined : Number(e.target.value),
                                  )}
                                className="w-20 px-2 py-1 border rounded"
                                placeholder="مثلاً 20"
                            />
                        </td>
                        <td className="py-3 text-gray-600 font-medium">
                          {typeof variant.discountPercent === 'number' && variant.discountPercent > 0
                            ? formatPriceWithSeparator(Math.round((variant.price * (100 - variant.discountPercent)) / 100), false)
                            : formatPriceWithSeparator(variant.price, false)}
                        </td>
                        <td className="py-3">
                             <input 
                                type="number" 
                                value={variant.stock}
                                onChange={(e) => updateVariant(variant.id, 'stock', Number(e.target.value))}
                                className="w-20 px-2 py-1 border rounded"
                            />
                        </td>
                        <td className="py-3">
                            {/* Specs Inputs for Selected Specs */}
                            <div className="flex flex-col gap-2">
                                {selectedSpecs.map(specKey => {
                                    const specDef = specKeys.find(s => s.key === specKey);
                                    if (!specDef) return null;
                                    return (
                                        <div key={specKey} className="flex items-center gap-2 text-sm">
                                            <span className="text-gray-500 w-20">{specDef.label}:</span>
                                            <input 
                                                type="text"
                                                value={variant.specifications[specKey] || ''}
                                                onChange={(e) => updateVariantSpec(variant.id, specKey, e.target.value)}
                                                className="px-2 py-1 border rounded w-32"
                                                placeholder="مقدار..."
                                            />
                                        </div>
                                    )
                                })}
                            </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <button
          onClick={() => activeStep > 1 && setActiveStep((p) => p - 1)}
          disabled={activeStep === 1}
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          مرحله قبل
        </button>
        {activeStep < 3 ? (
          <button
            onClick={() => setActiveStep((p) => p + 1)}
            className="px-6 py-3 rounded-xl bg-zafting-accent text-white hover:bg-zafting-accent/90"
          >
            مرحله بعد
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin" size={20} />}
            ثبت نهایی محصول
          </button>
        )}
      </div>

      {/* Modal: افزودن دسته‌بندی */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setCategoryModalTitle('');
          setCategoryModalDescription('');
        }}
        title="افزودن دسته‌بندی"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddCategory();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان *</label>
            <input
              type="text"
              value={categoryModalTitle}
              onChange={(e) => setCategoryModalTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none"
              placeholder="نام دسته‌بندی"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
            <textarea
              value={categoryModalDescription}
              onChange={(e) => setCategoryModalDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none"
              placeholder="اختیاری"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isCategoryModalSaving}
              className="px-4 py-2 rounded-xl bg-zafting-accent text-white hover:bg-zafting-accent/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isCategoryModalSaving && <Loader2 size={18} className="animate-spin" />}
              ذخیره
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: افزودن کالکشن */}
      <Modal
        isOpen={isCollectionModalOpen}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setCollectionModalTitle('');
          setCollectionModalDescription('');
        }}
        title="افزودن کالکشن"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddCollection();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">عنوان *</label>
            <input
              type="text"
              value={collectionModalTitle}
              onChange={(e) => setCollectionModalTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none"
              placeholder="نام کالکشن"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
            <textarea
              value={collectionModalDescription}
              onChange={(e) => setCollectionModalDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none"
              placeholder="اختیاری"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => setIsCollectionModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isCollectionModalSaving}
              className="px-4 py-2 rounded-xl bg-zafting-accent text-white hover:bg-zafting-accent/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isCollectionModalSaving && <Loader2 size={18} className="animate-spin" />}
              ذخیره
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CreateProduct;
