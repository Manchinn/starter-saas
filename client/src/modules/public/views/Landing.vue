<template>
  <div class="landing min-h-screen flex flex-col bg-[#FBF7F1] relative overflow-x-hidden">

    <!-- ── Background layers ─────────────────────────────────────────────────── -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute inset-0"
        style="background:
          radial-gradient(ellipse 46% 30% at 50% -6%, rgba(232,99,47,.14) 0%, transparent 60%),
          radial-gradient(ellipse 40% 26% at 88% 12%, rgba(255,201,77,.10) 0%, transparent 60%);" />
      <div class="absolute top-[-100px] right-[-80px] w-[500px] h-[500px] blur-[120px]"
        style="background: radial-gradient(circle, rgba(255,120,71,0.10) 0%, transparent 70%)" />
      <div class="absolute bottom-[-80px] left-[-60px] w-[400px] h-[400px] blur-[100px]"
        style="background: radial-gradient(circle, rgba(255,201,77,0.10) 0%, transparent 70%)" />
    </div>

    <!-- ── Top nav (glass) ────────────────────────────────────────────────────── -->
    <nav class="sticky top-0 z-30 mx-4 sm:mx-6 mt-4 glass-nav rounded-2xl flex items-center justify-between px-5 py-3">
      <BrandMark
        mark-class="w-8 h-8 rounded-lg"
        name-class="text-[16px] font-bold text-[#1C1917] tracking-[-0.3px]" />
      <div class="flex items-center gap-2">
        <RouterLink to="/login"
          class="px-3.5 py-2 text-[13px] font-medium text-[#57534E] hover:text-[#1C1917] rounded-lg hover:bg-black/[0.04] transition-colors">
          {{ t('landing.ctaLogin') }}
        </RouterLink>
        <RouterLink to="/register"
          class="px-4 py-2 text-[13px] font-semibold text-white rounded-xl bg-primary-500 hover:bg-primary-600 active:scale-[0.98] transition-all">
          {{ t('landing.ctaRegister') }}
        </RouterLink>
      </div>
    </nav>

    <!-- ── Hero ───────────────────────────────────────────────────────────────── -->
    <section class="relative z-10 px-5 pt-14 sm:pt-20 pb-10 text-center">
      <div class="max-w-2xl mx-auto">
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7"
          style="background: rgba(232,99,47,0.08); border: 1px solid rgba(232,99,47,0.25);">
          <span class="w-1.5 h-1.5 bg-primary-400 animate-pulse flex-shrink-0" />
          <span class="text-[11px] font-semibold text-primary-400 tracking-widest uppercase">
            {{ t('landing.badge') }}
          </span>
        </div>

        <h1 class="text-[38px] sm:text-[52px] font-bold leading-[1.1] tracking-[-1.5px] text-[#1C1917]">
          {{ t('landing.heroTitle') }}
        </h1>
        <p class="mt-5 text-[15px] sm:text-[16px] leading-relaxed text-[#57534E] max-w-[600px] mx-auto">
          {{ t('landing.heroSub') }}
        </p>

        <!-- CTAs -->
        <div class="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            @click="$router.push('/login')"
            class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 text-[14px] font-semibold text-white rounded-xl
                   bg-[#06C755] hover:bg-[#05B04B] active:bg-[#05A046]
                   shadow-[0_4px_14px_rgba(28,25,23,0.18)] transition-all duration-150 hover:-translate-y-0.5">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 2.5H6C3.24 2.5 1 4.74 1 7.5v6.53c0 2.76 2.24 5 5 5h5.5l5.5 3.5v-3.5H18c2.76 0 5-2.24 5-5V7.5c0-2.76-2.24-5-5-5z" />
            </svg>
            <span>{{ t('landing.ctaLine') }}</span>
          </button>

          <RouterLink to="/register"
            class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-[14px] font-semibold text-[#1C1917] rounded-xl
                   bg-white hover:bg-[#FFF7EE] shadow-[0_2px_10px_rgba(28,25,23,0.08)] ring-1 ring-black/[0.06]
                   transition-all duration-150 hover:-translate-y-0.5">
            {{ t('landing.ctaRegister') }}
          </RouterLink>
        </div>

        <!-- trust row -->
        <div class="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-[#79716B]">
          <span v-for="tr in trustRow" :key="tr" class="inline-flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-primary-400" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
            {{ tr }}
          </span>
        </div>
      </div>
    </section>

    <!-- ── Phone mockup + floating chips ──────────────────────────────────────── -->
    <section class="relative z-10 px-5 pb-6">
      <div class="relative max-w-md mx-auto">
        <div class="absolute inset-x-0 top-0 h-full rounded-[36px] bg-[#1C1917] shadow-[0_24px_60px_rgba(28,25,23,0.28)]"
          style="transform: translateY(12px);" />
        <div class="relative rounded-[32px] m-1.5 bg-[#FFFDF9] ring-1 ring-black/[0.05] p-4">
          <div class="flex items-center gap-2.5 pb-3 border-b border-black/[0.05]">
            <div class="w-9 h-9 rounded-xl bg-primary-500 text-white grid place-items-center text-[13px] font-bold">ก</div>
            <div class="min-w-0">
              <div class="text-[13px] font-bold text-[#1C1917] leading-tight">{{ t('landing.phoneShop') }}</div>
              <div class="text-[10.5px] text-[#79716B]">{{ t('landing.phoneToday') }}</div>
            </div>
            <div class="ml-auto pill pill-ok">{{ t('landing.phonePaid') }} 12</div>
          </div>
          <div class="mt-3 space-y-2">
            <div v-for="o in phoneOrders" :key="o.no"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F6F1EA] animate-order" :style="{ animationDelay: o.delay }">
              <div class="w-8 h-8 rounded-lg grid place-items-center text-[11px] font-bold flex-shrink-0 text-[#9A3412] bg-[#FFE3D6]">
                {{ o.no }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[12px] font-semibold text-[#1C1917]">{{ t('landing.phoneOrder') }} #{{ o.no }}</div>
                <div class="text-[10.5px] text-[#79716B]">{{ o.amount }} · {{ t('landing.phoneToday') }}</div>
              </div>
              <div class="text-[11px] font-bold" :style="{ color: o.statusColor }">{{ o.status }}</div>
            </div>
          </div>
          <div class="mt-3 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#06C755]/[0.08] text-[10.5px] font-medium text-[#047A3C]">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2.5H6C3.24 2.5 1 4.74 1 7.5v6.53c0 2.76 2.24 5 5 5h5.5l5.5 3.5v-3.5H18c2.76 0 5-2.24 5-5V7.5c0-2.76-2.24-5-5-5z"/></svg>
            {{ t('landing.phonePush') }} · {{ t('landing.phonePushVia') }}
          </div>
        </div>

        <!-- floating chips (desktop) -->
        <div class="hidden sm:flex glass-chip left-[-115px] top-[52px] animate-float" style="animation-delay:.2s">
          <span class="chip-dot bg-primary-400"></span>
          <div>
            <div class="text-[11.5px] font-bold text-[#1C1917]">฿12,450</div>
            <div class="text-[10px] text-[#79716B]">{{ t('landing.chip1') }}</div>
          </div>
        </div>
        <div class="hidden sm:flex glass-chip right-[-105px] top-[36px] animate-float" style="animation-delay:1.4s">
          <span class="w-7 h-7 rounded-lg bg-[#06C755] grid place-items-center flex-shrink-0">
            <svg class="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2.5H6C3.24 2.5 1 4.74 1 7.5v6.53c0 2.76 2.24 5 5 5h5.5l5.5 3.5v-3.5H18c2.76 0 5-2.24 5-5V7.5c0-2.76-2.24-5-5-5z"/></svg>
          </span>
          <div>
            <div class="text-[11.5px] font-bold text-[#1C1917]">{{ t('landing.chip2') }}</div>
            <div class="text-[10px] text-[#79716B]">{{ t('landing.chip2Note') }}</div>
          </div>
        </div>
        <div class="hidden sm:flex glass-chip left-[-95px] bottom-[44px] animate-float" style="animation-delay:.8s">
          <span class="chip-dot bg-emerald-500"></span>
          <div>
            <div class="text-[11.5px] font-bold text-[#1C1917]">132</div>
            <div class="text-[10px] text-[#79716B]">{{ t('landing.chip3') }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Trust strip ────────────────────────────────────────────────────────── -->
    <section class="relative z-10 px-5 py-8">
      <div class="max-w-4xl mx-auto glass-card rounded-2xl px-6 py-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div class="text-[13px] font-bold text-[#1C1917]">{{ t('landing.stripTitle') }}</div>
        <div class="text-[12.5px] text-[#57534E] sm:border-l border-black/[0.06] sm:pl-4">{{ t('landing.strip2') }}</div>
        <div class="text-[12.5px] text-[#57534E] sm:border-l border-black/[0.06] sm:pl-4">{{ t('landing.strip3') }}</div>
        <div class="text-[12.5px] text-[#57534E] sm:border-l border-black/[0.06] sm:pl-4">{{ t('landing.strip4') }}</div>
      </div>
    </section>

    <!-- ── What you can do (3 cards) ──────────────────────────────────────────── -->
    <section class="relative z-10 px-5 py-12">
      <div class="max-w-5xl mx-auto">
        <h2 class="text-[20px] sm:text-[24px] font-bold text-[#1C1917] tracking-[-0.5px] mb-6 text-center">
          {{ t('landing.whatTitle') }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="item in items" :key="item.title" class="glass-card glass-hover rounded-2xl px-5 py-5 text-left">
            <div class="flex items-center gap-2.5 mb-2">
              <span class="w-1.5 h-1.5 bg-primary-400 flex-shrink-0" />
              <h3 class="text-[14px] font-semibold text-[#1C1917]">{{ item.title }}</h3>
            </div>
            <p class="text-[13px] leading-relaxed text-[#57534E]">{{ item.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Dashboard split ────────────────────────────────────────────────────── -->
    <section class="relative z-10 px-5 py-12">
      <div class="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <div class="kicker">{{ t('landing.dashKicker') }}</div>
          <h2 class="text-[24px] sm:text-[30px] font-bold text-[#1C1917] tracking-[-1px] leading-[1.25] mt-2">
            {{ t('landing.dashTitle') }}
          </h2>
          <p class="mt-4 text-[14px] leading-relaxed text-[#57534E]">{{ t('landing.dashLead') }}</p>
          <div class="mt-5 space-y-2.5">
            <div v-for="tick in dashTicks" :key="tick" class="flex items-start gap-2.5 text-[13.5px] text-[#44403C]">
              <svg class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
              {{ tick }}
            </div>
          </div>
        </div>
        <div class="panel-dark rounded-[22px] p-6 relative overflow-hidden">
          <div class="relative text-[10px] font-bold tracking-[0.14em] uppercase text-white/45">{{ t('landing.dashPanel') }}</div>
          <div class="relative grid grid-cols-2 gap-3 mt-4">
            <div v-for="m in dashMetrics" :key="m.label" class="px-3.5 py-3 rounded-2xl bg-white/[0.055] ring-1 ring-white/[0.09]">
              <div class="text-[10px] text-white/45">{{ m.label }}</div>
              <div class="text-[19px] font-bold text-[#F5F5F4] mt-0.5">{{ m.value }}</div>
              <div class="text-[10.5px] font-semibold" :style="{ color: m.up ? '#6EE7A0' : '#FCD34D' }">{{ m.delta }}</div>
            </div>
            <div class="col-span-2 px-3.5 py-3 rounded-2xl bg-white/[0.055] ring-1 ring-white/[0.09]">
              <div class="text-[10px] text-white/45 mb-2">{{ t('landing.dashChart') }}</div>
              <div class="flex items-end gap-1.5 h-[72px]">
                <div v-for="(h, i) in bars" :key="i" class="flex-1 rounded-t-md animate-grow"
                  :class="i % 2 ? 'bg-primary-400/70' : 'bg-primary-500/80'"
                  :style="{ height: h + '%', animationDelay: (i * 0.04) + 's' }" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Stock split ────────────────────────────────────────────────────────── -->
    <section class="relative z-10 px-5 py-12">
      <div class="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
        <div class="lg:order-1">
          <div class="kicker">{{ t('landing.stockKicker') }}</div>
          <h2 class="text-[24px] sm:text-[30px] font-bold text-[#1C1917] tracking-[-1px] leading-[1.25] mt-2">
            {{ t('landing.stockTitle') }}
          </h2>
          <p class="mt-4 text-[14px] leading-relaxed text-[#57534E]">{{ t('landing.stockLead') }}</p>
          <div class="mt-5 space-y-2.5">
            <div v-for="tick in stockTicks" :key="tick" class="flex items-start gap-2.5 text-[13.5px] text-[#44403C]">
              <svg class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
              {{ tick }}
            </div>
          </div>
        </div>
        <div class="lg:order-2 glass-card rounded-[22px] p-6">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-[#79716B]">{{ t('landing.stockPanel') }}</div>
          <div class="mt-3 space-y-2">
            <div v-for="p in stockRows" :key="p.no" class="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/60 ring-1 ring-black/[0.04]">
              <div class="w-8 h-8 rounded-lg grid place-items-center text-[11px] font-bold flex-shrink-0 text-[#9A3412] bg-[#FFE3D6]">
                {{ p.no }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-[12px] font-semibold text-[#1C1917]">{{ p.name }}</div>
                <div class="text-[10.5px] text-[#79716B]">{{ p.meta }}</div>
              </div>
              <span class="pill" :class="p.pillClass">{{ t(p.labelKey) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Steps ──────────────────────────────────────────────────────────────── -->
    <section class="relative z-10 px-5 py-12">
      <div class="max-w-5xl mx-auto text-center">
        <div class="kicker">{{ t('landing.stepsKicker') }}</div>
        <h2 class="text-[24px] sm:text-[30px] font-bold text-[#1C1917] tracking-[-1px] leading-[1.25] mt-2">
          {{ t('landing.stepsTitle') }}
        </h2>
        <div class="grid sm:grid-cols-3 gap-4 mt-8 text-left">
          <div v-for="(s, i) in steps" :key="s.title" class="glass-card glass-hover rounded-2xl p-6">
            <div class="w-8 h-8 rounded-xl bg-primary-500 text-white grid place-items-center text-[13px] font-bold shadow-sm mb-4">{{ i + 1 }}</div>
            <h3 class="text-[14.5px] font-bold text-[#1C1917] mb-1.5">{{ s.title }}</h3>
            <p class="text-[12.5px] leading-relaxed text-[#57534E]">{{ s.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Team / roles ───────────────────────────────────────────────────────── -->
    <section class="relative z-10 px-5 py-12">
      <div class="max-w-5xl mx-auto grid lg:grid-cols-2 gap-10 items-center">
        <div class="glass-card rounded-[22px] p-6">
          <div class="text-[10px] font-bold tracking-[0.14em] uppercase text-[#79716B]">{{ t('landing.teamPanel') }}</div>
          <div class="mt-4 space-y-2.5">
            <div v-for="r in roles" :key="r.title" class="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 ring-1 ring-black/[0.05]">
              <span class="w-2.5 h-2.5 rounded-sm flex-shrink-0" :style="{ background: r.color }" />
              <div class="min-w-0">
                <div class="text-[13px] font-semibold text-[#1C1917]">{{ r.title }}</div>
                <div class="text-[11px] text-[#79716B]">{{ r.desc }}</div>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div class="kicker">{{ t('landing.teamKicker') }}</div>
          <h2 class="text-[24px] sm:text-[30px] font-bold text-[#1C1917] tracking-[-1px] leading-[1.25] mt-2">
            {{ t('landing.teamTitle') }}
          </h2>
          <p class="mt-4 text-[14px] leading-relaxed text-[#57534E]">{{ t('landing.teamLead') }}</p>
          <div class="mt-5 space-y-2.5">
            <div v-for="tick in teamTicks" :key="tick" class="flex items-start gap-2.5 text-[13.5px] text-[#44403C]">
              <svg class="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
              {{ tick }}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Trust cards ────────────────────────────────────────────────────────── -->
    <section class="relative z-10 px-5 py-12">
      <div class="max-w-5xl mx-auto grid sm:grid-cols-3 gap-4">
        <div class="glass-card glass-hover rounded-2xl px-5 py-5">
          <div class="w-9 h-9 rounded-xl grid place-items-center mb-3" style="background: rgba(16,185,129,0.10); border: 1px solid rgba(16,185,129,0.25);">
            <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <h3 class="text-[14px] font-semibold text-[#1C1917] mb-1">{{ t('landing.trustCard1Title') }}</h3>
          <p class="text-[12.5px] leading-relaxed text-[#57534E]">{{ t('landing.trustCard1Desc') }}</p>
        </div>
        <div class="glass-card glass-hover rounded-2xl px-5 py-5">
          <div class="w-9 h-9 rounded-xl grid place-items-center mb-3" style="background: rgba(232,99,47,0.10); border: 1px solid rgba(232,99,47,0.25);">
            <svg class="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </div>
          <h3 class="text-[14px] font-semibold text-[#1C1917] mb-1">{{ t('landing.trustCard2Title') }}</h3>
          <p class="text-[12.5px] leading-relaxed text-[#57534E]">{{ t('landing.trustCard2Desc') }}</p>
        </div>
        <div class="glass-card glass-hover rounded-2xl px-5 py-5">
          <div class="w-9 h-9 rounded-xl grid place-items-center mb-3" style="background: rgba(139,92,246,0.10); border: 1px solid rgba(139,92,246,0.25);">
            <svg class="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          </div>
          <h3 class="text-[14px] font-semibold text-[#1C1917] mb-1">{{ t('landing.trustCard3Title') }}</h3>
          <p class="text-[12.5px] leading-relaxed text-[#57534E]">{{ t('landing.trustCard3Desc') }}</p>
        </div>
      </div>
    </section>

    <!-- ── CTA band ───────────────────────────────────────────────────────────── -->
    <section class="relative z-10 px-5 pb-4 pt-6">
      <div class="max-w-5xl mx-auto band rounded-[26px] px-8 sm:px-12 py-14 text-center">
        <div class="relative">
          <h2 class="text-[26px] sm:text-[34px] font-bold text-white tracking-[-1px]">{{ t('landing.ctaTitle') }}</h2>
          <p class="mt-3.5 text-[14.5px] text-white/85 max-w-[520px] mx-auto leading-relaxed">{{ t('landing.ctaSub') }}</p>
          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button @click="$router.push('/login')"
              class="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 text-[14px] font-semibold text-white rounded-xl
                     bg-[#06C755] hover:bg-[#05B04B] shadow-[0_4px_14px_rgba(0,0,0,0.18)] transition-all duration-150 hover:-translate-y-0.5">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2.5H6C3.24 2.5 1 4.74 1 7.5v6.53c0 2.76 2.24 5 5 5h5.5l5.5 3.5v-3.5H18c2.76 0 5-2.24 5-5V7.5c0-2.76-2.24-5-5-5z" />
              </svg>
              {{ t('landing.ctaLine') }}
            </button>
            <RouterLink to="/register"
              class="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-[14px] font-semibold text-[#1C1917] rounded-xl bg-white hover:-translate-y-0.5 transition-all">
              {{ t('landing.ctaRegister') }}
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Footer ─────────────────────────────────────────────────────────────── -->
    <footer class="relative z-10 px-6 sm:px-10 py-6 border-t border-black/[0.06]">
      <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-[#79716B]">
        <span>© {{ new Date().getFullYear() }} {{ brand.name }} · {{ t('landing.tagline') }}</span>
        <span>{{ t('landing.footer') }}</span>
      </div>
    </footer>

  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import BrandMark from '@/components/BrandMark.vue'
import { brand } from '@/config/brand'

const { t } = useI18n()

const items = computed(() => [
  { title: t('landing.item1Title'), desc: t('landing.item1Desc') },
  { title: t('landing.item2Title'), desc: t('landing.item2Desc') },
  { title: t('landing.item3Title'), desc: t('landing.item3Desc') },
])

const trustRow = computed(() => [t('landing.trust1'), t('landing.trust2'), t('landing.trust3')])

const phoneOrders = computed(() => [
  { no: 241, amount: '฿180', status: t('landing.phonePaid'), statusColor: '#059669', delay: '0s' },
  { no: 240, amount: '฿65', status: t('landing.phoneCheck'), statusColor: '#D97706', delay: '.15s' },
  { no: 239, amount: '฿150', status: t('landing.phoneSent'), statusColor: '#57534E', delay: '.3s' },
])

const bars = [34, 56, 44, 72, 58, 88, 70, 96, 78]

const dashMetrics = computed(() => [
  { label: t('landing.dashM1'), value: '฿46,200', delta: '▲ 9%', up: true },
  { label: t('landing.dashM2'), value: '24', delta: '▲ 18%', up: true },
  { label: t('landing.dashM3'), value: '132', delta: '▲ 6%', up: true },
  { label: t('landing.dashM4'), value: '38', delta: t('landing.dashM4Note'), up: false },
])

const dashTicks = computed(() => [t('landing.dashT1'), t('landing.dashT2'), t('landing.dashT3')])
const stockTicks = computed(() => [t('landing.stockT1'), t('landing.stockT2'), t('landing.stockT3')])
const teamTicks = computed(() => [t('landing.teamT1'), t('landing.teamT2'), t('landing.teamT3')])

const stockRows = computed(() => [
  { no: 21, name: t('landing.item1Title'), meta: '฿90 · 38', pillClass: 'pill-ok', labelKey: 'landing.stockOk' },
  { no: 22, name: t('landing.item2Title'), meta: '฿65 · 12', pillClass: 'pill-ok', labelKey: 'landing.stockOk' },
  { no: 23, name: t('landing.item3Title'), meta: '฿150 · 2', pillClass: 'pill-low', labelKey: 'landing.stockLow' },
  { no: 24, name: t('landing.phoneShop'), meta: '฿35 · 0', pillClass: 'pill-out', labelKey: 'landing.stockOut' },
])

const roles = computed(() => [
  { color: '#7C3AED', title: t('landing.roleOwner'), desc: t('landing.roleOwnerDesc') },
  { color: '#2563EB', title: t('landing.roleManager'), desc: t('landing.roleManagerDesc') },
  { color: '#EA580C', title: t('landing.roleSales'), desc: t('landing.roleSalesDesc') },
  { color: '#B45309', title: t('landing.roleWarehouse'), desc: t('landing.roleWarehouseDesc') },
])

const steps = computed(() => [
  { title: t('landing.step1Title'), desc: t('landing.step1Desc') },
  { title: t('landing.step2Title'), desc: t('landing.step2Desc') },
  { title: t('landing.step3Title'), desc: t('landing.step3Desc') },
])
</script>

<style scoped>
.landing {
  font-family: 'Anuphan', 'Outfit', ui-sans-serif, system-ui, -apple-system, sans-serif;
}

.glass-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 8px 24px rgba(28, 25, 23, 0.06);
}

.glass-nav {
  background: rgba(255, 255, 255, 0.66);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  box-shadow: 0 8px 24px rgba(28, 25, 23, 0.07);
}

.glass-chip {
  position: absolute;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 10px 24px rgba(28, 25, 23, 0.1);
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.glass-hover {
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s;
}
.glass-hover:hover {
  transform: translateY(-3px);
  box-shadow: 0 14px 32px rgba(28, 25, 23, 0.1);
}

.panel-dark {
  background: linear-gradient(160deg, #221c15, #14100b 70%);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 44px rgba(28, 25, 23, 0.22);
}
.panel-dark::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 70% 55% at 85% 0%, rgba(232, 99, 47, 0.2), transparent 60%);
}

.kicker {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #ea580c;
}

.pill {
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  flex-shrink: 0;
}
.pill-ok {
  color: #047857;
  background: rgba(5, 150, 105, 0.1);
}
.pill-low {
  color: #b45309;
  background: rgba(217, 119, 6, 0.12);
}
.pill-out {
  color: #64748b;
  background: rgba(100, 116, 139, 0.12);
}

.band {
  background: linear-gradient(140deg, #e8632f 0%, #c24a1e 55%, #9a3a14 100%);
  box-shadow: 0 18px 44px rgba(28, 25, 23, 0.18);
}
.band::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 60% 80% at 15% 10%, rgba(255, 255, 255, 0.14), transparent 55%);
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.animate-float {
  animation: float 5s ease-in-out infinite;
}

@keyframes grow {
  from { transform: scaleY(0); }
}
.animate-grow {
  transform-origin: bottom;
  animation: grow 0.8s cubic-bezier(0.25, 1, 0.5, 1) backwards;
}

@keyframes orderIn {
  from { opacity: 0; transform: translateY(6px); }
}
.animate-order {
  animation: orderIn 0.5s cubic-bezier(0.25, 1, 0.5, 1) backwards;
}
</style>
