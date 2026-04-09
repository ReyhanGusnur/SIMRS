import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  ClipboardList,
  FileText,
  TestTube,
  XRay,
  Pill,
  DollarSign,
} from 'lucide-react';

const Sidebar = () => {
  const { user } = useAuth();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'dokter', 'perawat', 'farmasi', 'laboratorium', 'radiologi', 'kasir', 'registrasi'],
    },
    {
      name: 'Pasien',
      path: '/pasien',
      icon: Users,
      roles: ['admin', 'registrasi', 'dokter', 'perawat'],
    },
    {
      name: 'Dokter',
      path: '/dokter',
      icon: UserCog,
      roles: ['admin', 'registrasi'],
    },
    {
      name: 'Poli',
      path: '/poli',
      icon: Building2,
      roles: ['admin'],
    },
    {
      name: 'Pendaftaran',
      path: '/pendaftaran',
      icon: ClipboardList,
      roles: ['admin', 'registrasi', 'dokter', 'perawat'],
    },
    {
      name: 'Rekam Medis',
      path: '/rekam-medis',
      icon: FileText,
      roles: ['admin', 'dokter', 'perawat'],
    },
    {
      name: 'Laboratorium',
      path: '/laboratorium',
      icon: TestTube,
      roles: ['admin', 'laboratorium', 'dokter'],
    },
    {
      name: 'Radiologi',
      path: '/radiologi',
      icon: XRay,
      roles: ['admin', 'radiologi', 'dokter'],
    },
    {
      name: 'Farmasi',
      path: '/farmasi',
      icon: Pill,
      roles: ['admin', 'farmasi', 'dokter'],
    },
    {
      name: 'Keuangan',
      path: '/keuangan',
      icon: DollarSign,
      roles: ['admin', 'kasir'],
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  return (
    <aside className="w-64 bg-gray-800 min-h-screen">
      <div className="p-4">
        <nav className="space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Icon size={20} className="mr-3" />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
