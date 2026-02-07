

import React from 'react';
import { UserRole } from '../types';
import { User, Truck, Factory, Check, Building, Landmark, Briefcase, Building2, Hammer } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({ currentRole, onRoleChange }) => {
  return (
    <div className="grid grid-cols-4 gap-2 w-full">
      <button
        onClick={() => onRoleChange(UserRole.CLIENT)}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
          currentRole === UserRole.CLIENT 
            ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' 
            : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <div className="relative">
          <User size={20} className="mb-1" />
          {currentRole === UserRole.CLIENT && (
            <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
              <Check size={8} />
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold">用户</span>
      </button>

      <button
        onClick={() => onRoleChange(UserRole.DRIVER)}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
          currentRole === UserRole.DRIVER 
            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' 
            : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <div className="relative">
          <Truck size={20} className="mb-1" />
          {currentRole === UserRole.DRIVER && (
            <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-0.5">
              <Check size={8} />
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold">司机</span>
      </button>

      <button
        onClick={() => onRoleChange(UserRole.DISPOSAL)}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
          currentRole === UserRole.DISPOSAL 
            ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-sm' 
            : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <div className="relative">
          <Factory size={20} className="mb-1" />
          {currentRole === UserRole.DISPOSAL && (
            <div className="absolute -top-1 -right-1 bg-orange-500 text-white rounded-full p-0.5">
              <Check size={8} />
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold">处置</span>
      </button>

      <button
        onClick={() => onRoleChange(UserRole.WORKER)}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
          currentRole === UserRole.WORKER 
            ? 'border-yellow-600 bg-yellow-50 text-yellow-800 shadow-sm' 
            : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <div className="relative">
          <Hammer size={20} className="mb-1" />
          {currentRole === UserRole.WORKER && (
            <div className="absolute -top-1 -right-1 bg-yellow-600 text-white rounded-full p-0.5">
              <Check size={8} />
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold">工队/搬运</span>
      </button>

      <button
        onClick={() => onRoleChange(UserRole.PROPERTY)}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
          currentRole === UserRole.PROPERTY 
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' 
            : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <div className="relative">
          <Building size={20} className="mb-1" />
          {currentRole === UserRole.PROPERTY && (
            <div className="absolute -top-1 -right-1 bg-indigo-500 text-white rounded-full p-0.5">
              <Check size={8} />
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold">物业</span>
      </button>

      <button
        onClick={() => onRoleChange(UserRole.GOVERNMENT)}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
          currentRole === UserRole.GOVERNMENT 
            ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' 
            : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <div className="relative">
          <Landmark size={20} className="mb-1" />
          {currentRole === UserRole.GOVERNMENT && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5">
              <Check size={8} />
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold">监管</span>
      </button>

      <button
        onClick={() => onRoleChange(UserRole.FLEET)}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
          currentRole === UserRole.FLEET 
            ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm' 
            : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <div className="relative">
          <Briefcase size={20} className="mb-1" />
          {currentRole === UserRole.FLEET && (
            <div className="absolute -top-1 -right-1 bg-cyan-500 text-white rounded-full p-0.5">
              <Check size={8} />
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold">车队</span>
      </button>

      <button
        onClick={() => onRoleChange(UserRole.ENTERPRISE)}
        className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
          currentRole === UserRole.ENTERPRISE 
            ? 'border-slate-600 bg-slate-100 text-slate-800 shadow-sm' 
            : 'border-transparent bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <div className="relative">
          <div className="flex items-center gap-1">
             <Building2 size={20} className="mb-1" />
          </div>
          {currentRole === UserRole.ENTERPRISE && (
            <div className="absolute -top-1 -right-1 bg-slate-800 text-white rounded-full p-0.5">
              <Check size={8} />
            </div>
          )}
        </div>
        <span className="text-[10px] font-bold">企业</span>
      </button>
    </div>
  );
};