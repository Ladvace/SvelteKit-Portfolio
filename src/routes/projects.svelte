<script>
	import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
	import Icon from 'svelte-awesome';
</script>

<svelte:head>
	<title>Gianmarco Cavallo — Projects</title>
</svelte:head>

<div class="projectContainer">
	<div class="projects">
		<h1>Projects</h1>
		<a href="https://github.com/gorilla-devs/GDLauncher">
			<div class="project">
				<div class="header">
					<h2>GDLauncher <Icon data={faExternalLinkAlt} /></h2>
					<h4>Languages/Tech: Node, React, Redux, Electron...</h4>
				</div>
				<p>
					GDLauncher is a simple, yet powerful Minecraft custom launcher with a strong focus on the
					user experience
				</p>
				<!-- <Button>CIAO</Button> -->
			</div>
		</a>
		<a href="https://github.com/Ladvace/WiseMan-DiscordBot">
			<div class="project">
				<div class="header">
					<h2>WiseMan Discord Bot <Icon data={faExternalLinkAlt} /></h2>
					<h4>Languages/Tech: Node, FireBase/MongoDb</h4>
				</div>
				<p>The wiseMan bot allows you to level up based on the time you spend in a vocal channel</p>
			</div>
		</a>
		<a href="https://github.com/Ladvace/easy-react-carousel">
			<div class="project">
				<div class="header">
					<h2>easy-react-carousel <Icon data={faExternalLinkAlt} /></h2>
					<h4>Languages/Tech: React</h4>
				</div>
				<p>A simple carousel made in reactjs</p>
			</div>
		</a>
	</div>
</div>

<style>
	.projectContainer {
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

	h1 {
		font-weight: 700;
		text-align: start;
	}

	.projectContainer .projects {
		display: grid;
		grid-template-columns: 1fr;
		grid-gap: 40px;
		margin-top: 30px;
	}

	.projects > h1 {
		margin: 0;
		font-size: 36px;
	}

	.project {
		text-align: start;
		box-sizing: border-box;
		font-weight: 700;
		border: 1px dashed transparent;
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

	.project p {
		font-weight: 100;
	}

	.project:hover {
		border: 1px dashed white;
		transform: scale(1.01);
		cursor: pointer;
		/* background: #24262d; */
	}

	.projects {
		width: 100%;
		margin: 50px auto;
		display: grid;
		grid-gap: 1rem;
		grid-template-columns: 1fr;
	}

	@media (min-width: 900px) {
		.projectContainer {
			padding: 0;
		}
		.projects > h1 {
			font-size: 48px;
			margin: 50px 0 0 0;
		}

		.projects {
			grid-template-columns: 1fr;
		}

		.projects .project {
			/* height: 100%; */
			min-height: 200px;
		}
	}

	@media (min-width: 600px) {
		.projects {
			grid-template-columns: 1fr;
		}
	}
</style>
