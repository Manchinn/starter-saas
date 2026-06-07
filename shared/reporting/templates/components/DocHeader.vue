<template>
  <header class="flex items-start justify-between gap-6">
    <!-- Company identity (logo + name + address + contact lines) -->
    <div class="flex items-start gap-4 min-w-0">
      <img v-if="companyLogoSrc" :src="companyLogoSrc" :alt="companyName"
        class="max-h-16 max-w-[140px] object-contain flex-shrink-0" />
      <div class="min-w-0">
        <p class="text-[18px] font-bold text-[#1C2434] leading-tight">{{ companyName }}</p>
        <p v-if="companyAddress" class="text-[11px] text-[#637381] mt-1 whitespace-pre-line leading-snug">
          {{ companyAddress }}
        </p>
        <div class="text-[11px] text-[#637381] mt-1 space-y-0.5">
          <slot name="contact">
            <p v-if="companyPhone">{{ phoneLabel }} {{ companyPhone }}</p>
            <p v-if="showEmail && companyEmail">{{ companyEmail }}</p>
            <p v-if="showWebsite && companyWebsite">{{ companyWebsite }}</p>
            <p v-if="companyTaxId" class="tabular-nums">
              <span v-if="mutedTaxIdLabel" class="text-[#9BA7B0]">{{ taxIdLabel }}</span><template v-else>{{ taxIdLabel }}</template> {{ companyTaxId }}
            </p>
          </slot>
        </div>
      </div>
    </div>

    <!-- Document title block -->
    <div class="text-right flex-shrink-0">
      <slot name="title">
        <h2 class="text-[18px] font-bold text-[#1C2434] leading-tight" :class="{ uppercase: titleUppercase }">{{ title }}</h2>
        <p v-if="subtitle" class="text-[11px] text-[#9BA7B0] mt-1">({{ subtitle }})</p>
      </slot>
    </div>
  </header>
</template>

<script setup>
import { useCompanyProfile } from './useCompanyProfile'

defineProps({
  // Right-side document title (e.g. "TAX INVOICE"). Ignored if the `title` slot is used.
  title:           { type: String,  default: '' },
  titleUppercase:  { type: Boolean, default: false },
  // Optional parenthesised line under the title (e.g. "Original").
  subtitle:        { type: String,  default: '' },
  // Contact line labels — vary per document (literal "Tel:" vs i18n abbreviation).
  phoneLabel:      { type: String,  default: 'Tel:' },
  taxIdLabel:      { type: String,  default: 'Tax ID:' },
  // Some headers render the tax-id label in a lighter muted colour.
  mutedTaxIdLabel: { type: Boolean, default: false },
  showEmail:       { type: Boolean, default: false },
  showWebsite:     { type: Boolean, default: false },
})

const {
  companyName, companyAddress, companyPhone,
  companyEmail, companyTaxId, companyWebsite, companyLogoSrc,
} = useCompanyProfile()
</script>
