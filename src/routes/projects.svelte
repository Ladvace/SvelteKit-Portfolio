<script>
	import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
	import Icon from 'svelte-awesome';
	import projects from '$lib/Projects';
</script>

<svelte:head>
	<title>Gianmarco Cavallo — Projects</title>
</svelte:head>

<div class="projectContainer">
	<div class="projects">
		<h1>Projects</h1>

		{#each projects as project}
			<a href={project.url}>
				<div class="project">
					<div class="header">
						<h2>{project.title} <Icon data={faExternalLinkAlt} /></h2>
						<h4>
							Technologies:
							<div class="techs">
								{#each project.technologies as tech}
									<div>{tech}</div>
								{/each}
							</div>
						</h4>
					</div>
					<p>
						{project.description}
					</p>
					<!-- <Button>CIAO</Button> -->
				</div>
			</a>
		{/each}
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

	.projectContainer .projects {
		display: grid;
		grid-template-columns: 1fr;
		grid-gap: 40px;
		margin-top: 30px;
	}

	h2 {
		margin: 0;
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
	}

	.projects {
		width: 100%;
		margin: 50px auto;
		display: grid;
		grid-gap: 1rem;
		grid-template-columns: 1fr;
		margin-bottom: 10px;
	}

	.header h4 {
		display: flex;
		margin: 0 0 10px 0;
	}
	.techs {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.techs > div {
		margin: 0 10px;
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
