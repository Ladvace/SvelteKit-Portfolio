<script context="module">
	export async function load() {
		let showCookieModal;

		try {
			const showCookie = localStorage.getItem('showCookieModal');
			if (showCookie !== null) showCookieModal = JSON.parse(showCookie);
			else showCookieModal = true;
		} catch (e) {
			// console.error(e);
		}

		return {
			props: {
				showCookieModal
			}
		};
	}
</script>

<script>
	import Navbar from '$lib/components/NavBar.svelte';
	import Button from '$lib/components/Button.svelte';
	import FaCopy from 'svelte-icons/fa/FaCopy.svelte';
	import Tooltip from '$lib/components/Tooltip.svelte';
	import CopyClipBoard from '$lib/components/CopyToClipBoard.svelte';

	import { page } from '$app/stores';
	import Modal from '$lib/components/Modal.svelte';

	let copied = false;
	let email = 'cavallogianmarco@gmail.com';
	export let showCookieModal;

	const copy = () => {
		const app = new CopyClipBoard({
			target: document.getElementById('clipboard'),
			props: { email }
		});
		app.$destroy();
	};
</script>

{#if showCookieModal}
	<div class="cookieContainer">
		<p>🍪 This website use <a href="privacy-policy">Cookies.</a></p>
		<div
			on:click={() => {
				showCookieModal = false;
				localStorage.setItem('showCookieModal', false);
			}}
		>
			&#10005;
		</div>
	</div>
{/if}

<Modal>
	<div slot="content" class="modalContainer">
		<h1>Email:</h1>
		<div>
			<p>{email}</p>
			&nbsp;
			<div class="tooltip">
				<Tooltip tooltip={copied ? 'Copied' : 'Copy'}>
					<div
						id="clipboard"
						on:click={() => {
							copied = true;
							copy();
							setTimeout(() => {
								copied = false;
							}, 500);
						}}
					>
						<div>
							<FaCopy />
						</div>
					</div>
				</Tooltip>
			</div>
		</div>
		<Button>Send Email</Button>
	</div>
</Modal>
<Navbar segment={$page.url.pathname} />

<slot />

<footer>
	Created by <a class="me" href="/about">Ladvace</a> ❤️ with
	<span class="svelte">Svelte</span>
</footer>

<style>
	* {
		box-sizing: border-box;
	}

	:global(#svelte) {
		width: 100vw;
		height: 100%;
		max-width: 900px;

		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	:global(html),
	:global(body) {
		position: relative;
		width: 100%;
		height: 100%;
		overflow: auto;
		font-family: 'Fira Code', monospace;
		font-display: optional;
	}

	:global(body) {
		/* background-color: #09090b; */
		background-color: #0a0908;
		background-size: 200% 200%;
		color: white;
		margin: 0;
		box-sizing: border-box;
		display: grid;
		line-height: 1.75;
		place-items: center;
		height: 100%;
		overflow-x: hidden;
	}

	:global(h1) {
		border: 0;
	}

	:global(::selection) {
		color: white;
		background: #ca3c25;
	}

	:global(::-webkit-scrollbar) {
		width: 8px;
		height: 8px;
		border-radius: 1px;
	}

	:global(::-webkit-scrollbar-thumb) {
		background-color: #fafffd;
		border-radius: 3px;
	}

	:global(::-webkit-scrollbar-track) {
		background-color: transparent;
		border-radius: 1px;
	}

	@media (min-width: 900px) {
		:global(body) {
			padding: 0 100px;
		}
	}

	:global(a) {
		text-decoration: none;
	}

	:global(a) {
		text-decoration: none;
	}

	a {
		color: rgb(0, 100, 200);
		text-decoration: none;
	}

	a:hover {
		text-decoration: underline;
	}

	a:visited {
		color: rgb(0, 80, 160);
	}

	.modalContainer div {
		display: flex;
		margin-bottom: 20px;
	}

	.modalContainer p {
		margin: 0;
	}

	:global(.tooltip) {
		visibility: hidden;
	}

	.cookieContainer {
		background: white;
		border-radius: 0px;
		text-align: center;
		width: 100%;
		height: 30px;
		color: black;
		padding: 30px;
		display: flex;
		justify-content: space-evenly;
		align-items: center;
		position: fixed;
		bottom: 0px;
		left: 0;
		right: 0;
		margin-left: auto;
		margin-right: auto;
	}
	.cookieContainer > p > a {
		text-decoration: underline;
	}

	.cookieContainer > div {
		cursor: pointer;
	}

	footer {
		font-size: 16px;
		font-weight: 400;
		padding: 30px 0;
		max-width: 900px;
		text-align: center;
		width: 100%;
	}

	footer a {
		text-decoration: none;
		color: #4158d0;
	}
	footer .svelte {
		color: #ff3e00;
	}

	footer .me {
		color: #ca3c25;
	}

	@media (min-width: 900px) {
		:global(.tooltip) {
			visibility: visible;
		}
	}
	@media (min-width: 600px) {
		.cookieContainer {
			background: white;
			border-radius: 50px;
			text-align: center;
			width: 350px;
			height: 30px;
			color: black;
			padding: 0 10px;
			display: flex;
			justify-content: space-evenly;
			align-items: center;
			position: fixed;
			bottom: 50px;
			left: 0;
			right: 0;
			margin-left: auto;
			margin-right: auto;
		}
	}
</style>
