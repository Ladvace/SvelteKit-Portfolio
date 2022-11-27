<script>
	export let data;
	let devToArticles = data.devToArticles;

	const blackListedArticles = [422939];

	const articles = [...devToArticles];

	const filteredArticles = articles.filter((article) => !blackListedArticles.includes(article?.id));
</script>

<svelte:head>
	<title>Gianmarco Cavallo — Blog</title>
</svelte:head>

<div class="articlesContainer">
	<div class="articles">
		<h1>Articles</h1>

		{#each filteredArticles as article}
			<div class="article">
				<div class="header">
					<h2>
						{article.title}
					</h2>
					<div>Tags: {article.tags || article.category}</div>
				</div>
				<p>
					{article.description || ''}
				</p>

				<a
					href={article.id ? `/blog/${article.id}` : article.link}
					target={!article.id ? '_blank' : '_self'}
				>
					<div class="button">Read Article =></div>
				</a>
			</div>
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
		display: flex;
		flex-direction: column;
		color: white;
		background: #111;
		padding: 2rem;
		width: 100%;
		border-radius: 5px;
		transition: transform 0.2s ease-in-out;
		border-radius: 25px;
	}

	.article p {
		font-weight: 100;
		color: #708090;
	}

	.articles {
		width: 100%;
		margin: 50px auto;
		display: grid;
		grid-gap: 1rem;
		grid-template-columns: 1fr;
	}

	.button {
		display: flex;
		justify-content: center;
		align-items: center;
		color: white;
		border: 2px solid white;
		padding: 10px;
	}

	@media (min-width: 900px) {
		.articlesContainer {
			padding: 0;
		}
		.articles > h1 {
			font-size: 48px;
			margin: 0 0 50px 0;
		}

		.articles {
			grid-template-columns: 1fr;
		}

		.articles .article {
			min-height: 200px;
		}

		.button {
			max-width: 200px;
		}
	}

	@media (min-width: 600px) {
		.articles {
			grid-template-columns: 1fr;
		}
	}
</style>
