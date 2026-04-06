<template>
  <div class="min-h-screen flex flex-col items-center justify-center text-center p-6">
    <p class="text-8xl font-bold text-primary-200">404</p>
    <h1 class="text-2xl font-bold text-gray-800 mt-4">Page not found</h1>
    <p class="text-gray-500 mt-2">The page you're looking for doesn't exist.</p>
    <RouterLink to="/dashboard" class="mt-6 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
      Go to Dashboard
    </RouterLink>
  </div>
</template>
