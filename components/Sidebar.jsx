'use client';
import { useState } from 'react';
import { LayoutDashboard, Receipt, BarChart3, Users, RefreshCw, Sparkles, ChevronLeft, ChevronRight, Wallet, ShieldCheck } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi', icon: Receipt },
    { id: 'splitbill', label: 'Split Bill', icon: Users },
    { id: 'analytics', label: 'Analisis Finansial', icon: BarChart3 },
  ];

  return (
    <aside
      className={`glass-panel border-r border-slate-800 bg-slate-900/90 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } h-screen sticky top-0 p-4 z-30 shrink-0`}
    >
      {/* Upper Section: Brand & Navigation */}
      <div className="space-y-6">
        {/* Brand Logo & Collapse Toggle */}
        <div className="flex items-center justify-between px-2 pt-2">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
                <Wallet size={22} />
              </div>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-1">
                  Catatin <span className="text-xs">💰</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">AI FINANCIAL AGENT</p>
              </div>
            </div>
          )}

          {isCollapsed && (
            <div className="mx-auto w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Wallet size={20} />
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition border border-slate-700/60 hidden lg:flex items-center justify-center"
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* AI Gemma Active Badge */}
        {!isCollapsed ? (
          <div className="bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/20 rounded-2xl p-3 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-200">Gemma 4 IT</div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Tool Calling Active
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Gemma 4 IT Active">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
              <Sparkles size={16} className="animate-pulse" />
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center ${
                  isCollapsed ? 'justify-center px-0' : 'px-3.5'
                } py-3 rounded-2xl text-xs font-semibold transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} shrink-0`} />
                {!isCollapsed && <span className="ml-3 tracking-wide">{item.label}</span>}
                {isActive && !isCollapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section: Sync Status & User Profile */}
      <div className="space-y-3 pt-4 border-t border-slate-800/80">
        {!isCollapsed ? (
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-emerald-400 animate-spin-slow" />
              <span className="text-slate-300 font-medium text-[11px]">2-Way Google Sheets</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              Synced
            </span>
          </div>
        ) : (
          <div className="flex justify-center" title="Google Sheets Sync Active">
            <RefreshCw size={16} className="text-emerald-400 animate-spin-slow" />
          </div>
        )}

        {!isCollapsed ? (
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
              U
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">Pengguna Catatin</div>
              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <ShieldCheck size={10} className="text-blue-400" /> Pro Member
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs">
              U
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
