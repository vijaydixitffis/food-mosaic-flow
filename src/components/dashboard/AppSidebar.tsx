
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
  },
  {
    title: "Ingredients",
    url: "#",
    icon: Package,
  },
  {
    title: "Products",
    url: "#",
    icon: ShoppingCart,
  },
  {
    title: "Recipes",
    url: "#",
    icon: ChefHat,
  },
  {
    title: "Pricing",
    url: "#",
    icon: DollarSign,
  },
  {
    title: "Work Orders",
    url: "#",
    icon: ClipboardList,
  },
  {
    title: "Invoices",
    url: "#",
    icon: FileText,
  },
  {
    title: "Reports",
    url: "#",
    icon: BarChart3,
  },
];

export function AppSidebar() {
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
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
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
