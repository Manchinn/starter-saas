<template>
  <div class="landing">
    <div class="bg"><div class="base" /></div>

    <div class="wrap">
      <nav class="nav">
        <RouterLink to="/" class="brand">
          <BrandMark :show-name="true" gap-class="gap-2.5" mark-class="w-8 h-8" name-class="text-[17px] font-bold tracking-tight" />
        </RouterLink>
        <div class="nav-links">
          <RouterLink to="/login" class="btn-login">{{ t('landing.ctaLogin') }}</RouterLink>
          <RouterLink to="/register" class="btn-register">{{ t('landing.ctaRegister') }}</RouterLink>
        </div>
      </nav>

      <!-- HERO -->
      <section class="hero">
        <span class="badge"><span class="badge-dot" />{{ t('landing.badge') }}</span>
        <h1 class="hero-title" v-html="heroTitleHtml" />
        <p class="hero-sub">{{ t('landing.heroSub') }}</p>
        <div class="hero-ctas">
          <button type="button" class="btn btn-line" @click="$router.push('/login')">
            <svg width="17" height="17" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 2.5H6C3.24 2.5 1 4.74 1 7.5v6.53c0 2.76 2.24 5 5 5h5.5l5.5 3.5v-3.5H18c2.76 0 5-2.24 5-5V7.5c0-2.76-2.24-5-5-5z" />
            </svg>
            {{ t('landing.ctaLine') }}
          </button>
          <RouterLink to="/register" class="btn btn-glass">{{ t('landing.ctaRegister') }} →</RouterLink>
        </div>
      </section>

      <!-- BENTO -->
      <section class="bento" aria-label="product highlights">
        <div class="cell c-hero">
          <div class="shine" />
          <h2>
            <span class="o">{{ t('landing.bentoHeroChat') }}</span><br />
            {{ t('landing.bentoHeroOrder') }}
          </h2>
          <p>{{ t('landing.bentoHeroDesc') }}</p>
        </div>

        <div class="cell c-chat">
          <small class="lbl">{{ t('landing.chatLabel') }}</small>
          <div class="msgs">
            <div class="msg msg-in">{{ t('landing.chatIn') }}</div>
            <div class="msg msg-out">{{ t('landing.chatOut') }}</div>
            <div class="typing"><i /><i /><i /></div>
          </div>
        </div>

        <div class="cell c-chart">
          <small class="lbl">{{ t('landing.chartLabel') }}</small>
          <div class="statline"><b>฿46,200</b><span class="up">▲ 18%</span></div>
          <div class="bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
        </div>

        <div class="cell c-stat">
          <b class="big">132</b>
          <div class="lbl2">{{ t('landing.statCustomers') }}</div>
          <div class="mini"><i style="width:30%" /><i style="width:22%" /><i style="width:26%" /><i style="width:22%" /></div>
        </div>

        <div class="cell c-entry">
          <small class="lbl">{{ t('landing.entryLabel') }}</small>
          <div class="oa">
            <div class="avatar">M</div>
            <div class="skwrap"><div class="sk w60" /><div class="sk w85" /></div>
          </div>
          <div class="oapill">{{ t('landing.entryPill') }}</div>
        </div>
      </section>

      <!-- FEATURES -->
      <section class="feats-sec">
        <div class="feats">
          <div class="feat">
            <div class="fi fi-1">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" /></svg>
            </div>
            <div><h3>{{ t('landing.item1Title') }}</h3><p>{{ t('landing.item1Desc') }}</p></div>
          </div>
          <div class="feat">
            <div class="fi fi-2">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" /></svg>
            </div>
            <div><h3>{{ t('landing.item2Title') }}</h3><p>{{ t('landing.item2Desc') }}</p></div>
          </div>
          <div class="feat">
            <div class="fi fi-3">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 17l6-6 4 4 8-8M21 7v6h-6" /></svg>
            </div>
            <div><h3>{{ t('landing.item3Title') }}</h3><p>{{ t('landing.item3Desc') }}</p></div>
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
          <div class="panel-dark">
            <p class="panel-label">{{ t('landing.dashPanel') }}</p>
            <div class="dash-grid">
              <div class="dstat"><small>{{ t('landing.dashM1') }}</small><b>฿46,200</b><span class="up">▲ 9%</span></div>
              <div class="dstat"><small>{{ t('landing.dashM2') }}</small><b>24</b><span class="up">▲ 18%</span></div>
              <div class="dstat"><small>{{ t('landing.dashM3') }}</small><b>132</b><span class="up">▲ 6%</span></div>
              <div class="dstat"><small>{{ t('landing.dashM4') }}</small><b>38</b><span class="low">{{ t('landing.dashM4Note') }}</span></div>
              <div class="dbars"><div class="bars"><i /><i /><i /><i /><i /><i /><i /><i /></div></div>
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
          <div class="split-lead">{{ t('landing.stockLead') }}</div>
          <ul class="ticks">
            <li><CheckIcon /> {{ t('landing.stockT1') }}</li>
            <li><CheckIcon /> {{ t('landing.stockT2') }}</li>
            <li><CheckIcon /> {{ t('landing.stockT3') }}</li>
          </ul>
        </div>
        <div class="stockpanel">
          <p class="panel-label">{{ t('landing.stockPanel') }}</p>
          <div class="rows">
            <div class="row-i" v-for="row in stockRows" :key="row.initials">
              <div class="thumb" :style="{ background: row.bg, color: row.fg }">{{ row.initials }}</div>
              <div class="info"><b>{{ row.name }}</b><small>{{ row.meta }}</small></div>
              <div class="end"><span class="pill2" :class="row.tone">{{ t(row.label) }}</span></div>
              </div>
          </div>
        </div>
      </div>
    </section>

    <!-- STEPS -->
    <section class="steps-sec">
      <p class="kicker center">{{ t('landing.stepsKicker') }}</p>
      <div class="h2">{{ t('landing.stepsTitle') }}</div>
      <div class="steps">
        <div class="step">
          <div class="n">1</div>
          <h3>{{ t('landing.step1Title') }}</h3>
          <p>{{ t('landing.step1Desc') }}</p>
        </div>
        <div class="step">
          <div class="n">2</div>
          <h3>{{ t('landing.step2Title') }}</h3>
          <p>{{ t('landing.step2Desc') }}</p>
        </div>
        <div class="step">
          <div class="n">3</div>
          <h3>{{ t('landing.step3Title') }}</h3>
          <p>{{ t('landing.step3Desc') }}</p>
        </div>
      </div>
    </section>

    <!-- TEAM -->
    <section class="split-section">
      <div class="sec">
        <div class="stockpanel">
          <p class="panel-label">{{ t('landing.teamPanel') }}</p>
          <div class="chiprole">
            <span class="c" style="background:#7C3AED" />
            <div><b>{{ t('landing.roleOwner') }}</b><small>{{ t('landing.roleOwnerDesc') }}</small></div>
          </div>
          <div class="chiprole">
            <span class="c" style="background:#2563EB" />
            <div><b>{{ t('landing.roleManager') }}</b><small>{{ t('landing.roleManagerDesc') }}</small></div>
          </div>
          <div class="chiprole">
            <span class="c" style="background:#EA580C" />
            <div><b>{{ t('landing.roleSales') }}</b><small>{{ t('landing.roleSalesDesc') }}</small></div>
          </div>
          <div class="chiprole">
            <span class="c" style="background:#B45309" />
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
    <section class="feats-sec">
      <div class="feats">
        <div class="feat">
          <div class="fi fi-2">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          </div>
          <div><h3>{{ t('landing.trustCard1Title') }}</h3><p>{{ t('landing.trustCard1Desc') }}</p></div>
        </div>
        <div class="feat">
          <div class="fi fi-1">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
          </div>
          <div><h3>{{ t('landing.trustCard2Title') }}</h3><p>{{ t('landing.trustCard2Desc') }}</p></div>
        </div>
        <div class="feat">
          <div class="fi fi-3">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>
          </div>
          <div><h3>{{ t('landing.trustCard3Title') }}</h3><p>{{ t('landing.trustCard3Desc') }}</p></div>
        </div>
      </div>
    </section>

    <!-- CTA BAND -->
    <section class="cta-wrap">
      <div class="band">
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

// hero title with gradient accent, built from i18n keys (no raw HTML interpolation)
const heroTitleHtml = computed(() => {
  const full = t('landing.heroTitle')
  const accent = t('landing.heroTitleAccent')
  const idx = full.indexOf(accent)
  if (idx === -1 || !accent) return escapeHtml(full)
  return (
    escapeHtml(full.slice(0, idx)) +
    `<span class="gtext">${escapeHtml(accent)}</span>` +
    escapeHtml(full.slice(idx + accent.length))
  )
})

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// CheckIcon as a functional component keeps the template tidy
const CheckIcon = () =>
  h('svg', { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2.5, 'aria-hidden': 'true' }, [
    h('path', { d: 'M5 13l4 4L19 7', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ])

// demo rows for the stock panel (labels resolved through i18n)
const stockRows = computed(() => [
  { initials: 'กข', bg: 'rgba(232,99,47,.14)', fg: '#FFB48A', name: t('landing.phoneShop'), meta: '฿90', tone: 'ok', label: 'landing.stockOk' },
  { initials: 'คง', bg: 'rgba(139,92,246,.14)', fg: '#C4B5FD', name: t('landing.phoneOrder'), meta: '฿65', tone: 'ok', label: 'landing.stockOk' },
  { initials: 'ชว', bg: 'rgba(251,191,36,.16)', fg: '#FCD34D', name: t('landing.phoneCheck'), meta: '฿150', tone: 'warn', label: 'landing.stockLow' },
  { initials: 'ชย', bg: 'rgba(124,139,161,.14)', fg: '#94A3B8', name: t('landing.phoneSent'), meta: '฿35', tone: 'off', label: 'landing.stockOut' },
])
</script>

<style scoped>
.landing {
  font-family: 'Anuphan', -apple-system, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  background: #05070D;
  color: #F1F5F9;
  min-height: 100vh;
  overflow-x: hidden;
}
.bg { position: fixed; inset: 0; pointer-events: none; z-index: 0; }
.base {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 60% 38% at 50% -6%, rgba(232, 99, 47, 0.16) 0%, transparent 60%),
    radial-gradient(ellipse 40% 30% at 88% 80%, rgba(139, 92, 246, 0.10) 0%, transparent 60%),
    #05070D;
}
.wrap { position: relative; z-index: 1; max-width: 1120px; margin: 0 auto; padding: 0 22px; }

/* glass */
.cell, .feat, .step, .stockpanel, .roles-panel {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.028));
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);
  border-radius: 24px;
  box-shadow: 0 10px 34px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.07);
}
.feat, .step, .stockpanel, .roles-panel { transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.2s, background 0.2s; }
.feat:hover, .step:hover, .stockpanel:hover, .roles-panel:hover { transform: translateY(-3px); border-color: rgba(255, 138, 76, 0.30); }

/* nav */
.nav {
  margin-top: 20px; display: flex; align-items: center; justify-content: space-between;
  padding: 11px 11px 11px 20px; border-radius: 18px;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.028));
  border: 1px solid rgba(255, 255, 255, 0.10);
  backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px);
}
.brand { display: flex; align-items: center; }
.brand :deep(img) { border-radius: 9px; }
.brand :deep(span) { color: #F1F5F9; }
.nav-links { display: flex; align-items: center; gap: 8px; }
.btn-login { padding: 9px 14px; font-size: 13px; color: #94A3B8; border-radius: 10px; transition: color 0.15s; }
.btn-login:hover { color: #fff; }
.btn-register {
  padding: 9px 18px; font-size: 13px; font-weight: 600; color: #fff; border-radius: 11px;
  background: linear-gradient(135deg, #F97A3D, #E8632F);
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.35);
  transition: transform 0.15s;
}
.btn-register:hover { transform: translateY(-1px); }

/* hero */
.hero { text-align: center; padding: 70px 10px 34px; max-width: 780px; margin: 0 auto; }
.badge {
  display: inline-flex; align-items: center; gap: 8px; padding: 7px 16px; border-radius: 999px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
  color: #FFB48A; background: rgba(232, 99, 47, 0.10); border: 1px solid rgba(232, 99, 47, 0.30);
}
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #FF8A4C; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
.hero-title { margin-top: 24px; font-size: clamp(38px, 5.8vw, 58px); font-weight: 700; line-height: 1.14; letter-spacing: -1.5px; }
.gtext {
  background: linear-gradient(100deg, #FFC9A3 0%, #FF8A4C 45%, #E8632F 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.hero-sub { margin: 18px auto 0; max-width: 580px; font-size: 15.5px; line-height: 1.78; color: #8FA0B8; }
.hero-ctas { margin-top: 32px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

/* buttons */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  padding: 14px 26px; border-radius: 13px; font-size: 14.5px; font-weight: 600; cursor: pointer;
  transition: transform 0.15s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 0.15s, background 0.15s;
}
.btn:active { transform: scale(0.98); }
.btn-line { background: #06C755; color: #fff; border: none; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.30); }
.btn-line:hover { background: #05B04B; transform: translateY(-2px); }
.btn-glass {
  color: #E7EDF5; background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.16); backdrop-filter: blur(16px);
}
.btn-glass:hover { background: rgba(255, 255, 255, 0.10); transform: translateY(-2px); }
.btn-white { background: #fff; color: #1C1917; border: none; }
.btn-white:hover { transform: translateY(-2px); }

/* bento */
.bento {
  margin-top: 26px; display: grid; gap: 14px;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 150px;
  grid-template-areas:
    'hero  hero  chat chart'
    'entry stat  chat chart';
}
.cell { padding: 20px; position: relative; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s cubic-bezier(0.25, 1, 0.5, 1), border-color 0.2s; }
.cell:hover { transform: translateY(-3px); border-color: rgba(255, 138, 76, 0.30); }
.c-hero { grid-area: hero; justify-content: center; }
.c-chat { grid-area: chat; }
.c-chart { grid-area: chart; }
.c-stat { grid-area: stat; justify-content: center; }
.c-entry { grid-area: entry; justify-content: center; }
.lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #5B6B82; margin-bottom: 10px; }
.c-hero h2 { font-size: 21px; font-weight: 700; letter-spacing: -0.5px; line-height: 1.32; }
.c-hero h2 .o { color: #FF8A4C; }
.c-hero p { margin-top: 8px; font-size: 13px; color: #8FA0B8; line-height: 1.7; max-width: 420px; }
.shine {
  position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse 55% 90% at 88% 0%, rgba(255, 138, 76, 0.12), transparent 60%);
}
.msgs { display: flex; flex-direction: column; gap: 7px; flex: 1; justify-content: center; }
.msg { max-width: 88%; padding: 8px 12px; border-radius: 12px; font-size: 11.5px; line-height: 1.55; }
.msg-in { background: rgba(255, 255, 255, 0.07); color: #CBD5E1; border-radius: 12px 12px 12px 4px; align-self: flex-start; }
.msg-out { background: #06C755; color: #fff; border-radius: 12px 12px 4px 12px; align-self: flex-end; box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25); }
.typing { align-self: flex-start; display: flex; gap: 4px; padding: 9px 12px; background: rgba(255, 255, 255, 0.05); border-radius: 12px 12px 12px 4px; }
.typing i { width: 5px; height: 5px; border-radius: 50%; background: #64748B; animation: blink 1.2s infinite; }
.typing i:nth-child(2) { animation-delay: 0.2s; }
.typing i:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink { 0%, 100% { opacity: 0.3; transform: translateY(0); } 50% { opacity: 1; transform: translateY(-2px); } }
.statline { display: flex; justify-content: space-between; align-items: baseline; }
.statline b { font-size: 26px; font-weight: 700; letter-spacing: -0.8px; }
.up { font-size: 11px; font-weight: 600; color: #34D399; }
.bars { display: flex; align-items: flex-end; gap: 9px; flex: 1; margin-top: 6px; }
.bars i { flex: 1; border-radius: 7px 7px 3px 3px; background: linear-gradient(180deg, rgba(255, 138, 76, 0.85), rgba(232, 99, 47, 0.18)); transform-origin: bottom; animation: grow 0.9s cubic-bezier(0.25, 1, 0.5, 1) backwards; }
.bars i:nth-child(2n) { background: linear-gradient(180deg, rgba(167, 139, 250, 0.8), rgba(139, 92, 246, 0.15)); }
.bars i:nth-child(1) { height: 34%; } .bars i:nth-child(2) { height: 56%; } .bars i:nth-child(3) { height: 44%; }
.bars i:nth-child(4) { height: 72%; animation-delay: 0.08s; } .bars i:nth-child(5) { height: 58%; }
.bars i:nth-child(6) { height: 88%; animation-delay: 0.16s; } .bars i:nth-child(7) { height: 70%; }
.bars i:nth-child(8) { height: 96%; animation-delay: 0.24s; } .bars i:nth-child(9) { height: 78%; }
@keyframes grow { from { transform: scaleY(0); } }
.big { font-size: 34px; font-weight: 700; letter-spacing: -1px; }
.lbl2 { font-size: 11.5px; color: #8FA0B8; margin-top: 6px; line-height: 1.6; }
.mini { display: flex; gap: 5px; margin-top: 14px; }
.mini i { height: 5px; border-radius: 3px; background: rgba(52, 211, 153, 0.6); }
.oa { display: flex; align-items: center; gap: 12px; }
.oa .avatar {
  width: 44px; height: 44px; border-radius: 13px; flex-shrink: 0;
  background: linear-gradient(135deg, #FF8A4C, #C24A1E);
  display: grid; place-items: center; font-weight: 700; color: #fff;
}
.oa .skwrap { flex: 1; }
.sk { height: 9px; border-radius: 5px; background: rgba(255, 255, 255, 0.09); }
.sk.w60 { width: 60%; margin-bottom: 7px; }
.sk.w85 { width: 85%; }
.oapill {
  margin-top: 14px; width: fit-content; padding: 6px 12px; border-radius: 999px;
  font-size: 10.5px; font-weight: 600; color: #FFB48A;
  background: rgba(232, 99, 47, 0.12); border: 1px solid rgba(232, 99, 47, 0.3);
}

/* sections */
.feats-sec, .split-section, .steps-sec, .cta-wrap { position: relative; z-index: 1; max-width: 1120px; margin: 0 auto; padding: 52px 22px 0; }
.feats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.feat { padding: 20px; display: flex; gap: 14px; align-items: flex-start; }
.fi { width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; flex-shrink: 0; }
.fi svg { width: 17px; height: 17px; }
.fi-1 { color: #FFB48A; background: rgba(232, 99, 47, 0.14); border: 1px solid rgba(232, 99, 47, 0.30); }
.fi-2 { color: #6EE7A0; background: rgba(6, 199, 85, 0.12); border: 1px solid rgba(6, 199, 85, 0.30); }
.fi-3 { color: #C4B5FD; background: rgba(139, 92, 246, 0.14); border: 1px solid rgba(139, 92, 246, 0.30); }
.feat h3 { font-size: 13.5px; font-weight: 700; margin-bottom: 4px; }
.feat p { font-size: 12px; color: #8FA0B8; line-height: 1.65; }

.kicker { font-size: 11px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: #FF8A4C; margin-bottom: 12px; }
.kicker.center { text-align: center; }
.center { text-align: center; }
.h2 { font-size: clamp(24px, 3.2vw, 34px); font-weight: 700; letter-spacing: -1px; line-height: 1.22; text-align: center; }

/* splits */
.split { display: grid; grid-template-columns: 1fr 1fr; gap: 44px; align-items: center; }
.split-rev .split-text { order: 2; }
.split-title { font-size: clamp(21px, 2.5vw, 27px); font-weight: 700; letter-spacing: -0.7px; line-height: 1.28; }
.split-lead { margin-top: 13px; font-size: 14px; line-height: 1.8; color: #8FA0B8; }
.ticks { margin-top: 18px; display: grid; gap: 10px; list-style: none; }
.ticks li { display: flex; gap: 10px; align-items: flex-start; font-size: 13.5px; color: #C7D2E0; line-height: 1.65; }
.ticks :deep(svg) { width: 16px; height: 16px; color: #34D399; flex-shrink: 0; margin-top: 2px; }

/* dashboard panel */
.panel-dark {
  border-radius: 22px; padding: 22px; color: #F5F5F4; position: relative; overflow: hidden;
  background: linear-gradient(160deg, #1C1712, #12100C 70%);
  border: 1px solid rgba(255, 255, 255, 0.09);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.40);
}
.panel-dark::after {
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
.dbars { grid-column: 1 / -1; padding: 14px; border-radius: 14px; background: rgba(255, 255, 255, 0.055); border: 1px solid rgba(255, 255, 255, 0.09); }
.dbars .bars { height: 84px; }

/* stock panel */
.stockpanel { border-radius: 22px; padding: 22px; }
.stockpanel .panel-label { color: rgba(245, 245, 244, 0.45); }
.rows { display: grid; gap: 10px; }
.row-i { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 13px; background: rgba(255, 255, 255, 0.045); border: 1px solid rgba(255, 255, 255, 0.08); }
.thumb { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
.info b { font-size: 13px; display: block; }
.info small { font-size: 11px; color: #7C8BA1; }
.end { margin-left: auto; }
.pill2 { font-size: 9.5px; font-weight: 700; padding: 3px 9px; border-radius: 999px; white-space: nowrap; }
.pill2.ok { color: #34D399; background: rgba(52, 211, 153, 0.10); }
.pill2.warn { color: #FFB48A; background: rgba(232, 99, 47, 0.12); }
.pill2.off { color: #7C8BA1; background: rgba(124, 139, 161, 0.12); }

/* steps */
.steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 28px; }
.step { padding: 24px; }
.n {
  width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; margin-bottom: 14px;
  font-size: 13px; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #FF8A4C, #E8632F);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.35);
}
.step h3 { font-size: 14.5px; font-weight: 700; margin-bottom: 7px; }
.step p { font-size: 12.5px; line-height: 1.75; color: #8FA0B8; }

/* team */
.sec { display: grid; grid-template-columns: 1fr 1fr; gap: 44px; align-items: center; }
.chiprole { display: flex; align-items: center; gap: 11px; padding: 12px 14px; border-radius: 13px; background: rgba(255, 255, 255, 0.045); border: 1px solid rgba(255, 255, 255, 0.08); }
.chiprole + .chiprole { margin-top: 9px; }
.chiprole .c { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.chiprole b { font-size: 13px; display: block; }
.chiprole small { display: block; font-size: 10.5px; color: #7C8BA1; margin-top: 1px; }

/* CTA band */
.band {
  border-radius: 26px; padding: 52px 40px; text-align: center; color: #fff; position: relative; overflow: hidden;
  background: linear-gradient(140deg, #E8632F 0%, #C24A1E 55%, #9A3A14 100%);
  box-shadow: 0 18px 44px rgba(0, 0, 0, 0.35);
}
.band::before {
  content: ''; position: absolute; inset: 0;
  background: radial-gradient(ellipse 60% 80% at 15% 10%, rgba(255, 255, 255, 0.16), transparent 55%);
}
.band h2 { position: relative; font-size: clamp(25px, 3.4vw, 36px); font-weight: 700; letter-spacing: -1px; }
.band p { position: relative; margin: 14px auto 0; max-width: 520px; font-size: 14.5px; line-height: 1.75; color: rgba(255, 255, 255, 0.85); }
.band .hero-ctas { position: relative; margin-top: 28px; }

/* footer */
.foot { position: relative; z-index: 1; border-top: 1px solid rgba(255, 255, 255, 0.07); margin-top: 56px; padding: 22px; text-align: center; font-size: 12px; color: #5B6B82; }

/* responsive */
@media (max-width: 900px) {
  .bento { grid-template-columns: 1fr 1fr; grid-auto-rows: auto;
    grid-template-areas: 'hero hero' 'chat chat' 'chart stat' 'entry entry'; }
  .cell { min-height: 130px; }
  .feats, .steps { grid-template-columns: 1fr; }
  .split, .sec { grid-template-columns: 1fr; gap: 26px; }
  .split-rev .split-text { order: 0; }
  .band { padding: 44px 24px; }
}
</style>
