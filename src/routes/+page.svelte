<script lang="ts">
  import { encrypt } from '$lib/encryption/crypto';
  import { db } from '$lib/db/journal';
  import { decrypt } from '$lib/encryption/crypto';
  import { onMount } from 'svelte';

onMount(() => {
  loadEntries();
});

  let entry = '';
  let entries: { id: string; text: string; date: string }[] = [];

  const save = async () => {
    if (!entry.trim()) return;

    const encrypted = encrypt(entry);
    await db.journal.add({
      id: crypto.randomUUID(),
      text: encrypted,
      date: new Date().toISOString()
    });

    entry = '';
    loadEntries(); // reload list after save
  };

const loadEntries = async () => {
  try {
    const stored = await db.journal.orderBy('date').reverse().toArray();
    entries = stored.map(e => ({
      ...e,
      text: decrypt(e.text)
    }));
  } catch (err) {
    console.error("Failed to load entries:", err);
  }
};


onMount(() => {
  loadEntries();
});

</script>
<div class="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-6">
  <h2 class="font-bold">Our Mission</h2>
  <p>
    To empower individuals to reflect, grow, and share their stories — privately and intelligently — through a seamless journaling experience.
  </p>
</div>

<h1 class="text-2xl font-bold mb-4">Today's Journal</h1>

<textarea
  bind:value={entry}
  rows="6"
  class="w-full p-3 border border-gray-300 rounded-lg mb-4"
  placeholder="Write your thoughts..."
></textarea>

<button
  class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
  on:click={save}
>
  Save Entry
</button>

<hr class="my-6" />

<h2 class="text-xl font-semibold mb-2">Previous Entries</h2>

{#if entries.length === 0}
  <p class="text-gray-500 italic">No entries yet.</p>
{:else}
  <ul class="space-y-3">
    {#each entries as e}
      <li class="bg-white p-4 rounded shadow border border-gray-200">
        <div class="text-sm text-gray-500 mb-1">{new Date(e.date).toLocaleString()}</div>
        <div class="text-gray-800 whitespace-pre-line">{e.text}</div>
      </li>
    {/each}
  </ul>
{/if}
