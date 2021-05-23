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

	const copy = () => {
		const app = new CopyClipBoard({
			target: document.getElementById('clipboard'),
			props: { email }
		});
		app.$destroy();
	};
</script>

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
<Navbar segment={$page.path} />

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
	}

	@keyframes gradient {
		0% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
		100% {
			background-position: 0% 50%;
		}
	}

	:global(body) {
		/* background-color: #09090b; */

		/* background: #0052d4;
		background: -webkit-linear-gradient(to right, #6fb1fc, #4364f7, #0052d4);
		background: linear-gradient(to right, #6fb1fc, #4364f7, #0052d4); */

		background: #dc2424; /* fallback for old browsers */
		background: -webkit-linear-gradient(
			to right,
			#4a569d,
			#dc2424
		); /* Chrome 10-25, Safari 5.1-6 */
		background: linear-gradient(
			to right,
			#4a569d,
			#dc2424
		); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */

		background-size: 200% 200%;
		animation: gradient 10s ease infinite;
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
		background: #f3a712;
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

	footer {
		font-size: 16px;
		font-weight: 400;
		padding: 10px 0;
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
		color: #f3a712;
	}

	@media (min-width: 900px) {
		:global(.tooltip) {
			visibility: visible;
		}
	}
</style>
