import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { templates, getTemplate } from '@/core/TemplateEngine'

const STORAGE_KEY = 'app-template'

export const useTemplateStore = defineStore('template', () => {
  const currentSlug = ref(localStorage.getItem(STORAGE_KEY) || 'default')

  const current = computed(() => getTemplate(currentSlug.value))

  function apply(slug) {
    currentSlug.value = slug
    localStorage.setItem(STORAGE_KEY, slug)
  }

  return { currentSlug, current, templates, apply }
})
