import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import {
  userService,
  type UserAddress,
  type UserProfile,
} from '../../services/user.service';
import { Loader2, MapPin, Pencil, Plus, Save, Trash2, User } from 'lucide-react';
import { Tabs } from '../../components/common/Tabs';

const ProfileSettings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [job, setJob] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    province: '',
    city: '',
    address: '',
    plaque: '',
    unit: '',
    postalCode: '',
    isDefault: false,
  });
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    void Promise.all([fetchProfile(), fetchAddresses()]);
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setName(data.name || '');
      setLastName(data.lastName || '');
      setJob(data.job || '');
      setNationalCode(data.nationalCode || '');
    } catch (error) {
      console.error('Failed to fetch profile', error);
      setMessage({ type: 'error', text: 'خطا در دریافت اطلاعات پروفایل' });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const data = await userService.getMyAddresses();
      setAddresses(data);
    } catch (error) {
      console.error('Failed to fetch addresses', error);
      setMessage({ type: 'error', text: 'خطا در دریافت لیست آدرس‌ها' });
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleUpdateProfile = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setMessage(null);

    try {
      await userService.updateProfile({
        name,
        lastName,
        job,
        nationalCode,
      });
      setMessage({ type: 'success', text: 'اطلاعات پروفایل با موفقیت بروزرسانی شد' });
    } catch (error) {
      console.error('Failed to update profile', error);
      setMessage({ type: 'error', text: 'خطا در بروزرسانی پروفایل' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({
      province: '',
      city: '',
      address: '',
      plaque: '',
      unit: '',
      postalCode: '',
      isDefault: false,
    });
  };

  const startEditAddress = (address: UserAddress) => {
    setEditingAddressId(address.id);
    setAddressForm({
      province: address.province || '',
      city: address.city || '',
      address: address.address || '',
      plaque: address.plaque || '',
      unit: address.unit || '',
      postalCode: address.postalCode || '',
      isDefault: !!address.isDefault,
    });
  };

  const handleAddressSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingAddress(true);
    setMessage(null);

    try {
      const payload = {
        province: addressForm.province.trim(),
        city: addressForm.city.trim(),
        address: addressForm.address.trim(),
        plaque: addressForm.plaque.trim() || undefined,
        unit: addressForm.unit.trim() || undefined,
        postalCode: addressForm.postalCode.trim() || undefined,
        isDefault: addressForm.isDefault,
      };

      const nextAddresses = editingAddressId
        ? await userService.updateMyAddress(editingAddressId, payload)
        : await userService.addMyAddress(payload);

      setAddresses(nextAddresses);
      setMessage({
        type: 'success',
        text: editingAddressId ? 'آدرس با موفقیت ویرایش شد' : 'آدرس با موفقیت اضافه شد',
      });
      resetAddressForm();
    } catch (error) {
      console.error('Failed to save address', error);
      setMessage({ type: 'error', text: 'خطا در ثبت آدرس' });
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setMessage(null);
    try {
      const nextAddresses = await userService.deleteMyAddress(addressId);
      setAddresses(nextAddresses);
      setMessage({ type: 'success', text: 'آدرس با موفقیت حذف شد' });
      if (editingAddressId === addressId) {
        resetAddressForm();
      }
    } catch (error) {
      console.error('Failed to delete address', error);
      setMessage({ type: 'error', text: 'خطا در حذف آدرس' });
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#6B5B54]" size={48} />
      </div>
    );
  }

  const profileTabContent = (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="p-2 bg-[#6B5B54]/10 rounded-lg text-[#6B5B54]">
          <User size={24} />
        </div>
        <h2 className="text-xl font-bold text-[#2A2A2A]">مشخصات فردی</h2>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">نام</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all"
              placeholder="نام خود را وارد کنید"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">نام خانوادگی</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all"
              placeholder="نام خانوادگی خود را وارد کنید"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">شغل / سمت</label>
          <input
            type="text"
            value={job}
            onChange={(e) => setJob(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all"
            placeholder="شغل خود را وارد کنید"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">کد ملی</label>
          <input
            type="text"
            value={nationalCode}
            onChange={(e) => setNationalCode(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all dir-ltr text-left"
            placeholder="Code Melli"
          />
        </div>

        <div className="space-y-2 opacity-60">
          <label className="block text-sm font-bold text-gray-700">شماره موبایل</label>
          <input
            type="text"
            value={profile?.mobile || ''}
            disabled
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 outline-none dir-ltr text-left cursor-not-allowed"
          />
          <p className="text-xs text-gray-400">شماره موبایل قابل تغییر نیست</p>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="flex items-center justify-center gap-2 w-full bg-[#6B5B54] hover:bg-[#5A4B45] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-[#6B5B54]/20 disabled:opacity-70"
          >
            {isSavingProfile ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            ذخیره تغییرات
          </button>
        </div>
      </form>
    </div>
  );

  const addressesTabContent = (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2 border-b border-gray-100 pb-4">
        <div className="p-2 bg-[#6B5B54]/10 rounded-lg text-[#6B5B54]">
          <MapPin size={24} />
        </div>
        <h2 className="text-xl font-bold text-[#2A2A2A]">آدرس‌ها</h2>
      </div>

      <form onSubmit={handleAddressSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            value={addressForm.province}
            onChange={(e) =>
              setAddressForm((prev) => ({ ...prev, province: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all"
            placeholder="استان"
            required
          />
          <input
            type="text"
            value={addressForm.city}
            onChange={(e) =>
              setAddressForm((prev) => ({ ...prev, city: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all"
            placeholder="شهر"
            required
          />
        </div>

        <textarea
          value={addressForm.address}
          onChange={(e) =>
            setAddressForm((prev) => ({ ...prev, address: e.target.value }))
          }
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all min-h-[90px]"
          placeholder="آدرس کامل"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            value={addressForm.plaque}
            onChange={(e) =>
              setAddressForm((prev) => ({ ...prev, plaque: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all"
            placeholder="پلاک (اختیاری)"
          />
          <input
            type="text"
            value={addressForm.unit}
            onChange={(e) =>
              setAddressForm((prev) => ({ ...prev, unit: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all"
            placeholder="واحد (اختیاری)"
          />
          <input
            type="text"
            value={addressForm.postalCode}
            onChange={(e) =>
              setAddressForm((prev) => ({ ...prev, postalCode: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all dir-ltr text-left"
            placeholder="کد پستی 10 رقمی"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={addressForm.isDefault}
            onChange={(e) =>
              setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))
            }
          />
          آدرس پیش‌فرض
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSavingAddress}
            className="flex items-center justify-center gap-2 bg-[#6B5B54] hover:bg-[#5A4B45] text-white font-bold py-2.5 px-5 rounded-xl transition-all disabled:opacity-70"
          >
            {isSavingAddress ? (
              <Loader2 className="animate-spin" size={18} />
            ) : editingAddressId ? (
              <Save size={18} />
            ) : (
              <Plus size={18} />
            )}
            {editingAddressId ? 'ذخیره ویرایش' : 'افزودن آدرس'}
          </button>
          {editingAddressId && (
            <button
              type="button"
              onClick={resetAddressForm}
              className="py-2.5 px-5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold"
            >
              انصراف
            </button>
          )}
        </div>
      </form>

      <div className="space-y-3">
        {isLoadingAddresses ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin text-[#6B5B54]" size={28} />
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-sm text-gray-500">هنوز آدرسی ثبت نشده است.</p>
        ) : (
          addresses.map((addressItem) => (
            <div
              key={addressItem.id}
              className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold text-[#2A2A2A]">
                  {addressItem.province} - {addressItem.city}
                  {addressItem.isDefault && (
                    <span className="mr-2 text-xs text-[#6B5B54] bg-[#6B5B54]/10 px-2 py-1 rounded-full">
                      پیش‌فرض
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEditAddress(addressItem)}
                    className="text-[#6B5B54] hover:text-[#5A4B45]"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAddress(addressItem.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700">{addressItem.address}</p>
              <div className="text-xs text-gray-500 flex flex-wrap gap-3">
                {addressItem.plaque ? <span>پلاک: {addressItem.plaque}</span> : null}
                {addressItem.unit ? <span>واحد: {addressItem.unit}</span> : null}
                {addressItem.postalCode ? (
                  <span className="dir-ltr">Postal: {addressItem.postalCode}</span>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const tabs = [
    {
      id: 'profile',
      label: 'مشخصات فردی',
      icon: <User size={18} />,
      content: profileTabContent,
    },
    {
      id: 'addresses',
      label: 'آدرس‌ها',
      icon: <MapPin size={18} />,
      content: addressesTabContent,
    },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-4xl">
      {message && (
        <div
          className={`p-4 mb-6 rounded-xl text-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}
      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default ProfileSettings;
