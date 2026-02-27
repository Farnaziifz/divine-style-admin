import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { toEnglishDigits } from '../utils/digits';
import loginBg from '../assets/images/login.jpg';
import logo from '../assets/images/logo.svg';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // TODO: Call API to send OTP
    // Simulation:
    setTimeout(() => {
      if (phoneNumber.length < 10) {
        setError('شماره موبایل نامعتبر است');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      navigate('/otp', { state: { phoneNumber } });
    }, 1000);
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = toEnglishDigits(e.target.value);
    if (/^\d*$/.test(value)) {
      setPhoneNumber(value);
    }
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden" dir="rtl">
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 relative z-10 bg-white">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <div className="w-40 h-40 rounded-2xl flex items-center justify-center text-white">
                 <img src={logo} alt="Divine Logo" className="w-full h-full" />
              </div>
            </div>
            <h1 className="text-3xl font-extrabold text-[#2A2A2A]">دیواین</h1>
            <h2 className="text-2xl font-bold text-[#2A2A2A]">ورود به حساب کاربری</h2>
            <p className="text-gray-500 text-lg">
              برای ورود، لطفا شماره موبایل خود را وارد کنید.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSendOtp} className="space-y-6">
            <div className="space-y-2">
              <label 
                htmlFor="phone" 
                className="block text-sm font-bold text-gray-700 mb-2"
              >
                شماره موبایل
              </label>
              <input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-[#6B5B54] focus:ring-0 outline-none transition-all text-left dir-ltr text-lg placeholder:text-right"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#6B5B54] hover:bg-[#5A4B45] text-white font-bold text-lg py-4 px-6 rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-[#6B5B54]/20"
            >
              {isLoading ? 'در حال ارسال...' : 'ادامه'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            با ورود به اپلیکیشن، <a href="#" className="text-[#6B5B54] hover:underline">قوانین و مقررات</a> را می‌پذیرید.
          </p>
        </div>
      </div>

      {/* Left Side - Banner */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#2A2A2A] relative overflow-hidden flex-col justify-end p-12 text-white">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <img 
            src={loginBg} 
            alt="Login Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A2A2A] via-[#2A2A2A]/80 to-transparent"></div>
        </div>
        
        <div className="relative z-10 space-y-6 mb-12 max-w-lg">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm border border-white/20">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>نسخه جدید پنل مدیریت</span>
            </div>
            
            <h2 className="text-4xl font-bold leading-tight">
                مدیریت حرفه‌ای محصولات و سفارشات دیواین
            </h2>
            
            <p className="text-gray-300 text-lg leading-relaxed">
                با پنل پیشرفته دیواین، تمام فرآیندهای فروشگاه خود را یکپارچه کنید. از مدیریت موجودی تا پیگیری سفارشات، همه چیز در یک نگاه.
            </p>

            {/* Avatars / Social Proof */}
            <div className="flex items-center gap-4 pt-4">
                <div className="flex -space-x-4 space-x-reverse">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-[#2A2A2A] bg-gray-600 flex items-center justify-center text-xs font-bold overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="User" />
                        </div>
                    ))}
                    <div className="w-10 h-10 rounded-full border-2 border-[#2A2A2A] bg-[#6B5B54] flex items-center justify-center text-xs font-bold">
                        +2k
                    </div>
                </div>
                <div className="text-sm">
                    <span className="font-bold block">۲,۰۰۰+ کاربر</span>
                    <span className="text-gray-400 text-xs">به ما اعتماد کرده‌اند</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
