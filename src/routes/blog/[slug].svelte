<script context="module">
	import { ArticleEndPoint } from '$lib/Constants';
	export async function load({ fetch, page }) {
		try {
			let article = await fetch(`${ArticleEndPoint}/${page.params.slug}`);
			article = await article.json();
			return {
				props: {
					article
				}
			};
		} catch (e) {
			console.log(e);
		}
	}
</script>

<script>
	import FaExternalLinkAlt from 'svelte-icons/fa/FaExternalLinkAlt.svelte';

	export let article;
</script>

<svelte:head>
	<title>Gianmarco Cavallo — {article.title}</title>
</svelte:head>

<div class="articleContainer">
	<div class="article">
		<h1>
			<a href={article.url} target="_blank"
				>{article.title}
				<div class="icon"><FaExternalLinkAlt /></div></a
			>
		</h1>
		{@html article.body_html}
	</div>
</div>

<style>
	.articleContainer {
		width: 100%;
		max-width: 350px;
		display: flex;
		justify-content: center;
		box-sizing: border-box;
		text-align: center;
		padding: 0;
		margin: 50px 10px 0;
		text-align: center;
		/* font-size: 20px; */
	}

	h1 {
		font-weight: 700;
		text-align: start;
		margin: 0;
		/* font-size: 36px; */
	}

	.article :global(img) {
		max-width: 80%;
	}

	.article {
		text-align: start;
		box-sizing: border-box;
		font-weight: 700;
		display: flex;
		flex-direction: column;
		color: white;
		padding: 30px;
		width: 100%;
		border-radius: 5px;
		transition: transform 0.2s ease-in-out, background 0.2s ease-in-out;

		border-radius: 25px;
		background: linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);
		-webkit-backdrop-filter: blur(20px);
		backdrop-filter: blur(20px);
		-webkit-animation: cardWobble 10000ms infinite;
		animation: cardWobble 10000ms infinite;
		box-shadow: 2px 4px 6px rgba(0, 0, 0, 0.1), inset 0 0 0 2px rgba(255, 255, 255, 0.1);
	}
	.icon {
		width: 20px;
		height: 20px;
		margin-left: 10px;
	}

	.article > h1 > a {
		color: white;
	}
	.article:hover {
		cursor: pointer;
	}

	@media (min-width: 900px) {
		.articleContainer {
			padding: 0;
			max-width: 900px;
		}
		.article > h1 {
			font-size: 48px;
			margin: 50px 0 0 0;
		}
	}
</style>
