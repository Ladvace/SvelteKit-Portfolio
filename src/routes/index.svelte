<script>
	import { onMount } from 'svelte';
	import Icon from 'svelte-awesome';
	import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
	import { faGithub, faLinkedin, faInstagram } from '@fortawesome/free-brands-svg-icons';
	import { prefetchRoutes } from '$app/navigation';
	import { modalOpened } from '$lib/store';

	onMount(() => {
		prefetchRoutes();
	});
</script>

<main>
	<h1>Hi!✋ I'm Gianmarco a Front-End Developer 💻 based in Italy</h1>
	<div class="icons">
		<div
			on:click={() => {
				modalOpened.set(true);
			}}
		>
			<Icon class="icon" data={faEnvelope} scale="2.5" />
		</div>
		<a href="https://github.com/Ladvace" target="_blank">
			<Icon class="icon" data={faGithub} scale="2.5" />
		</a>
		<a href="https://www.linkedin.com/in/ladvace/" target="_blank">
			<Icon class="icon" data={faLinkedin} scale="2.5" />
		</a>
	</div>

	<div class="cards">
		<a href="/projects">
			<div class="card">
				<h2>Projects</h2>
				<p>List of projects</p>
			</div>
		</a>
		<a href="/about">
			<div class="card">
				<h2>About</h2>
				<p>Somethings more about me</p>
			</div>
		</a>
		<a href="/blog">
			<div class="card">
				<h2>Blog</h2>
				<p>my blog</p>
			</div>
		</a>
		<a href="/shop">
			<div class="card">
				<h2>Shop</h2>
				<p>product I sell</p>
			</div>
		</a>
	</div>
</main>

<style>
	a {
		color: white;
		text-decoration: none;
	}
	main {
		text-align: center;
		padding: 0;
		margin: 0 auto;
		text-align: center;
	}

	h1 {
		font-weight: 700;
	}

	main > h1 {
		margin: 50px 10px 0;
		font-size: 36px;
	}

	.icons {
		cursor: pointer;
		font-size: 30px;
		display: flex;
		justify-content: space-between;
		max-width: 200px;
		margin: 50px auto 0;
	}

	.icons :global(.icon) {
		cursor: pointer;
		transition: color 0.2s ease-in-out;
	}
	.icons :global(.icon):hover {
		color: linear-gradient(43deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%);
	}
	.card {
		font-weight: 700;
		border: 1px dashed transparent;
		display: flex;
		flex-direction: column;
		background-color: #1b1c22;
		color: white;
		padding: 1rem;
		border-radius: 5px;
		transition: transform 0.2s ease-in-out, background 0.2s ease-in-out;
		text-align: left;

		border-radius: 25px;
		background: linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);
		-webkit-backdrop-filter: blur(20px);
		backdrop-filter: blur(20px);
		-webkit-animation: cardWobble 10000ms infinite;
		animation: cardWobble 10000ms infinite;
		box-shadow: 2px 4px 6px rgba(0, 0, 0, 0.1), inset 0 0 0 2px rgba(255, 255, 255, 0.1);
	}

	.card h2 {
		margin: 0;
	}
	.card p {
		margin: 0;
		font-weight: 100;
	}

	.card:hover {
		border: 1px dashed white;
		transform: scale(1.03);
		cursor: pointer;
		/* background: #24262d; */
	}

	.cards {
		margin: 50px 10px;
		display: grid;
		grid-gap: 1rem;
	}
	@media (min-width: 900px) {
		main > h1 {
			font-size: 48px;
		}

		.icons {
			font-size: 40px;
		}

		.cards {
			grid-template-columns: repeat(3, 1fr);
			margin: 50px auto;
		}

		.card {
			display: flex;
			justify-content: center;
			align-items: center;
		}
		.cards .card {
			min-height: 200px;
		}
	}

	@media (min-width: 600px) {
		main {
			max-width: none;
		}
		.cards {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
