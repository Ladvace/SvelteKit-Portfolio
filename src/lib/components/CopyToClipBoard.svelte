<script>
	import { onMount } from 'svelte';
	
	export let email;

	let textarea;
	
	onMount(() => {
		textarea.select();
		document.execCommand('copy');
	});
</script>

<textarea bind:value={email} bind:this={textarea}></textarea>

