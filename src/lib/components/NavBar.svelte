<script>
	import Burger from './Hamburger.svelte';
	import Logo from '../../../static/logo.svg';
	import routes from '$lib/Routes.js';
	let opened = false;
	export let segment;
</script>

<div class={opened ? 'NavBar open' : 'NavBar'}>
	<div class="innerContainer">
		<a href="/">
			<img src={Logo} alt="logo" class="logo" />
		</a>
		<div class="burger">
			<Burger bind:open={opened} />
		</div>
		<div class="buttons">
			{#each routes as route}
				<a class="button" href={route.href}
					><div class={segment === route.href && 'selected'}>{route.label}</div></a
				>
			{/each}
		</div>
	</div>
	<div class="responsiveButtons buttons">
		{#each routes as route}
			<a class="button" href={route.href}
				><div class={segment === route.href && 'selected'}>{route.label}</div></a
			>
		{/each}
	</div>
</div>

<style>
	:global(.logo) {
		cursor: pointer;
		height: 30px;
		width: 30px;
	}

	.open {
		flex-direction: column !important;
		align-items: center !important;
		height: 330px !important;
		transition: height 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955);
	}

	.selected {
		position: relative;
	}

	.selected:after {
		content: '';
		background: #ca3c25;
		display: block;
		height: 3px;
		width: 100%;
		position: absolute;
		bottom: 0;
	}

	.innerContainer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		max-width: 900px;
		box-sizing: border-box;
	}

	.innerContainer :global(a) {
		height: 30px;
	}

	.NavBar {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		width: 100%;
		max-width: 900px;
		box-sizing: border-box;
		padding: 20px;
		height: 80px;
		overflow: hidden;
		transition: height 0.2s cubic-bezier(0.455, 0.03, 0.515, 0.955);
	}

	.buttons {
		display: none;
		justify-content: space-between;
		align-items: center;
	}

	.responsiveButtons {
		margin-top: 20px;
		width: 100%;
		display: flex !important;
		flex-direction: column;
	}

	.responsiveButtons .button {
		max-width: 100px;
		width: 100%;
		text-align: center;
	}

	.buttons .button {
		padding: 0;
		cursor: pointer;
		transition: color 0.2s ease-in-out;
		text-decoration: none;
		color: white;
		position: relative;
	}

	.button div {
		padding: 0;
		margin: 10px;
	}
	.button div:hover {
		color: white;
		cursor: pointer;

		background: linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);
		-webkit-backdrop-filter: blur(20px);
		backdrop-filter: blur(20px);
		-webkit-animation: cardWobble 10000ms infinite;
		animation: cardWobble 10000ms infinite;
	}

	.burger :global(button) {
		margin: 0;
	}

	@media (min-width: 900px) {
		.NavBar {
			padding: 20px 0;
			display: flex;
			flex-direction: column;
			justify-content: center;
			align-items: center;
			max-width: 900px;
			margin: 0 auto;
		}

		.buttons {
			display: flex;
		}

		.NavBar .burger {
			display: none !important;
		}
		.responsiveButtons {
			display: none !important;
		}
	}
</style>
