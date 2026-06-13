import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  Home,
  Package,
  ShoppingCart,
  ChefHat,
  IndianRupee,
  ClipboardList,
  FileText,
  BarChart3,
  Layers,
  Users,
  Utensils,
  Factory,
  Settings,
  User,
  Tag,
  DatabaseBackup
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const allMenuItems = [
  { title: "Home",        url: "#", icon: Home,         view: "home" },
  { title: "Ingredients", url: "#", icon: Package,      view: "ingredients" },
  { title: "Compounds",   url: "#", icon: Layers,       view: "compounds" },
  { title: "Products",    url: "#", icon: ShoppingCart, view: "products" },
  { title: "Recipes",     url: "#", icon: ChefHat,      view: "recipes" },
  { title: "Clients",     url: "#", icon: Users,        view: "clients" },
  { title: "Categories",  url: "#", icon: Tag,          view: "categories" },
  { title: "Orders",      url: "#", icon: ShoppingCart, view: "orders" },
  { title: "Work Orders", url: "#", icon: Factory,      view: "work-orders" },
  { title: "Invoices",    url: "#", icon: IndianRupee,  view: "invoices" },
  { title: "Reports",     url: "#", icon: BarChart3,    view: "reports" },
  { title: "Settings",    url: "#", icon: Settings,        view: "settings" },
  { title: "Backup",      url: "#", icon: DatabaseBackup,  view: "backup" },
];

const ICON_COLORS: Record<string, string> = {
  Ingredients:  'text-orange-500',
  Compounds:    'text-green-500',
  Products:     'text-amber-500',
  Recipes:      'text-orange-500',
  Clients:      'text-green-500',
  Categories:   'text-purple-500',
  Orders:       'text-amber-500',
  'Work Orders':'text-green-600',
  Invoices:     'text-orange-500',
  Reports:      'text-green-500',
  Settings:     'text-green-500',
  Backup:       'text-blue-500',
};

const ROLE_LABELS: Record<string, string> = {
  admin:      'Administrator',
  supervisor: 'Supervisor',
  staff:      'Staff Member',
};

interface AppSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  profile?: any;
}

export function AppSidebar({ currentView, onViewChange, profile }: AppSidebarProps) {
  const { canAccessView } = useAuth();
  const visibleItems = allMenuItems.filter(item => canAccessView(item.view));
  const roleLabel = ROLE_LABELS[profile?.role] ?? 'Staff Member';

  return (
    <Sidebar className="bg-white shadow-xl border-r border-slate-200">
      <SidebarHeader className="p-6 border-b border-slate-200 bg-gradient-to-r from-green-50 to-orange-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Utensils className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">FoodMosaic</h1>
            <p className="text-xs text-slate-600 font-medium">Execute recipes and ship well</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 py-3 bg-slate-50 border-b border-slate-200">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-slate-500" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-slate-700">
                  {profile?.username || 'User'}
                </span>
                <span className="text-xs text-slate-500">{roleLabel}</span>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 py-6 space-y-1">
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`sidebar-item flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                      currentView === item.view
                        ? 'active bg-gradient-to-r from-green-500 to-green-600 text-white border-r-4 border-orange-500'
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-green-500 hover:to-green-600 hover:text-white hover:transform hover:translate-x-1'
                    }`}
                  >
                    <button
                      onClick={() => onViewChange(item.view)}
                      className="flex items-center gap-3 w-full"
                    >
                      <item.icon className={`w-5 h-5 ${
                        currentView === item.view
                          ? 'text-white'
                          : ICON_COLORS[item.title] ?? 'text-slate-500'
                      }`} />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
