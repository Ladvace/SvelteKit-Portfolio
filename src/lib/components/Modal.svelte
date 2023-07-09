<script>
	import { modalOpened } from '$lib/store';
	let isOpen = false;
	let closing = false;

	modalOpened.subscribe((value) => {
		closing = false;
		isOpen = value;
	});

	const close = () => {
		closing = true;
		setTimeout(() => {
			modalOpened.set(false);
		}, 300);
	};
</script>

{#if isOpen}
	<div class={`modal ${closing && 'closing'}`}>
		<div class="backdrop" on:click={close} role="button" tabindex="0" on:keypress={close} />
		<div class="content-wrapper">
			<div class="content">
				<slot name="content" />
			</div>
		</div>
	</div>
{/if}

<style>
	.modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100vh;
		z-index: 2000;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	@keyframes slidein {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.backdrop {
		position: absolute;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		-webkit-backdrop-filter: blur(5px);
		backdrop-filter: blur(5px);
		animation: slidein 0.3s ease-in-out;
	}

	@keyframes openModalAnimation {
		from {
			opacity: 0;
			transform: scale(0);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.content-wrapper {
		z-index: 10;
		max-width: 70vw;
		border-radius: 0.3rem;
		overflow: hidden;
		padding: 30px;
		border-radius: 25px;
		background: linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);
		-webkit-backdrop-filter: blur(20px);
		backdrop-filter: blur(20px);
		box-shadow: 2px 4px 6px rgba(0, 0, 0, 0.1), inset 0 0 0 2px rgba(255, 255, 255, 0.1);
		animation: openModalAnimation 0.3s ease-in-out;
	}

	@keyframes slideOut {
		from {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@keyframes closeModalAnimation {
		from {
			opacity: 1;
			transform: scale(1);
		}
		to {
			opacity: 0;
			transform: scale(0);
		}
	}

	.closing .backdrop {
		animation: slideOut 0.3s ease-in-out;
	}
	.closing .content-wrapper {
		animation: closeModalAnimation 0.3s ease-in-out;
	}

	.content {
		max-height: 50vh;
		overflow: hidden;
	}

	@media (min-width: 900px) {
		.content-wrapper {
			padding: 50px;
			min-width: 400px;
		}
	}
</style>
