<template>
  <AppLayout>
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between gap-4">
        <h1 class="text-2xl font-bold text-gray-900">Users</h1>
        <div class="flex items-center gap-3">
          <input
            v-model="search"
            @input="onSearch"
            type="search"
            placeholder="Search users…"
            class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 w-56"
          />
          <button
            v-can="'users.edit'"
            @click="openCreate"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition whitespace-nowrap"
          >
            + New User
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200 text-left">
            <tr>
              <th class="px-5 py-3 font-medium text-gray-600">User</th>
              <th class="px-5 py-3 font-medium text-gray-600">System Role</th>
              <th class="px-5 py-3 font-medium text-gray-600">Assigned Roles</th>
              <th class="px-5 py-3 font-medium text-gray-600">Status</th>
              <th class="px-5 py-3 font-medium text-gray-600">Joined</th>
              <th class="px-5 py-3 font-medium text-gray-600">Last Login</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="loading">
              <td colspan="7" class="text-center py-12 text-gray-400">Loading…</td>
            </tr>
            <tr v-else-if="!users.length">
              <td colspan="7" class="text-center py-12 text-gray-400">No users found.</td>
            </tr>
            <tr
              v-for="u in users"
              :key="u.id"
              class="hover:bg-gray-50 transition"
            >
              <!-- User -->
              <td class="px-5 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {{ u.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <p class="font-medium text-gray-900">{{ u.name }}</p>
                    <p class="text-gray-400 text-xs">{{ u.email }}</p>
                  </div>
                </div>
              </td>

              <!-- System role -->
              <td class="px-5 py-3">
                <span :class="systemRoleBadge(u.role)" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                  {{ u.role }}
                </span>
              </td>

              <!-- Assigned roles -->
              <td class="px-5 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="r in u.roles"
                    :key="r.id"
                    class="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    :style="{ backgroundColor: r.color }"
                  >{{ r.name }}</span>
                  <span v-if="!u.roles?.length" class="text-gray-400 text-xs">—</span>
                </div>
              </td>

              <!-- Status -->
              <td class="px-5 py-3">
                <span
                  :class="u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  class="px-2 py-0.5 rounded-full text-xs font-medium"
                >{{ u.isActive ? 'Active' : 'Inactive' }}</span>
              </td>

              <!-- Joined -->
              <td class="px-5 py-3 text-gray-500 text-xs">{{ fmtDate(u.createdAt) }}</td>

              <!-- Last login -->
              <td class="px-5 py-3 text-gray-500 text-xs">{{ u.lastLoginAt ? fmtDate(u.lastLoginAt) : '—' }}</td>

              <!-- Actions -->
              <td class="px-5 py-3 text-right whitespace-nowrap">
                <button @click="openView(u)" class="text-gray-500 hover:text-gray-800 text-xs mr-3">View</button>
                <button v-can="'users.edit'" @click="openEdit(u.id)" class="text-primary-600 hover:underline text-xs mr-3">Edit</button>
                <button @click="seedSequences(u)" :disabled="seedingId === u.id"
                  class="text-amber-600 hover:underline text-xs mr-3 disabled:opacity-40"
                  title="Seed default Sequence Numbers for this user if none exist">
                  {{ seedingId === u.id ? 'Seeding…' : 'Seed Sequences' }}
                </button>
                <button v-can="'users.delete'" @click="confirmDelete(u)" class="text-red-500 hover:underline text-xs">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-500">
          <span>{{ total }} user{{ total !== 1 ? 's' : '' }}</span>
          <div class="flex items-center gap-1">
            <button
              @click="page--"
              :disabled="page <= 1"
              class="px-3 py-1 border rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
            >Prev</button>
            <span class="px-3 py-1 text-xs">{{ page }} / {{ Math.max(1, Math.ceil(total / limit)) }}</span>
            <button
              @click="page++"
              :disabled="page * limit >= total"
              class="px-3 py-1 border rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
            >Next</button>
          </div>
        </div>
      </div>

      <!-- ── View User Slide-over ──────────────────────────────────────────── -->
      <Transition name="slide">
        <div v-if="viewUser" class="fixed inset-0 z-50 flex justify-end">
          <div class="absolute inset-0 bg-black/30" @click="viewUser = null" />
          <div class="relative w-full max-w-md bg-white shadow-xl flex flex-col h-full">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b">
              <h2 class="text-lg font-semibold">User Details</h2>
              <button @click="viewUser = null" class="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              <!-- Avatar + name -->
              <div class="flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold">
                  {{ viewUser.name.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <p class="text-lg font-semibold text-gray-900">{{ viewUser.name }}</p>
                  <p class="text-sm text-gray-500">{{ viewUser.email }}</p>
                </div>
              </div>

              <!-- Meta -->
              <dl class="grid grid-cols-2 gap-4">
                <div>
                  <dt class="text-xs font-medium text-gray-400 uppercase tracking-wide">System Role</dt>
                  <dd class="mt-1">
                    <span :class="systemRoleBadge(viewUser.role)" class="px-2 py-0.5 rounded-full text-xs font-medium capitalize">
                      {{ viewUser.role }}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-gray-400 uppercase tracking-wide">Status</dt>
                  <dd class="mt-1">
                    <span :class="viewUser.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ viewUser.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-gray-400 uppercase tracking-wide">Joined</dt>
                  <dd class="mt-1 text-sm text-gray-700">{{ fmtDateLong(viewUser.createdAt) }}</dd>
                </div>
                <div>
                  <dt class="text-xs font-medium text-gray-400 uppercase tracking-wide">Last Login</dt>
                  <dd class="mt-1 text-sm text-gray-700">{{ viewUser.lastLoginAt ? fmtDateLong(viewUser.lastLoginAt) : 'Never' }}</dd>
                </div>
              </dl>

              <!-- Roles & Permissions -->
              <div>
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Roles & Permissions</p>
                <div v-if="!viewUser.roles?.length" class="text-sm text-gray-400 italic">No roles assigned.</div>
                <div v-for="role in viewUser.roles" :key="role.id" class="mb-3">
                  <div class="flex items-center gap-2 mb-1.5">
                    <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: role.color }" />
                    <span class="font-medium text-gray-800 text-sm">{{ role.name }}</span>
                  </div>
                  <div class="flex flex-wrap gap-1 pl-4">
                    <span
                      v-for="perm in role.permissions"
                      :key="perm.id"
                      class="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs font-mono"
                    >{{ perm.slug }}</span>
                    <span v-if="!role.permissions?.length" class="text-xs text-gray-400 italic">No permissions</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-6 py-4 border-t flex gap-3">
              <button
                v-can="'users.edit'"
                @click="() => { const id = viewUser.id; viewUser = null; openEdit(id) }"
                class="flex-1 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >Edit User</button>
              <button @click="viewUser = null" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Close</button>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ── Create / Edit Modal ──────────────────────────────────────────── -->
      <div v-if="form" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
            <h2 class="text-lg font-semibold">{{ form.id ? 'Edit User' : 'New User' }}</h2>
            <button @click="form = null" class="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                v-model="form.name"
                type="text"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Jane Doe"
              />
            </div>

            <!-- Email (create only) -->
            <div v-if="!form.id">
              <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                v-model="form.email"
                type="email"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="jane@example.com"
              />
            </div>

            <!-- Password (create only) -->
            <div v-if="!form.id">
              <label class="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                v-model="form.password"
                type="password"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Min. 8 characters"
              />
            </div>

            <!-- System role -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">System Role</label>
              <select v-model="form.role" class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="user">User</option>
                <option value="admin">Admin (bypasses all permission checks)</option>
              </select>
            </div>

            <!-- Default Page (role user only) -->
            <div v-if="form.role === 'user'">
              <label class="block text-sm font-medium text-gray-700 mb-1">Default Page</label>
              <input
                v-model="form.defaultPage"
                type="text"
                class="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. /erp/dashboard"
              />
              <p class="text-xs text-gray-400 mt-1">Page to redirect to after login. Leave blank to use the default dashboard.</p>
            </div>

            <!-- Active (edit only) -->
            <div v-if="form.id" class="flex items-center gap-2">
              <input type="checkbox" id="chk-active" v-model="form.isActive" class="rounded w-4 h-4" />
              <label for="chk-active" class="text-sm text-gray-700">Account active</label>
            </div>

            <!-- Assign Roles -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Assigned Roles</label>
              <div class="border rounded-lg divide-y max-h-48 overflow-y-auto">
                <label
                  v-for="role in allRoles"
                  :key="role.id"
                  class="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                >
                  <input type="checkbox" :value="role.id" v-model="form.roleIds" class="rounded w-4 h-4" />
                  <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="{ backgroundColor: role.color }" />
                  <div class="flex-1 min-w-0">
                    <span class="text-sm font-medium text-gray-800">{{ role.name }}</span>
                    <span class="ml-2 text-xs text-gray-400">{{ role.slug }}</span>
                  </div>
                  <span class="text-xs text-gray-400">{{ role.permissions?.length ?? 0 }} perms</span>
                </label>
                <div v-if="!allRoles.length" class="px-4 py-3 text-sm text-gray-400 italic">No roles available</div>
              </div>
            </div>

            <!-- Error -->
            <div v-if="formError" class="bg-red-50 text-red-700 text-sm px-4 py-2 rounded-lg">{{ formError }}</div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 border-t flex justify-end gap-3 flex-shrink-0">
            <button @click="form = null" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
            <button
              @click="saveForm"
              :disabled="saving"
              class="px-5 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ saving ? 'Saving…' : (form.id ? 'Save Changes' : 'Create User') }}
            </button>
          </div>
        </div>
      </div>

    </div>
  </AppLayout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import api from '@/api'

// ── State ────────────────────────────────────────────────────────────────────

const users   = ref([])
const total   = ref(0)
const page    = ref(1)
const limit   = 20
const search  = ref('')
const loading = ref(false)

const allRoles = ref([])

const viewUser = ref(null)   // slide-over
const seedingId = ref(null)  // user id currently being seeded

const form      = ref(null)  // create/edit modal
const formError = ref('')
const saving    = ref(false)

let searchTimeout = null

// ── Data fetching ─────────────────────────────────────────────────────────────

async function fetchUsers() {
  loading.value = true
  try {
    const { data } = await api.get('/users', { params: { page: page.value, limit, search: search.value } })
    users.value  = data.data.users
    total.value  = data.data.total
  } finally {
    loading.value = false
  }
}

async function fetchRoles() {
  const { data } = await api.get('/roles')
  allRoles.value = data.data.roles
}

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchUsers() }, 350)
}

watch(page, fetchUsers)
onMounted(() => Promise.all([fetchUsers(), fetchRoles()]))

// ── View (slide-over) ─────────────────────────────────────────────────────────

async function openView(row) {
  // Fetch full user with role permissions
  const { data } = await api.get(`/users/${row.id}`)
  viewUser.value = data.data.user
}

// ── Create ────────────────────────────────────────────────────────────────────

function openCreate() {
  form.value      = { name: '', email: '', password: '', role: 'user', isActive: true, defaultPage: '', roleIds: [] }
  formError.value = ''
}

// ── Edit ──────────────────────────────────────────────────────────────────────

async function openEdit(id) {
  formError.value = ''
  const { data } = await api.get(`/users/${id}`)
  const u = data.data.user
  form.value = {
    id:          u.id,
    name:        u.name,
    role:        u.role,
    isActive:    u.isActive,
    defaultPage: u.defaultPage || '',
    roleIds:     (u.roles || []).map((r) => r.id),
  }
}

// ── Save (create or update + role assignment) ─────────────────────────────────

async function saveForm() {
  formError.value = ''
  saving.value    = true
  try {
    if (form.value.id) {
      // Update basic fields
      await api.put(`/users/${form.value.id}`, {
        name:        form.value.name,
        role:        form.value.role,
        isActive:    form.value.isActive,
        defaultPage: form.value.defaultPage || null,
      })
      // Assign roles
      await api.put(`/users/${form.value.id}/roles`, { roleIds: form.value.roleIds })
    } else {
      // Create with roles included in body
      await api.post('/users', {
        name:        form.value.name,
        email:       form.value.email,
        password:    form.value.password,
        role:        form.value.role,
        defaultPage: form.value.defaultPage || null,
        roleIds:     form.value.roleIds,
      })
    }
    form.value = null
    fetchUsers()
  } catch (err) {
    const d = err.response?.data
    if (d?.errors?.length) {
      formError.value = d.errors.map((e) => e.message).join(', ')
    } else {
      formError.value = d?.message || 'Save failed'
    }
  } finally {
    saving.value = false
  }
}

// ── Seed Sequences ────────────────────────────────────────────────────────────

async function seedSequences(u) {
  seedingId.value = u.id
  try {
    const { data } = await api.post(`/erp/sequences/seed-defaults/${u.id}`)
    if (data.data.seeded) {
      alert(`Seeded ${data.data.count} default sequence(s) for ${u.name}.`)
    } else {
      alert(`${u.name} already has ${data.data.count} sequence(s) — no action taken.`)
    }
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to seed sequences')
  } finally {
    seedingId.value = null
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

async function confirmDelete(u) {
  if (!confirm(`Delete "${u.name}" (${u.email})? This cannot be undone.`)) return
  try {
    await api.delete(`/users/${u.id}`)
    fetchUsers()
  } catch (err) {
    alert(err.response?.data?.message || 'Delete failed')
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function systemRoleBadge(role) {
  return role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
}

function fmtDate(d)     { return new Date(d).toLocaleDateString() }
function fmtDateLong(d) { return new Date(d).toLocaleString() }
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.25s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
