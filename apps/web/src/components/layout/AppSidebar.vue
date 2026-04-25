<!-- src/components/layout/AppSidebar.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  LayoutDashboard, GitBranch, Plug, PlayCircle, FileText, KeyRound,
  Activity, Bell, Globe, Server, ClipboardList, ShoppingBag, ChevronLeft,
} from 'lucide-vue-next'
import { useShellStore } from '@/stores/shell'

const route = useRoute()
const shell = useShellStore()

const navGroups = [
  {
    label: null,
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'BUILD',
    items: [
      { label: 'Workflows', to: '/workflows', icon: GitBranch },
      { label: 'Connectors', to: '/connectors', icon: Plug },
      { label: 'Templates', to: '/templates', icon: FileText },
      { label: 'Secrets', to: '/secrets', icon: KeyRound },
    ],
  },
  {
    label: 'OPERATE',
    items: [
      { label: 'Runs', to: '/runs', icon: PlayCircle },
      { label: 'Monitoring', to: '/monitoring', icon: Activity },
      { label: 'Alerts', to: '/alerts', icon: Bell },
    ],
  },
  {
    label: 'ECOSYSTEM',
    items: [{ label: 'Marketplace', to: '/marketplace', icon: ShoppingBag }],
  },
  {
    label: 'PLATFORM',
    items: [
      { label: 'Environments', to: '/environments', icon: Server },
      { label: 'Audit', to: '/audit', icon: ClipboardList },
    ],
  },
]

function isActive(to: string) {
  return route.path === to || (to !== '/dashboard' && route.path.startsWith(to))
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
    e.preventDefault()
    shell.toggleSidebar()
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <aside :class="['sidebar', shell.sidebarCollapsed ? 'collapsed' : '']">
    <!-- Header: logo + toggle (toggle always visible) -->
    <div class="sidebar-header">
      <span class="sidebar-logo">vipsOS</span>
      <button class="toggle-btn" :aria-expanded="!shell.sidebarCollapsed" aria-label="Toggle sidebar"
        @click="shell.toggleSidebar()">
        <ChevronLeft class="chevron" :size="13" stroke-width="2.5" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <template v-for="group in navGroups" :key="group.label ?? 'top'">
        <p v-if="group.label" class="nav-section">{{ group.label }}</p>
        <div v-for="item in group.items" :key="item.to" class="nav-item-wrapper">
          <RouterLink
            :to="item.to"
            :class="['nav-item', isActive(item.to) ? 'active' : '']"
          >
            <component :is="item.icon" class="nav-icon" :size="13" stroke-width="2" />
            <span class="nav-label">{{ item.label }}</span>
          </RouterLink>
          <span class="nav-tooltip" aria-hidden="true">{{ item.label }}</span>
        </div>
      </template>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="nav-item-wrapper">
        <RouterLink to="/settings" :class="['nav-item', isActive('/settings') ? 'active' : '']">
          <Globe class="nav-icon" :size="13" stroke-width="2" />
          <span class="nav-label">Settings</span>
        </RouterLink>
        <span class="nav-tooltip" aria-hidden="true">Settings</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 184px;
  min-width: 184px;
  height: 100%;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1),
              min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}
.sidebar.collapsed { width: 46px; min-width: 46px; }

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 11px 8px 9px;
  gap: 6px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--sidebar-border);
}

.sidebar-logo {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  flex: 1;
  max-width: 120px;
  transition: opacity 0.15s, max-width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.collapsed .sidebar-logo { opacity: 0; max-width: 0; }

.toggle-btn {
  width: 26px;
  height: 26px;
  border-radius: 5px;
  background: var(--sidebar-border);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: auto;
  color: #94a3b8;
  transition: background 0.15s;
}
.toggle-btn:hover { background: #334155; }

.chevron {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.collapsed .chevron { transform: rotate(180deg); }

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0;
}

.nav-section {
  padding: 5px 10px 2px;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--sidebar-section);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: opacity 0.12s;
}
.collapsed .nav-section { opacity: 0; }

.nav-item-wrapper {
  position: relative;
  margin: 1px 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 7px;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition: background 0.12s;
  text-decoration: none;
  color: var(--sidebar-text);
}
.nav-item:hover { background: var(--sidebar-hover); }
.nav-item.active {
  background: var(--sidebar-active);
  color: #ffffff;
}

.nav-icon { flex-shrink: 0; }

.nav-label {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  transition: opacity 0.12s;
}
.collapsed .nav-label { opacity: 0; }

.nav-tooltip {
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: #1e293b;
  color: #f1f5f9;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 9px;
  border-radius: 5px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 50;
}
.collapsed .nav-item-wrapper:hover .nav-tooltip { opacity: 1; }

.sidebar-footer {
  border-top: 1px solid var(--sidebar-border);
  padding: 5px 0;
  flex-shrink: 0;
}
</style>
