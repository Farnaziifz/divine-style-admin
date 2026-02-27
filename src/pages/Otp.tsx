import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toEnglishDigits } from '../utils/digits';

const Otp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If no phone number is provided (e.g. direct access), redirect to login
  if (!phoneNumber) {
    navigate('/login');
    return null;
  }

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // TODO: Call API to verify OTP
    // Simulation:
    setTimeout(() => {
      if (otp === '12345') { // Mock OTP
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/');
      } else {
        setError('کد وارد شده اشتباه است');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleOtpChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = toEnglishDigits(e.target.value);
    if (/^\d*$/.test(value)) {
      setOtp(value);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E8E0D9] p-4 font-sans" dir="rtl">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-[#2A2A2A]">پنل مدیریت دیواین</h1>
          <p className="text-gray-500">
            کد ارسال شده به {phoneNumber} را وارد کنید
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
              کد تایید
            </label>
            <input
              id="otp"
              type="text"
              value={otp}
              onChange={handleOtpChange}
              placeholder="12345"
              maxLength={5}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#6B5B54] focus:border-transparent outline-none transition-all text-center tracking-widest text-lg"
              required
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2A2A2A] hover:bg-[#6B5B54] text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'در حال بررسی...' : 'ورود'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full text-sm text-gray-500 hover:text-[#2A2A2A] transition-colors"
          >
            تغییر شماره موبایل
          </button>
        </form>
      </div>
    </div>
  );
};

export default Otp;
