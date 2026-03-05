import type { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export const Tabs = ({ tabs, activeTab, onTabChange }: TabsProps) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${
                  isActive
                    ? 'text-[#6B5B54]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6B5B54] rounded-t-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="min-h-[200px]">
        {tabs.find((t) => t.id === activeTab)?.content}
      </div>
    </div>
  );
};
