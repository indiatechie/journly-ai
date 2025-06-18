<script>
  // No logic needed
</script>

<style src="../app.css"></style>

<header class="bg-white shadow-sm py-4 px-6 sticky top-0 z-10">
  <div class="max-w-4xl mx-auto flex items-center justify-between">
    <div class="flex items-center gap-3">
      <img src="/logo.png" alt="Journly.ai logo" class="h-10 w-10" />
      <h1 class="text-2xl font-bold text-gray-800">Journly.ai</h1>
    </div>
    <p class="text-sm italic text-gray-500 hidden sm:block">
      Private journaling. AI-powered storytelling.
    </p>
  </div>
</header>

<main class="max-w-3xl mx-auto px-4 py-6 space-y-6">
  <slot />
</main>
