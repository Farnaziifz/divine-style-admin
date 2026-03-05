import { useParams, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const UserDetail = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/users" className="p-2 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors text-gray-600">
            <ArrowRight size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-[#2A2A2A]">جزئیات کاربر</h1>
      </div>
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <p className="text-gray-500">شناسه کاربر: {id}</p>
        <p className="mt-4 text-sm text-gray-400">اطلاعات تکمیلی به زودی...</p>
      </div>
    </div>
  );
};

export default UserDetail;
