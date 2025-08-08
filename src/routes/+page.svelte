<script lang="ts">
	import { encrypt } from '$lib/encryption/crypto';
	import { db } from '$lib/db/journal';
	import { decrypt } from '$lib/encryption/crypto';
	import { onMount } from 'svelte';

	let entry = '';
	let entries: { id: string; text: string; date: string }[] = [];

	const loadEntries = async () => {
		try {
			const stored = await db.journal.orderBy('date').reverse().toArray();
			entries = stored.map((e) => ({
				...e,
				text: decrypt(e.text)
			}));
		} catch (err) {
			console.error('Failed to load entries:', err);
		}
	};

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

	onMount(() => {
		loadEntries();
	});
</script>

<div class="mb-6 border-l-4 border-blue-400 bg-blue-50 p-4 text-blue-800">
	<h2 class="font-bold">Our Mission</h2>
	<p>
		To empower individuals to reflect, grow, and share their stories — privately and intelligently —
		through a seamless journaling experience.
	</p>
</div>

<h1 class="mb-4 text-2xl font-bold">Today's Journal</h1>

<textarea
	bind:value={entry}
	rows="6"
	class="mb-4 w-full rounded-lg border border-gray-300 p-3"
	placeholder="Write your thoughts..."
></textarea>

<button class="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" on:click={save}>
	Save Entry
</button>

<hr class="my-6" />

<h2 class="mb-2 text-xl font-semibold">Previous Entries</h2>

{#if entries.length === 0}
	<p class="text-gray-500 italic">No entries yet.</p>
{:else}
	<ul class="space-y-3">
		{#each entries as e}
			<li class="rounded border border-gray-200 bg-white p-4 shadow">
				<div class="mb-1 text-sm text-gray-500">{new Date(e.date).toLocaleString()}</div>
				<div class="whitespace-pre-line text-gray-800">{e.text}</div>
			</li>
		{/each}
	</ul>
{/if}
