import React from 'react';
import Sidebar from './Sidebar';
import { useSidebar } from './context/SidebarContext';

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-[#FFFAF5]">
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-500 ease-in-out ${isCollapsed ? 'md:ml-24' : 'md:ml-72'}`}>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;