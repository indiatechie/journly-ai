<script lang="ts">
  import { encrypt } from '$lib/encryption/crypto';
  import { db } from '$lib/db/journal';

  let entry = '';

  const save = async () => {
    if (!entry.trim()) return;

    const encrypted = encrypt(entry);
    await db.journal.add({
      id: crypto.randomUUID(),
      text: encrypted,
      date: new Date().toISOString()
    });

    entry = '';
    alert('Entry saved!');
  };
</script>

<h1 class="text-2xl font-bold mb-4">Today's Journal</h1>

<textarea
  bind:value={entry}
  rows="8"
  class="w-full p-3 border border-gray-300 rounded-lg mb-4"
  placeholder="Write your thoughts..."
></textarea>

<button
  class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
  on:click={save}
>
  Save Entry
</button>
