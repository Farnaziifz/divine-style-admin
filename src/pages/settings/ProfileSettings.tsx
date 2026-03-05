import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { userService, type UserProfile } from '../../services/user.service';
import { User, Save, Loader2 } from 'lucide-react';

const ProfileSettings = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [job, setJob] = useState('');
  const [nationalCode, setNationalCode] = useState('');
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
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

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-[#6B5B54]" size={48} />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl">
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
};

export default ProfileSettings;
