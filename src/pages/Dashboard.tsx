const Dashboard = () => {
  return (
    <div>
      <h1 className="text-3xl font-serif text-zafting-accent mb-6">داشبورد</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
          <h3 className="text-lg font-medium text-zafting-text mb-2">فروش کل</h3>
          <p className="text-3xl font-bold text-zafting-accent">۱۲,۵۰۰,۰۰۰ تومان</p>
        </div>
        <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
          <h3 className="text-lg font-medium text-zafting-text mb-2">سفارشات جدید</h3>
          <p className="text-3xl font-bold text-zafting-accent">۱۵</p>
        </div>
        <div className="bg-white/60 p-6 rounded-xl shadow-sm border border-zafting-accent/10">
          <h3 className="text-lg font-medium text-zafting-text mb-2">کاربران فعال</h3>
          <p className="text-3xl font-bold text-zafting-accent">۱۲۴</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
