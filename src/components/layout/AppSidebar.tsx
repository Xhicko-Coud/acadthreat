"use client";

import Link from "next/link";
import { CopyrightIcon, ShieldCheckIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { adminNavigation } from "@/config/navigation";
import { siteConfig } from "@/config/site";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      className="border-r border-primary/20 bg-primary text-primary-foreground"
      collapsible="icon"
    >
      <SidebarHeader className="bg-primary text-primary-foreground">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground data-[active=true]:bg-white/15 data-[active=true]:text-primary-foreground group-data-[collapsible=icon]:justify-center"
              size="lg"
            >
              <Link href="/admin/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <ShieldCheckIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-semibold">
                    {siteConfig.name}
                  </span>
                  <span className="truncate text-xs text-primary-foreground/70">
                    {siteConfig.shortName} Admin Shell
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator className="bg-white/20" />

      <SidebarContent className="overflow-x-hidden bg-primary pr-1 text-primary-foreground [scrollbar-color:rgba(255,255,255,0.35)_rgba(13,91,52,0.65)] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-black/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/30 hover:[&::-webkit-scrollbar-thumb]:bg-white/45">
        <SidebarGroup>
          <SidebarGroupLabel className="text-primary-foreground/65">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = item.matchPaths.some(
                  (path) => pathname === path || pathname.startsWith(`${path}/`),
                );

                if (item.disabled) {
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        className="text-primary-foreground/70 hover:bg-white/8 hover:text-primary-foreground focus-visible:ring-white/25 data-[active=true]:bg-white/15 data-[active=true]:text-primary-foreground"
                        disabled
                        tooltip={item.label}
                      >
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                      {item.badge ? (
                        <SidebarMenuBadge className="right-2 text-[10px] text-primary-foreground/65 group-data-[collapsible=icon]:hidden">
                          {item.badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground focus-visible:ring-white/25 data-[active=true]:bg-white/15 data-[active=true]:text-primary-foreground"
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator className="bg-white/20" />

      <SidebarFooter className="bg-primary p-4 text-xs text-primary-foreground/70 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <CopyrightIcon className="size-4 shrink-0" aria-hidden="true" />
          <span className="group-data-[collapsible=icon]:hidden">
            AcadThreat V1.0.0
          </span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
