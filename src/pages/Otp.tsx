import { useState, useEffect, useRef } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toEnglishDigits } from '../utils/digits';
import { ArrowRight, Smartphone, KeyRound, Edit2 } from 'lucide-react';
import { authService } from '../services/auth.service';
import loginBg from '../assets/images/login.jpg';
import logo from '../assets/images/logo.svg';

const Otp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const phoneNumber = location.state?.phoneNumber;

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'otp' | 'password'>('otp');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // If no phone number is provided (e.g. direct access), redirect to login
  if (!phoneNumber) {
    navigate('/login');
    return null;
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const otpValue = otp.join('');
    
    try {
      let response;
      if (loginMethod === 'otp') {
        if (otpValue.length !== 5) {
          setError('کد وارد شده کامل نیست');
          setIsLoading(false);
          return;
        }
        response = await authService.verifyOtp(phoneNumber, otpValue);
      } else {
        if (!password) {
          setError('لطفا رمز عبور را وارد کنید');
          setIsLoading(false);
          return;
        }
        response = await authService.login(phoneNumber, password);
      }

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      navigate('/');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response: { data: { message: string } } };
        setError(error.response?.data?.message || 'خطایی در ورود رخ داد');
      } else {
        setError('خطایی در ورود رخ داد');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const digit = toEnglishDigits(value);
    if (!/^\d*$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit.slice(-1); // Only take the last char if multiple pasted
    setOtp(newOtp);

    // Auto-focus next input
    if (digit && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    try {
      await authService.sendOtp(phoneNumber);
      setCountdown(120);
      setOtp(['', '', '', '', '']);
      setError('');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response: { data: { message: string } } };
        setError(error.response?.data?.message || 'خطایی در ارسال مجدد کد رخ داد');
      } else {
        setError('خطایی در ارسال مجدد کد رخ داد');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden" dir="rtl">
      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 relative z-10 bg-white">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-between items-center mb-8">
               <button 
                onClick={() => navigate('/login')}
                className="flex items-center text-gray-500 hover:text-[#2A2A2A] transition-colors"
               >
                 <ArrowRight size={20} className="ml-2" />
                 بازگشت
               </button>
               <div className="w-40 h-40 rounded-2xl flex items-center justify-center text-white">
                 <img src={logo} alt="Divine Style Logo" className="w-full h-full" />
               </div>
            </div>

            <h2 className="text-3xl font-bold text-[#2A2A2A]">
              {loginMethod === 'otp' ? 'کد تایید را وارد کنید' : 'رمز عبور را وارد کنید'}
            </h2>
            
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <span className="text-lg dir-ltr font-mono">{phoneNumber}</span>
              <button 
                onClick={() => navigate('/login')}
                className="text-[#6B5B54] text-sm font-bold hover:underline flex items-center gap-1"
              >
                <Edit2 size={14} />
                ویرایش
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-100 p-1 rounded-xl flex">
            <button
              onClick={() => { setLoginMethod('otp'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                loginMethod === 'otp' 
                  ? 'bg-white text-[#2A2A2A] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Smartphone size={18} />
              ورود با کد تایید
            </button>
            <button
              onClick={() => { setLoginMethod('password'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${
                loginMethod === 'password' 
                  ? 'bg-white text-[#2A2A2A] shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <KeyRound size={18} />
              ورود با رمز عبور
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleVerify} className="space-y-8">
            {loginMethod === 'otp' ? (
              <div className="space-y-4">
                <div className="flex justify-center gap-3" dir="ltr">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-200 focus:border-[#6B5B54] focus:ring-0 outline-none transition-all"
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                <p className="text-center text-sm text-gray-500">
                  کد ۵ رقمی به شماره شما ارسال شد.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  رمز عبور
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 focus:border-[#6B5B54] focus:ring-0 outline-none transition-all text-lg"
                  placeholder="رمز عبور خود را وارد کنید"
                  autoFocus
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || (loginMethod === 'otp' && otp.some(d => !d)) || (loginMethod === 'password' && !password)}
              className="w-full bg-[#6B5B54] hover:bg-[#5A4B45] text-white font-bold text-lg py-4 px-6 rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-[#6B5B54]/20"
            >
              {isLoading ? 'در حال بررسی...' : 'تایید و ورود'}
            </button>

            {loginMethod === 'otp' && (
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-gray-500 text-sm font-mono dir-ltr">
                    ارسال مجدد ({formatTime(countdown)})
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    className="text-[#6B5B54] text-sm font-bold hover:underline"
                  >
                    ارسال مجدد کد
                  </button>
                )}
              </div>
            )}
          </form>
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
                مدیریت حرفه‌ای محصولات و سفارشات دیواین استایل
            </h2>
            
            <p className="text-gray-300 text-lg leading-relaxed">
                با پنل پیشرفته دیواین استایل، تمام فرآیندهای فروشگاه خود را یکپارچه کنید. از مدیریت موجودی تا پیگیری سفارشات، همه چیز در یک نگاه.
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

export default Otp;
