
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
  DollarSign, 
  ClipboardList, 
  FileText, 
  BarChart3 
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
    title: "Pricing",
    url: "#",
    icon: DollarSign,
    view: "pricing",
  },
  {
    title: "Work Orders",
    url: "#",
    icon: ClipboardList,
    view: "work-orders",
  },
  {
    title: "Invoices",
    url: "#",
    icon: FileText,
    view: "invoices",
  },
  {
    title: "Reports",
    url: "#",
    icon: BarChart3,
    view: "reports",
  },
];

interface AppSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <h2 className="text-lg font-semibold text-sidebar-foreground">FoodMosaic</h2>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={currentView === item.view ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                  >
                    <button 
                      onClick={() => onViewChange(item.view)}
                      className="flex items-center gap-2 w-full"
                    >
                      <item.icon className="w-4 h-4" />
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
