import React from 'react';
import { 
  Search, 
  Bell, 
  UserCircle, 
  Menu,
  ChevronDown
} from 'lucide-react';
import { cn } from '../utils/cn';

/**
 * Topbar with search, notifications and profile
 */
export default function Topbar({ title }) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
      {/* Search Bar */}
      <div className="flex flex-1 items-center">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-full border-none bg-slate-100 py-2 pl-10 pr-3 text-sm placeholder:text-slate-500 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            placeholder="Search transactions, customers..."
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 border-2 border-white"></span>
        </button>

        {/* Vertical Divider */}
        <div className="h-8 w-[1px] bg-slate-200"></div>

        {/* User Profile */}
        <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-slate-100">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
            AL
          </div>
          <div className="hidden text-left lg:block">
            <p className="text-sm font-semibold text-slate-900 leading-none">Ankit Lohani</p>
            <p className="text-xs text-slate-500 mt-1">Administrator</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
      </div>
    </header>
  );
}
