<svelte:head>
	<title>Gianmarco Cavallo — About</title>
</svelte:head>

<div class="container">
	<main>
		<h1>About</h1>
		<p>
			Hi, I'm Gianmarco, a front-end developer based in Italy. I'm a javascript and web technologies
			enthusiast with a strong focus on UI/UX. I'm active in open-source community.
		</p>
	</main>
</div>

<style>
	.container {
		max-width: 900px;
		padding: 1em;
		display: flex;
		justify-content: center;
	}

	main {
		min-height: 500px;
		text-align: center;
		margin: 0 auto;
		box-sizing: border-box;
	}

	h1 {
		font-weight: 700;
		margin: 0 0 50px 0;
		font-size: 36px;
		text-align: start;
	}

	@media (min-width: 900px) {
		main > h1 {
			font-size: 48px;
		}
	}
</style>
