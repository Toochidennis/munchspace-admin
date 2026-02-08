import React from 'react'
import { Button } from '../ui/button';
import { Bell } from 'lucide-react';

const Header = ({ title }: { title: string; }) => {
  return (
    <>
      {/* FIXED HEADER */}
      <header className="h-[72px]  border-b flex items-center justify-between px-8 flex-shrink-0 z-20">
        <h1 className="text-xl font-medium text-[#1A1C1E] capitalize">{title}</h1>
        <div className="flex items-center gap-5">
          <Button variant="ghost" size="icon" className="relative h-10 w-10">
            <Bell size={22} className="text-slate-600" />
            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#FF3B30] rounded-full border-2 border-white"></span>
          </Button>
          <div className="flex items-center gap-3 pl-5 border-l h-10">
            <p className="text-sm font-medium text-[#1A1C1E] hidden sm:block">
              James Author
            </p>
            <div className="w-10 h-10 rounded bg-black text-white flex items-center justify-center text-xs font-bold">
              JA
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header