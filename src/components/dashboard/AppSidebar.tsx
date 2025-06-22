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
  User
} from 'lucide-react';

const adminMenuItems = [
  {
    title: "Home",
    url: "#",
    icon: Home,
    view: "home",
  },
  {
    title: "Ingredients",
    url: "#",
    icon: Package,
    view: "ingredients",
  },
  {
    title: "Compounds",
    url: "#",
    icon: Layers,
    view: "compounds",
  },
  {
    title: "Products",
    url: "#",
    icon: ShoppingCart,
    view: "products",
  },
  {
    title: "Recipes",
    url: "#",
    icon: ChefHat,
    view: "recipes",
  },
  {
    title: "Clients",
    url: "#",
    icon: Users,
    view: "clients",
  },
  {
    title: "Orders",
    url: "#",
    icon: ShoppingCart,
    view: "orders",
  },
  {
    title: "Work Orders",
    url: "#",
    icon: Factory,
    view: "work-orders",
  },
  {
    title: "Invoices",
    url: "#",
    icon: IndianRupee,
    view: "invoices",
  },
  {
    title: "Reports",
    url: "#",
    icon: BarChart3,
    view: "reports",
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
    view: "settings",
  },
];

interface AppSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  profile?: any;
}

export function AppSidebar({ currentView, onViewChange, profile }: AppSidebarProps) {
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
                  {profile?.username || 'admin'}
                </span>
                <span className="text-xs text-slate-500">
                  {profile?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                </span>
              </div>
            </div>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4 py-6 space-y-1">
              {adminMenuItems.map((item) => (
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
                          : item.title === 'Ingredients' ? 'text-orange-500' :
                            item.title === 'Compounds' ? 'text-green-500' :
                            item.title === 'Products' ? 'text-amber-500' :
                            item.title === 'Recipes' ? 'text-orange-500' :
                            item.title === 'Clients' ? 'text-green-500' :
                            item.title === 'Orders' ? 'text-amber-500' :
                            item.title === 'Work Orders' ? 'text-green-600' :
                            item.title === 'Invoices' ? 'text-orange-500' :
                            item.title === 'Reports' ? 'text-green-500' :
                            item.title === 'Settings' ? 'text-green-500' :
                            'text-slate-500'
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
