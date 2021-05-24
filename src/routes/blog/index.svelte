<script context="module">
	import { UserInfoEndpoint } from '$lib/Constants';
	export async function load({ fetch }) {
		let articles;

		try {
			articles = await fetch(`${UserInfoEndpoint}ladvace`);
			articles = await articles.json();
		} catch (e) {
			console.log(e);
		}

		return {
			props: {
				articles
			}
		};
	}
</script>

<script>
	export let articles;

	const blackListedArticles = [422939];

	const filteredArticles = articles.filter((article) => !blackListedArticles.includes(article.id));
</script>

<svelte:head>
	<title>Gianmarco Cavallo — Blog</title>
</svelte:head>

<div class="articlesContainer">
	<div class="articles">
		<h1>Articles</h1>

		{#each filteredArticles as article}
			<a href={`/blog/${article.id}`}>
				<div class="article">
					<div class="header">
						<h2>
							{article.title}
						</h2>
						<h4>Tags: {article.tags}</h4>
					</div>
					<p>
						{article.description}
					</p>
				</div>
			</a>
		{/each}
		{#if filteredArticles.length === 0}
			<div>No Articles</div>
		{/if}
	</div>
</div>

<style>
	.articlesContainer {
		width: 100%;
		max-width: 900px;
		min-height: 800px;
		display: flex;
		justify-content: center;
		box-sizing: border-box;
		text-align: center;
		padding: 1em;
		margin: 0 auto;
		text-align: center;
	}

	a {
		text-decoration: none;
	}

	.articlesContainer .articles {
		display: grid;
		grid-template-columns: 1fr;
		grid-gap: 40px;
		margin-top: 30px;
	}

	h2 {
		display: flex;
	}

	.articles > h1 {
		font-weight: 700;
		text-align: start;
		margin: 0;
		font-size: 36px;
	}

	.article {
		text-align: start;
		box-sizing: border-box;
		font-weight: 700;
		display: flex;
		flex-direction: column;
		color: white;
		padding: 2rem;
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

	.article p {
		font-weight: 100;
	}

	.article:hover {
		transform: scale(1.01);
		cursor: pointer;
	}

	.articles {
		width: 100%;
		margin: 50px auto;
		display: grid;
		grid-gap: 1rem;
		grid-template-columns: 1fr;
	}

	@media (min-width: 900px) {
		.articlesContainer {
			padding: 0;
		}
		.articles > h1 {
			font-size: 48px;
			margin: 50px 0 0 0;
		}

		.articles {
			grid-template-columns: 1fr;
		}

		.articles .article {
			min-height: 200px;
		}
	}

	@media (min-width: 600px) {
		.articles {
			grid-template-columns: 1fr;
		}
	}
</style>
