import { useRef, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Select } from '../components/common/Select';
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
import { sizeService, type Size } from '../services/size.service';
import { productService, type SpecificationValue } from '../services/product.service';
import { uploadService } from '../services/upload.service';
import { getImageUrl } from '../utils/image';
import {
  X,
  Plus,
  Upload,
  Loader2,
  ArrowRight,
} from 'lucide-react';

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Data Sources
  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [specKeys, setSpecKeys] = useState<SpecificationKey[]>([]);
  const [sizeOptions, setSizeOptions] = useState<Size[]>([]);

  // Form State - Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [basePrice, setBasePrice] = useState<number>(0);
  const [isFeatured, setIsFeatured] = useState(false);
  const [showInIntro, setShowInIntro] = useState(false);

  // Form State - Media
  // existingImages stores URLs of images already on the server
  const [existingImages, setExistingImages] = useState<string[]>([]);
  // newImages stores File objects for newly added images
  const [newImages, setNewImages] = useState<File[]>([]);
  // newImagePreviews stores data URLs for previews of new images
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // Form State - Variants
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colorInput, setColorInput] = useState('');
  const [sizePickerValue, setSizePickerValue] = useState<string>('');
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [newSizeName, setNewSizeName] = useState('');
  const [isAddingSize, setIsAddingSize] = useState(false);

  interface Variant {
    id: string; // temp id
    sku: string;
    size?: string;
    color?: string;
    price: number;
    discountPercent?: number;
    stock: number;
    specifications: Record<string, SpecificationValue>;
  }

  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>([]); // Selected Spec Key IDs
  const skipNextVariantRebuildRef = useRef(false);
  
  useEffect(() => {
    if (id) {
      fetchData(id);
    }
  }, [id]);

  const fetchData = async (productId: string) => {
    try {
      setIsLoading(true);
      const [cats, cols, specs, sizeList, product] = await Promise.all([
        categoryService.getAll(),
        collectionService.getAll(),
        specificationService.getAll(),
        sizeService.getAll(),
        productService.getById(productId),
      ]);
      setCategories(cats.data);
      setCollections(cols.data);
      setSpecKeys(specs);
      setSizeOptions(sizeList);

      // Populate Form
      setTitle(product.title);
      setDescription(product.description);
      setCategoryId(product.categoryId);
      setCollectionId(product.collectionIds?.[0] || '');
      setExistingImages(product.images || []);
      setIsFeatured(product.isFeatured ?? false);
      setShowInIntro(product.showInIntro ?? false);

      // Populate Variants & Specs
      if (product.variants && product.variants.length > 0) {
        skipNextVariantRebuildRef.current = true;
        // Extract unique colors and sizes
        const uniqueColors = new Set<string>();
        const uniqueSizes = new Set<string>();
        const uniqueSpecKeys = new Set<string>();
        
        // Base price from first variant if available
        setBasePrice(Number(product.variants[0].price) || 0);

        const mappedVariants: Variant[] = product.variants.map((v) => {
          const color = v.color ?? undefined;
          const size = v.size ?? undefined;

          if (color) uniqueColors.add(color);
          if (size) uniqueSizes.add(size);
          if (v.specifications) {
            Object.keys(v.specifications).forEach(k => uniqueSpecKeys.add(k));
          }

          return {
            id: Math.random().toString(36).substr(2, 9),
            sku: v.sku,
            size,
            color,
            price: Number(v.price) || 0,
            discountPercent:
              typeof v.discountPercent === 'number'
                ? v.discountPercent
                : v.discountPercent != null
                  ? Number(v.discountPercent) || undefined
                  : undefined,
            stock: Number(v.stock) || 0,
            specifications: v.specifications || {},
          };
        });

        setVariants(mappedVariants);
        setColors(Array.from(uniqueColors));
        setSizes(Array.from(uniqueSizes));
        setSelectedSpecs(Array.from(uniqueSpecKeys));
      }

    } catch (error) {
      console.error(error);
      alert('خطا در دریافت اطلاعات محصول');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages((prev) => [...prev, ...files]);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addColor = () => {
    if (colorInput && !colors.includes(colorInput)) {
      setColors([...colors, colorInput]);
      setColorInput('');
    }
  };

  const addSizeFromList = (name: string) => {
    if (name && !sizes.includes(name)) setSizes([...sizes, name]);
  };

  const addNewSize = async () => {
    const name = newSizeName.trim();
    if (!name) return;
    setIsAddingSize(true);
    try {
      const created = await sizeService.create({ name });
      setSizeOptions((prev) => [...prev, created].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)));
      if (!sizes.includes(created.name)) setSizes([...sizes, created.name]);
      setNewSizeName('');
      setIsSizeModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAddingSize(false);
    }
  };

  useEffect(() => {
    if (isLoading) return; // Don't run this effect while loading initial data
    if (skipNextVariantRebuildRef.current) {
      skipNextVariantRebuildRef.current = false;
      return;
    }

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
        // If no colors/sizes, preserve existing 'default' variant or create one
        const existing = findExisting(undefined, undefined);
        if (existing) newVariants.push(existing);
        else if (colors.length === 0 && sizes.length === 0) {
             newVariants.push({
                id: Math.random().toString(36).substr(2, 9),
                sku: 'default',
                price: basePrice,
                stock: 0,
                specifications: {},
              });
        }
      }
      return newVariants;
    });
  }, [colors, sizes, basePrice, isLoading]);

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
    if (!id) return;
    setIsSaving(true);
    try {
      // 1. Upload new images
      const uploadPromises = newImages.map((file) => uploadService.upload(file));
      const newUploadedUrls = await Promise.all(uploadPromises);

      // 2. Combine with existing images
      const finalImages = [...existingImages, ...newUploadedUrls];

      const payload = {
        title,
        description,
        categoryId,
        collectionIds: collectionId ? [collectionId] : undefined,
        images: finalImages,
        isFeatured,
        showInIntro,
        variants: variants.map((v) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, ...rest } = v;
          return rest;
        }),
      };

      await productService.update(id, payload);
      navigate('/products');
    } catch (error) {
      console.error(error);
      alert('خطا در ویرایش محصول');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-96">
              <Loader2 className="animate-spin text-zafting-accent" size={48} />
          </div>
      )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">ویرایش محصول</h1>
        <button
          onClick={() => navigate('/products')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowRight size={20} />
          <span>بازگشت</span>
        </button>
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
              <Select
                label="دسته‌بندی"
                value={categoryId}
                onChange={(e) => setCategoryId(String(e.target.value))}
                options={categories.map((c) => ({
                  label: c.title,
                  value: c.id,
                }))}
              />
            </div>
            <div>
              <Select
                label="کالکشن"
                value={collectionId}
                onChange={(e) => setCollectionId(String(e.target.value))}
                options={[
                  { label: 'بدون کالکشن', value: '' },
                  ...collections.map((c) => ({
                    label: c.title,
                    value: c.id,
                  })),
                ]}
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
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
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
            {/* Existing Images */}
            {existingImages.map((src, i) => (
              <div key={`existing-${i}`} className="relative group">
                <img
                  src={getImageUrl(src)}
                  alt={`Existing ${i}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => removeExistingImage(i)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
                <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">قبلی</span>
              </div>
            ))}

            {/* New Images */}
            {newImagePreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative group">
                <img
                  src={src}
                  alt={`New Preview ${i}`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
                />
                <button
                  onClick={() => removeNewImage(i)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
                <span className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">جدید</span>
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
                  سایزها (از لیست انتخاب یا اضافه کنید)
                </label>
                <div className="flex gap-2 flex-wrap items-center">
                  <div className="min-w-[220px]">
                    <Select
                      options={[
                        ...sizeOptions
                          .filter((opt) => !sizes.includes(opt.name))
                          .map((opt) => ({ label: opt.name, value: opt.name })),
                        { label: '➕ افزودن سایز جدید', value: '__add_new__' },
                      ]}
                      value={sizePickerValue}
                      onChange={(e) => {
                        const value = String(e.target.value);
                        if (value === '__add_new__') {
                          setIsSizeModalOpen(true);
                          setSizePickerValue('');
                          return;
                        }
                        if (value) addSizeFromList(value);
                        setSizePickerValue('');
                      }}
                      placeholder="انتخاب سایز..."
                    />
                  </div>
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

              <div className="space-y-3 md:hidden">
                {variants.map((variant) => (
                  <article
                    key={variant.id}
                    className="space-y-3 rounded-xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 p-4 shadow-sm"
                  >
                    <dl className="space-y-3">
                      <div className="border-b border-gray-100 pb-3">
                        <dt className="text-[11px] font-bold uppercase text-gray-500">SKU</dt>
                        <dd className="mt-1 text-sm">{variant.sku}</dd>
                      </div>
                      <div className="border-b border-gray-100 pb-3">
                        <dt className="text-[11px] font-bold uppercase text-gray-500">رنگ</dt>
                        <dd className="mt-1 text-sm">{variant.color || '—'}</dd>
                      </div>
                      <div className="border-b border-gray-100 pb-3">
                        <dt className="text-[11px] font-bold uppercase text-gray-500">سایز</dt>
                        <dd className="mt-1 text-sm">{variant.size || '—'}</dd>
                      </div>
                      <div className="border-b border-gray-100 pb-3">
                        <dt className="text-[11px] font-bold uppercase text-gray-500">قیمت</dt>
                        <dd className="mt-1">
                          <input
                            type="number"
                            value={variant.price}
                            onChange={(e) =>
                              updateVariant(variant.id, 'price', Number(e.target.value))
                            }
                            className="w-full max-w-xs rounded border px-2 py-2 text-left"
                          />
                        </dd>
                      </div>
                      <div className="border-b border-gray-100 pb-3">
                        <dt className="text-[11px] font-bold uppercase text-gray-500">تخفیف (%)</dt>
                        <dd className="mt-1">
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
                            className="w-full max-w-[8rem] rounded border px-2 py-2"
                            placeholder="مثلاً 20"
                          />
                        </dd>
                      </div>
                      <div className="border-b border-gray-100 pb-3">
                        <dt className="text-[11px] font-bold uppercase text-gray-500">قیمت نهایی</dt>
                        <dd className="mt-1 text-sm font-medium text-gray-700">
                          {typeof variant.discountPercent === 'number' &&
                          variant.discountPercent > 0
                            ? (
                                Math.round(
                                  ((variant.price * (100 - variant.discountPercent)) / 100) * 100,
                                ) / 100
                              ).toLocaleString()
                            : variant.price.toLocaleString()}
                        </dd>
                      </div>
                      <div className="border-b border-gray-100 pb-3">
                        <dt className="text-[11px] font-bold uppercase text-gray-500">موجودی</dt>
                        <dd className="mt-1">
                          <input
                            type="number"
                            value={variant.stock}
                            onChange={(e) =>
                              updateVariant(variant.id, 'stock', Number(e.target.value))
                            }
                            className="w-full max-w-[8rem] rounded border px-2 py-2"
                          />
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-bold uppercase text-gray-500">مشخصات</dt>
                        <dd className="mt-2 flex flex-col gap-2">
                          {selectedSpecs.map((specKey) => {
                            const specDef = specKeys.find((s) => s.key === specKey);
                            if (!specDef) return null;
                            return (
                              <div key={specKey} className="flex flex-col gap-1 text-sm">
                                <span className="text-gray-500">{specDef.label}</span>
                                <input
                                  type="text"
                                  value={String(variant.specifications[specKey] ?? '')}
                                  onChange={(e) =>
                                    updateVariantSpec(variant.id, specKey, e.target.value)
                                  }
                                  className="w-full rounded border px-2 py-2"
                                  placeholder="مقدار..."
                                />
                              </div>
                            );
                          })}
                        </dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
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
                                type="number" 
                                value={variant.price}
                                onChange={(e) => updateVariant(variant.id, 'price', Number(e.target.value))}
                                className="w-24 px-2 py-1 border rounded"
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
                        <td className="py-3 text-gray-600">
                          {typeof variant.discountPercent === 'number' && variant.discountPercent > 0
                            ? (Math.round(((variant.price * (100 - variant.discountPercent)) / 100) * 100) / 100).toLocaleString()
                            : variant.price.toLocaleString()}
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
                                                value={String(variant.specifications[specKey] ?? '')}
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
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="animate-spin" size={20} />}
            ذخیره تغییرات
          </button>
        )}
      </div>

      {/* Modal: افزودن سایز جدید */}
      <Modal
        isOpen={isSizeModalOpen}
        onClose={() => {
          setIsSizeModalOpen(false);
          setNewSizeName('');
        }}
        title="افزودن سایز جدید"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addNewSize();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">نام سایز *</label>
            <input
              type="text"
              value={newSizeName}
              onChange={(e) => setNewSizeName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-zafting-accent outline-none"
              placeholder="مثال: 42, XL, M"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button
              type="button"
              onClick={() => { setIsSizeModalOpen(false); setNewSizeName(''); }}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isAddingSize || !newSizeName.trim()}
              className="px-4 py-2 rounded-xl bg-zafting-accent text-white hover:bg-zafting-accent/90 disabled:opacity-50 flex items-center gap-2"
            >
              {isAddingSize && <Loader2 size={18} className="animate-spin" />}
              ذخیره
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EditProduct;
