<script>
</script>

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
		display: flex;
		justify-content: center;
	}

	main {
		min-height: 500px;
		text-align: center;
		padding: 1em;
		margin: 0 auto;
		box-sizing: border-box;
	}

	h1 {
		font-weight: 700;
		margin: 50px 0 0 0;
		font-size: 36px;
		text-align: start;
	}

	@media (min-width: 900px) {
		main {
			min-height: calc(100vh - 48px - 90px);
		}
		main > h1 {
			font-size: 48px;
		}
		p {
			margin: 50px 0 0;
		}
	}
</style>
