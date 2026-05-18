import AppLayoutDefault from '@/layouts/AppLayoutDefault.vue'
import AppLayoutDark    from '@/layouts/AppLayoutDark.vue'
import AppLayoutModern  from '@/layouts/AppLayoutModern.vue'
import AppLayoutMinimal from '@/layouts/AppLayoutMinimal.vue'

export const templates = [
  {
    slug: 'default',
    name: 'Default',
    description: 'Classic sidebar with blue accent',
    tags: { nav: 'sidebar', theme: 'light' },
    isDefault: true,
    preview: {
      sidebar:  '#1d4ed8',
      topbar:   '#ffffff',
      content:  '#f9fafb',
      accent:   '#3b82f6',
    },
    layout: AppLayoutDefault,
  },
  {
    slug: 'dark',
    name: 'Dark',
    description: 'Full dark theme with slate sidebar',
    tags: { nav: 'sidebar', theme: 'dark' },
    preview: {
      sidebar:  '#1e293b',
      topbar:   '#1e293b',
      content:  '#0f172a',
      accent:   '#3b82f6',
    },
    layout: AppLayoutDark,
  },
  {
    slug: 'modern',
    name: 'Modern',
    description: 'Top navigation bar layout',
    tags: { nav: 'topNav', theme: 'light' },
    preview: {
      sidebar:  '#1d4ed8',
      topbar:   '#1d4ed8',
      content:  '#f9fafb',
      accent:   '#1d4ed8',
    },
    layout: AppLayoutModern,
  },
  {
    slug: 'minimal',
    name: 'Minimal',
    description: 'Compact dark sidebar with clean content area',
    tags: { nav: 'sidebar', theme: 'light' },
    preview: {
      sidebar:  '#111827',
      topbar:   '#ffffff',
      content:  '#f9fafb',
      accent:   '#6b7280',
    },
    layout: AppLayoutMinimal,
  },
]

export function getTemplate(slug) {
  return templates.find((t) => t.slug === slug) ?? templates[0]
}
