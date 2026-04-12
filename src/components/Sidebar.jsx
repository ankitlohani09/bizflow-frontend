import {
    BarChart2,
    Box,
    FileText,
    Home,
    ShoppingCart,
    User,
    Users,
    Wallet,
} from "lucide-react";

const menuItems = [
    { icon: Home, label: "Dashboard" },
    { icon: Users, label: "Customers" },
    { icon: Box, label: "Items" },
    { icon: BarChart2, label: "Inventory" },
    { icon: ShoppingCart, label: "Sales" },
    { icon: FileText, label: "Purchases" },
    { icon: Wallet, label: "Expenses" },
    { icon: User, label: "Staff" },
];

function SidebarItem({ icon, label, isActive = false }) {
  const MenuIcon = icon;

  return (
        <button
            className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition ${isActive
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
            type="button"
        >
      <MenuIcon size={18} />
            <span>{label}</span>
        </button>
    );
}

export default function Sidebar() {
    return (
        <aside className="hidden min-h-screen w-64 border-r border-slate-200 bg-white p-4 lg:block">
            <div className="mb-8">
                <h2 className="text-xl font-bold text-slate-900">BizFlow</h2>
                <p className="text-sm text-slate-500">SaaS Dashboard</p>
            </div>

            <nav className="space-y-2" aria-label="Main navigation">
                {/* Add or remove menu items from the menuItems array above. */}
                {menuItems.map((item) => (
                    <SidebarItem
                        icon={item.icon}
                        isActive={item.label === "Dashboard"}
                        key={item.label}
                        label={item.label}
                    />
                ))}
            </nav>
        </aside>
    );
}
