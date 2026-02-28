import { createHashRouter, RouterProvider, Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Users, Building2, ShoppingCart,
  ClipboardList, Receipt, Package, Menu, Calendar,
  Tag
} from 'lucide-react';

import {
  Customers, Dashboard, Brand, Dealer,
  GenerateBill, Products, StockManager,
  Orders, Collection, DealerPayment
} from "./pages";

const RootLayout = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const getPageTitle = () => {
    const path = location.pathname.substring(1);
    if (!path) return "Dashboard";
    return path.replace(/-/g, ' ');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-white border-r border-slate-200 flex flex-col shadow-sm`}>
        <div className="p-6 border-b flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl text-white shrink-0 shadow-lg">
            <Package size={24} />
          </div>
          {isSidebarOpen && <h1 className="font-bold text-xl tracking-tight">Med<span className="text-emerald-600">Track</span></h1>}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <SidebarItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" isOpen={isSidebarOpen} />
          <SectionLabel label="CRM & Supply" isOpen={isSidebarOpen} />
          <SidebarItem to="/customer" icon={<Users size={20} />} label="Customers" isOpen={isSidebarOpen} />
          <SidebarItem to="/dealer" icon={<Building2 size={20} />} label="Dealers" isOpen={isSidebarOpen} />
          <SectionLabel label="Inventory" isOpen={isSidebarOpen} />
          <SidebarItem to="/brand" icon={<Tag size={20} />} label="Brands" isOpen={isSidebarOpen} />
          <SidebarItem to="/products" icon={<ShoppingCart size={20} />} label="Products" isOpen={isSidebarOpen} />
          <SidebarItem to="/stock-manager" icon={<ClipboardList size={20} />} label="Stock Manager" isOpen={isSidebarOpen} />
          <SectionLabel label="Transactions" isOpen={isSidebarOpen} />
          <SidebarItem to="/order" icon={<ClipboardList size={20} />} label="Order" isOpen={isSidebarOpen} />
          <SidebarItem to="/collection" icon={<Receipt size={20} />} label="Collection" isOpen={isSidebarOpen} />
          <SidebarItem to="/dealer-payment" icon={<Receipt size={20} />} label="Dealer Payment" isOpen={isSidebarOpen} />
          <SidebarItem to="/generate-bill" icon={<Receipt size={20} />} label="Generate Bill" isOpen={isSidebarOpen} />
        </nav>

        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-4 border-t text-slate-400 flex justify-center hover:text-emerald-600 transition-colors">
          <Menu size={20} />
        </button>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8">
          <h2 className="text-lg font-bold capitalize text-slate-700">{getPageTitle()}</h2>
          <div className="bg-slate-100 rounded-full px-4 py-1.5 flex items-center gap-2">
            <Calendar size={14} className="text-slate-500" />
            <span className="text-xs font-bold text-slate-600">{new Date().toLocaleDateString()}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function SidebarItem({ to, icon, label, isOpen }: { to: string, icon: any, label: string, isOpen: boolean }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
        ${isActive ? 'bg-emerald-50 text-emerald-700 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'}
      `}
    >
      <span className="shrink-0">{icon}</span>
      {isOpen && <span className="text-sm whitespace-nowrap">{label}</span>}
    </NavLink>
  );
}

const router = createHashRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "customer", element: <Customers /> },
      { path: "brand", element: <Brand /> },
      { path: "dealer", element: <Dealer /> },
      { path: "products", element: <Products /> },
      { path: "stock-manager", element: <StockManager /> },
      { path: "generate-bill", element: <GenerateBill /> },
      { path: "collection", element: <Collection /> },
      { path: "order", element: <Orders /> },
      { path: "dealer-payment", element: <DealerPayment /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

const SectionLabel = ({ label, isOpen }: { label: string; isOpen: boolean }) => (
  <div className="py-3 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
    {isOpen ? label : '•••'}
  </div>
);