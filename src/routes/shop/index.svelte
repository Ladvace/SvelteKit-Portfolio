<script context="module">
	import client from '$lib/commerce.js';

	export async function load() {
		// const { data: categories } = await client.categories.list();
		const { data: products } = await client.products.list();

		return {
			props: {
				// categories,
				products
			}
		};
	}
</script>

<script>
	export let products;
	import Card from '$lib/components/ProductCard.svelte';
</script>

<svelte:head>
	<title>Gianmarco Cavallo — Shop</title>
</svelte:head>

<div class="shopContainer">

	<div>
		{#each products as product}
				<Card {product} />
		{/each}
	</div>
</div>

<style>
	.shopContainer {
		width: 100%;
		height: calc(100vh - 48px - 80px);
		max-width: 900px;
		display: flex;
		justify-content: center;
		align-items: center;
		box-sizing: border-box;
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}
</style>
