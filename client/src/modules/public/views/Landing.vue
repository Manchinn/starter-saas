<template>
  <div class="landing">
    <nav class="nav">
      <RouterLink to="/" class="brand">
        <BrandMark :show-name="true" gap-class="gap-2.5" mark-class="w-8 h-8" name-class="text-[17px] font-bold tracking-tight text-[#1C1917]" />
      </RouterLink>
      <div class="nav-links">
        <RouterLink to="/login" class="btn-login">{{ t('landing.ctaLogin') }}</RouterLink>
        <RouterLink to="/register" class="btn-register">{{ t('landing.ctaRegister') }}</RouterLink>
      </div>
    </nav>

    <!-- HERO -->
    <section class="hero">
      <span class="badge"><span class="badge-dot" />{{ t('landing.badge') }}</span>
      <h1 class="hero-title">{{ t('landing.heroTitle') }}</h1>
      <p class="hero-sub">{{ t('landing.heroSub') }}</p>
      <div class="hero-ctas">
        <button type="button" class="btn btn-line" @click="$router.push('/login')">
          <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 2.5H6C3.24 2.5 1 4.74 1 7.5v6.53c0 2.76 2.24 5 5 5h5.5l5.5 3.5v-3.5H18c2.76 0 5-2.24 5-5V7.5c0-2.76-2.24-5-5-5z" />
          </svg>
          {{ t('landing.ctaLine') }}
        </button>
        <RouterLink to="/register" class="btn btn-ghost">{{ t('landing.ctaRegister') }} →</RouterLink>
      </div>
      <ul class="trust-row">
        <li><CheckIcon /> {{ t('landing.trust1') }}</li>
        <li><CheckIcon /> {{ t('landing.trust2') }}</li>
        <li><CheckIcon /> {{ t('landing.trust3') }}</li>
      </ul>
    </section>

    <!-- TRUST STRIP -->
    <section class="strip-wrap">
      <div class="strip">
        <div class="strip-item"><CheckIcon /> {{ t('landing.stripTitle') }}</div>
        <div class="strip-item"><CheckIcon /> {{ t('landing.strip2') }}</div>
        <div class="strip-item"><CheckIcon /> {{ t('landing.strip3') }}</div>
        <div class="strip-item"><CheckIcon /> {{ t('landing.strip4') }}</div>
      </div>
    </section>

    <!-- WHAT -->
    <section class="what">
      <h2 class="section-title">{{ t('landing.whatTitle') }}</h2>
      <div class="cards-3">
        <div class="card card-hover">
          <div class="icon-tile icon-1">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8z" /></svg>
          </div>
          <h3>{{ t('landing.item1Title') }}</h3>
          <p>{{ t('landing.item1Desc') }}</p>
        </div>
        <div class="card card-hover">
          <div class="icon-tile icon-2">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
          </div>
          <h3>{{ t('landing.item2Title') }}</h3>
          <p>{{ t('landing.item2Desc') }}</p>
        </div>
        <div class="card card-hover">
          <div class="icon-tile icon-3">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M21 7v6h-6" /></svg>
          </div>
          <h3>{{ t('landing.item3Title') }}</h3>
          <p>{{ t('landing.item3Desc') }}</p>
        </div>
      </div>
    </section>

    <!-- DASHBOARD SPLIT -->
    <section class="split-section">
      <div class="split">
        <div class="split-text">
          <p class="kicker">{{ t('landing.dashKicker') }}</p>
          <h3 class="split-title">{{ t('landing.dashTitle') }}</h3>
          <p class="split-lead">{{ t('landing.dashLead') }}</p>
          <ul class="ticks">
            <li><CheckIcon /> {{ t('landing.dashT1') }}</li>
            <li><CheckIcon /> {{ t('landing.dashT2') }}</li>
            <li><CheckIcon /> {{ t('landing.dashT3') }}</li>
          </ul>
        </div>
        <div class="dash-panel">
          <p class="panel-label">{{ t('landing.dashPanel') }}</p>
          <div class="dash-grid">
            <div class="dstat"><small>{{ t('landing.dashM1') }}</small><b>฿46,200</b><span class="up">▲ 9%</span></div>
            <div class="dstat"><small>{{ t('landing.dashM2') }}</small><b>24</b><span class="up">▲ 18%</span></div>
            <div class="dstat"><small>{{ t('landing.dashM3') }}</small><b>132</b><span class="up">▲ 6%</span></div>
            <div class="dstat"><small>{{ t('landing.dashM4') }}</small><b>38</b><span class="low">{{ t('landing.dashM4Note') }}</span></div>
          </div>
          <div class="dash-chart">
            <div class="bars">
              <i style="height:34%" /><i style="height:56%" /><i style="height:44%" /><i style="height:72%" />
              <i style="height:58%" /><i style="height:88%" /><i style="height:70%" /><i style="height:96%" /><i style="height:78%" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- STOCK SPLIT -->
    <section class="split-section">
      <div class="split split-rev">
        <div class="split-text">
          <p class="kicker">{{ t('landing.stockKicker') }}</p>
          <h3 class="split-title">{{ t('landing.stockTitle') }}</h3>
          <p class="split-lead">{{ t('landing.stockLead') }}</p>
          <ul class="ticks">
            <li><CheckIcon /> {{ t('landing.stockT1') }}</li>
            <li><CheckIcon /> {{ t('landing.stockT2') }}</li>
            <li><CheckIcon /> {{ t('landing.stockT3') }}</li>
          </ul>
        </div>
        <div class="stock-panel">
          <p class="panel-label">{{ t('landing.stockPanel') }}</p>
          <div class="stock-rows">
            <div class="stock-row" v-for="row in stockRows" :key="row.initials">
              <div class="stock-thumb" :style="{ background: row.bg, color: row.fg }">{{ row.initials }}</div>
              <div class="stock-info"><b>{{ row.name }}</b><small>{{ row.meta }}</small></div>
              <span class="pill" :class="row.tone">{{ t(row.label) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- STEPS -->
    <section class="what">
      <p class="kicker center">{{ t('landing.stepsKicker') }}</p>
      <h2 class="section-title">{{ t('landing.stepsTitle') }}</h2>
      <div class="cards-3">
        <div class="card card-hover">
          <div class="step-num">1</div>
          <h3>{{ t('landing.step1Title') }}</h3>
          <p>{{ t('landing.step1Desc') }}</p>
        </div>
        <div class="card card-hover">
          <div class="step-num">2</div>
          <h3>{{ t('landing.step2Title') }}</h3>
          <p>{{ t('landing.step2Desc') }}</p>
        </div>
        <div class="card card-hover">
          <div class="step-num">3</div>
          <h3>{{ t('landing.step3Title') }}</h3>
          <p>{{ t('landing.step3Desc') }}</p>
        </div>
      </div>
    </section>

    <!-- TEAM SPLIT -->
    <section class="split-section">
      <div class="split">
        <div class="roles-panel">
          <p class="panel-label">{{ t('landing.teamPanel') }}</p>
          <div class="role-row">
            <span class="role-dot" style="background:#7C3AED" />
            <div><b>{{ t('landing.roleOwner') }}</b><small>{{ t('landing.roleOwnerDesc') }}</small></div>
          </div>
          <div class="role-row">
            <span class="role-dot" style="background:#2563EB" />
            <div><b>{{ t('landing.roleManager') }}</b><small>{{ t('landing.roleManagerDesc') }}</small></div>
          </div>
          <div class="role-row">
            <span class="role-dot" style="background:#EA580C" />
            <div><b>{{ t('landing.roleSales') }}</b><small>{{ t('landing.roleSalesDesc') }}</small></div>
          </div>
          <div class="role-row">
            <span class="role-dot" style="background:#B45309" />
            <div><b>{{ t('landing.roleWarehouse') }}</b><small>{{ t('landing.roleWarehouseDesc') }}</small></div>
          </div>
        </div>
        <div class="split-text">
          <p class="kicker">{{ t('landing.teamKicker') }}</p>
          <h3 class="split-title">{{ t('landing.teamTitle') }}</h3>
          <p class="split-lead">{{ t('landing.teamLead') }}</p>
          <ul class="ticks">
            <li><CheckIcon /> {{ t('landing.teamT1') }}</li>
            <li><CheckIcon /> {{ t('landing.teamT2') }}</li>
            <li><CheckIcon /> {{ t('landing.teamT3') }}</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- TRUST CARDS -->
    <section class="what">
      <div class="cards-3">
        <div class="card card-hover">
          <div class="icon-tile icon-2">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          </div>
          <h3>{{ t('landing.trustCard1Title') }}</h3>
          <p>{{ t('landing.trustCard1Desc') }}</p>
        </div>
        <div class="card card-hover">
          <div class="icon-tile icon-1">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          </div>
          <h3>{{ t('landing.trustCard2Title') }}</h3>
          <p>{{ t('landing.trustCard2Desc') }}</p>
        </div>
        <div class="card card-hover">
          <div class="icon-tile icon-3">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
          </div>
          <h3>{{ t('landing.trustCard3Title') }}</h3>
          <p>{{ t('landing.trustCard3Desc') }}</p>
        </div>
      </div>
    </section>

    <!-- CTA BAND -->
    <section class="cta-wrap">
      <div class="cta-band">
        <h2>{{ t('landing.ctaTitle') }}</h2>
        <p>{{ t('landing.ctaSub') }}</p>
        <div class="hero-ctas">
          <button type="button" class="btn btn-line" @click="$router.push('/login')">
            <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 2.5H6C3.24 2.5 1 4.74 1 7.5v6.53c0 2.76 2.24 5 5 5h5.5l5.5 3.5v-3.5H18c2.76 0 5-2.24 5-5V7.5c0-2.76-2.24-5-5-5z" />
            </svg>
            {{ t('landing.ctaLine') }}
          </button>
          <RouterLink to="/register" class="btn btn-white">{{ t('landing.ctaRegister') }} →</RouterLink>
        </div>
      </div>
    </section>

    <footer class="foot">
      <span>© {{ year }} {{ brand.name }} · {{ t('landing.tagline') }}</span>
    </footer>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import BrandMark from '@/components/BrandMark.vue'
import { brand } from '@/config/brand'

const { t } = useI18n()
const year = new Date().getFullYear()

// CheckIcon as a functional component keeps the template tidy
const CheckIcon = () =>
  h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.5, 'aria-hidden': 'true' }, [
    h('path', { d: 'M5 13l4 4L19 7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ])

// demo data for the stock panel (labels resolved through i18n)
const stockRows = computed(() => [
  { initials: 'กข', bg: 'rgba(232,99,47,.12)', fg: '#C24A1E', name: t('landing.phoneShop'), meta: '฿90', tone: 'ok', label: 'landing.stockOk' },
  { initials: 'คง', bg: 'rgba(124,58,237,.10)', fg: '#7C3AED', name: t('landing.phoneOrder'), meta: '฿65', tone: 'ok', label: 'landing.stockOk' },
  { initials: 'ชว', bg: 'rgba(251,191,36,.14)', fg: '#B45309', name: t('landing.phoneCheck'), meta: '฿150', tone: 'warn', label: 'landing.stockLow' },
  { initials: 'ชย', bg: 'rgba(120,113,108,.12)', fg: '#78716C', name: t('landing.phoneSent'), meta: '฿35', tone: 'off', label: 'landing.stockOut' },
])
</script>

<style scoped>
.landing {
  font-family: 'Anuphan', -apple-system, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  color: #1C1917;
  background:
    radial-gradient(ellipse 60% 40% at 50% 0%, #FDE7CE 0%, transparent 62%),
    radial-gradient(ellipse 45% 32% at 88% 82%, #FBE0C6 0%, transparent 58%),
    #FBF5EC;
  min-height: 100vh;
  overflow-x: hidden;
}

/* nav */
.nav { max-width: 1080px; margin: 0 auto; padding: 14px 20px 0; display: flex; align-items: center; justify-content: space-between; }
.brand { display: flex; align-items: center; gap: 10px; }
.nav-links { display: flex; align-items: center; gap: 8px; }
.btn-login { padding: 9px 14px; font-size: 13.5px; color: #57534E; border-radius: 10px; transition: color 0.15s; }
.btn-login:hover { color: #1C1917; }
.btn-register {
  padding: 9px 18px; font-size: 13.5px; font-weight: 600; color: #fff; border-radius: 11px;
  background: linear-gradient(135deg, #F97A3D, #E8632F);
  box-shadow: 0 3px 12px rgba(28, 25, 23, 0.18);
  transition: transform 0.15s;
}
.btn-register:hover { transform: translateY(-1px); }

/* hero */
.hero { max-width: 780px; margin: 0 auto; text-align: center; padding: 64px 20px 30px; }
.badge {
  display: inline-flex; align-items: center; gap: 8px; padding: 7px 16px; border-radius: 999px;
  font-size: 11.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase;
  color: #C24A1E; background: rgba(232, 99, 47, 0.10); border: 1px solid rgba(232, 99, 47, 0.28);
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #E8632F; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
.hero-title { margin-top: 22px; font-size: clamp(36px, 5.6vw, 54px); font-weight: 700; line-height: 1.16; letter-spacing: -1.2px; }
.hero-sub { margin: 16px auto 0; max-width: 580px; font-size: 15.5px; line-height: 1.8; color: #57534E; }
.hero-ctas { margin-top: 30px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.trust-row { margin-top: 20px; display: flex; gap: 18px; justify-content: center; flex-wrap: wrap; list-style: none; }
.trust-row li { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #78716C; }
.trust-row svg { color: #16A34A; }

/* buttons */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 14px 26px; border-radius: 13px; font-size: 14.5px; font-weight: 600; cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.15s, background 0.15s;
}
.btn:active { transform: scale(0.98); }
.btn-line { background: #06C755; color: #fff; border: none; box-shadow: 0 4px 14px rgba(28, 25, 23, 0.16); }
.btn-line:hover { background: #05B04B; transform: translateY(-2px); }
.btn-ghost {
  color: #292524; background: rgba(255, 255, 255, 0.66);
  border: 1px solid rgba(28, 25, 23, 0.10); backdrop-filter: blur(12px);
  box-shadow: 0 2px 10px rgba(28, 25, 23, 0.06);
}
.btn-ghost:hover { background: rgba(255, 255, 255, 0.85); transform: translateY(-2px); }
.btn-white { background: #fff; color: #1C1917; }
.btn-white:hover { transform: translateY(-2px); }

/* trust strip */
.strip-wrap { max-width: 1080px; margin: 0 auto; padding: 0 20px; }
.strip {
  display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;
  padding: 15px 22px; border-radius: 18px;
  background: rgba(255, 255, 255, 0.55); border: 1px solid rgba(28, 25, 23, 0.07);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 26px rgba(28, 25, 23, 0.05);
}
.strip-item { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: #44403C; }
.strip-item :deep(svg) { color: #16A34A; flex-shrink: 0; }

/* sections */
.what { max-width: 1080px; margin: 0 auto; padding: 52px 20px 0; }
.section-title { font-size: clamp(24px, 3.2vw, 32px); font-weight: 700; letter-spacing: -0.8px; line-height: 1.22; text-align: center; }
.kicker { font-size: 11.5px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: #E8632F; margin-bottom: 12px; }
.kicker.center { text-align: center; }
.center { text-align: center; }

/* cards */
.cards-3 { margin-top: 22px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.card {
  padding: 22px; border-radius: 20px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.82), rgba(255, 255, 255, 0.55));
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(28, 25, 23, 0.06);
  transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.2s;
}
.card-hover:hover { transform: translateY(-3px); box-shadow: 0 14px 36px rgba(28, 25, 23, 0.09); }
.card h3 { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
.card p { font-size: 13px; color: #57534E; line-height: 1.7; }
.icon-tile { width: 38px; height: 38px; border-radius: 12px; display: grid; place-items: center; margin-bottom: 14px; }
.icon-tile svg { width: 18px; height: 18px; }
.icon-1 { color: #E8632F; background: rgba(232, 99, 47, 0.12); border: 1px solid rgba(232, 99, 47, 0.22); }
.icon-2 { color: #059669; background: rgba(6, 199, 85, 0.10); border: 1px solid rgba(6, 199, 85, 0.22); }
.icon-3 { color: #7C3AED; background: rgba(124, 58, 237, 0.10); border: 1px solid rgba(124, 58, 237, 0.20); }
.step-num {
  width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 14px;
  font-size: 13px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #F97A3D, #E8632F);
  box-shadow: 0 3px 10px rgba(28, 25, 23, 0.14);
}

/* splits */
.split-section { max-width: 1080px; margin: 0 auto; padding: 52px 20px 0; }
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 44px; align-items: center; }
.split-rev .split-text { order: 2; }
.split-title { font-size: clamp(21px, 2.6vw, 27px); font-weight: 700; letter-spacing: -0.7px; line-height: 1.3; }
.split-lead { margin-top: 13px; font-size: 14px; line-height: 1.8; color: #57534E; }
.ticks { margin-top: 18px; display: grid; gap: 10px; list-style: none; }
.ticks li { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; color: #44403C; line-height: 1.65; }
.ticks :deep(svg) { width: 16px; height: 16px; color: #16A34A; flex-shrink: 0; margin-top: 2px; }
.trust-row :deep(svg) { width: 14px; height: 14px; }

/* dashboard panel */
.dash-panel {
  border-radius: 22px; padding: 22px; color: #F5F5F4; position: relative; overflow: hidden;
  background: linear-gradient(160deg, #1C1712, #12100C 70%);
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: 0 16px 44px rgba(28, 25, 23, 0.28);
}
.dash-panel::after {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 70% 55% at 85% 0%, rgba(232, 99, 47, 0.20), transparent 60%);
}
.panel-label { font-size: 11px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: rgba(245, 245, 244, 0.45); margin-bottom: 14px; position: relative; }
.dash-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; position: relative; }
.dstat { padding: 14px; border-radius: 14px; background: rgba(255, 255, 255, 0.055); border: 1px solid rgba(255, 255, 255, 0.09); }
.dstat small { font-size: 10px; color: rgba(245, 245, 244, 0.45); }
.dstat b { display: block; margin-top: 4px; font-size: 20px; font-weight: 700; }
.dstat .up { font-size: 10.5px; font-weight: 600; color: #34D399; }
.dstat .low { display: block; font-size: 10.5px; font-weight: 600; color: #FBBF24; margin-top: 2px; }
.dash-chart { margin-top: 12px; padding: 14px; border-radius: 14px; background: rgba(255, 255, 255, 0.055); border: 1px solid rgba(255, 255, 255, 0.09); position: relative; }
.bars { display: flex; align-items: flex-end; gap: 9px; height: 84px; }
.bars i { flex: 1; border-radius: 7px 7px 3px 3px; background: linear-gradient(180deg, rgba(255, 138, 76, 0.85), rgba(232, 99, 47, 0.18)); transform-origin: bottom; animation: grow 0.9s cubic-bezier(0.25, 1, 0.5, 1) backwards; }
.bars i:nth-child(2n) { background: linear-gradient(180deg, rgba(167, 139, 250, 0.8), rgba(139, 92, 246, 0.15)); }
.bars i:nth-child(4), .bars i:nth-child(6), .bars i:nth-child(8) { animation-delay: 0.08s; }
@keyframes grow { from { transform: scaleY(0); } }

/* stock panel */
.stock-panel {
  border-radius: 22px; padding: 22px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.6));
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 44px rgba(28, 25, 23, 0.10);
}
.stock-panel .panel-label { color: #A8A29E; }
.stock-rows { display: grid; gap: 10px; }
.stock-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 13px; background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(28, 25, 23, 0.06); }
.stock-thumb { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.stock-info b { font-size: 13px; display: block; }
.stock-info small { font-size: 11px; color: #78716C; }
.pill { margin-left: auto; font-size: 9.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
.pill.ok { color: #16A34A; background: rgba(22, 163, 74, 0.10); }
.pill.warn { color: #C24A1E; background: rgba(232, 99, 47, 0.12); }
.pill.off { color: #78716C; background: rgba(120, 113, 108, 0.12); }

/* roles panel */
.roles-panel {
  border-radius: 22px; padding: 22px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.6));
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 16px 44px rgba(28, 25, 23, 0.10);
  display: grid; gap: 10px; align-content: center;
}
.roles-panel .panel-label { color: #A8A29E; margin-bottom: 4px; }
.role-row { display: flex; align-items: center; gap: 11px; padding: 12px 14px; border-radius: 13px; background: rgba(255, 255, 255, 0.7); border: 1px solid rgba(28, 25, 23, 0.06); }
.role-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.role-row b { font-size: 13px; display: block; }
.role-row small { display: block; font-size: 10.5px; color: #78716C; margin-top: 1px; }

/* CTA band */
.cta-wrap { max-width: 1080px; margin: 0 auto; padding: 52px 20px 0; }
.cta-band {
  border-radius: 26px; padding: 50px 40px; text-align: center; color: #fff; position: relative; overflow: hidden;
  background: linear-gradient(140deg, #E8632F 0%, #C24A1E 55%, #9A3A14 100%);
  box-shadow: 0 18px 44px rgba(28, 25, 23, 0.22);
}
.cta-band::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 80% at 15% 10%, rgba(255, 255, 255, 0.16), transparent 55%);
}
.cta-band h2 { position: relative; font-size: clamp(24px, 3.4vw, 34px); font-weight: 700; letter-spacing: -0.9px; }
.cta-band p { position: relative; margin: 14px auto 0; max-width: 520px; font-size: 14.5px; line-height: 1.75; color: rgba(255, 255, 255, 0.85); }
.cta-band .hero-ctas { position: relative; margin-top: 28px; }

/* footer */
.foot { border-top: 1px solid rgba(28, 25, 23, 0.07); margin-top: 56px; padding: 22px; text-align: center; font-size: 12px; color: #78716C; }

/* responsive */
@media (max-width: 900px) {
  .cards-3 { grid-template-columns: 1fr; }
  .split { grid-template-columns: 1fr; gap: 26px; }
  .split-rev .split-text { order: 0; }
  .cta-band { padding: 44px 24px; }
  .strip { flex-direction: column; align-items: flex-start; }
}
</style>
