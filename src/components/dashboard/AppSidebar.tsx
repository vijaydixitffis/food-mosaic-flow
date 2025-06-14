
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
  Layers
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
    title: "Pricing",
    url: "#",
    icon: IndianRupee,
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
    <Sidebar className="bg-muted/20">
      <SidebarHeader className="p-4">
        <div className="flex justify-center w-full">
          <img 
            src="/erp-icon.jpg" 
            alt="ERP Logo" 
            className="w-20 h-20 object-contain mx-auto"
            style={{ minWidth: '80px', minHeight: '80px' }}
          />
        </div>
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
                    className={currentView === item.view ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'}
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
