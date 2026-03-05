import { useState } from 'react';
import type { FormEvent } from 'react';
import { authService } from '../../services/auth.service';
import { Lock, Loader2 } from 'lucide-react';

const SecuritySettings = () => {
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setIsSavingPassword(true);
    setMessage(null);

    if (password.length < 8) {
      setMessage({ type: 'error', text: 'رمز عبور باید حداقل ۸ کاراکتر باشد' });
      setIsSavingPassword(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'تکرار رمز عبور مطابقت ندارد' });
      setIsSavingPassword(false);
      return;
    }

    try {
      await authService.setPassword(password);
      setMessage({ type: 'success', text: 'رمز عبور با موفقیت تغییر کرد' });
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to set password', error);
      setMessage({ type: 'error', text: 'خطا در تغییر رمز عبور' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-md h-fit">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
        <div className="p-2 bg-[#6B5B54]/10 rounded-lg text-[#6B5B54]">
          <Lock size={24} />
        </div>
        <h2 className="text-xl font-bold text-[#2A2A2A]">امنیت و رمز عبور</h2>
      </div>

      {message && (
        <div className={`p-4 mb-6 rounded-xl text-sm ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSetPassword} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">رمز عبور جدید</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all dir-ltr"
            placeholder="********"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-700">تکرار رمز عبور جدید</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#6B5B54] outline-none transition-all dir-ltr"
            placeholder="********"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSavingPassword || !password}
            className="flex items-center justify-center gap-2 w-full bg-[#2A2A2A] hover:bg-black text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-black/10 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSavingPassword ? <Loader2 className="animate-spin" size={20} /> : <Lock size={20} />}
            تغییر رمز عبور
          </button>
        </div>
      </form>
    </div>
  );
};

export default SecuritySettings;
