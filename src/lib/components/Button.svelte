<script>
	import { goto } from '$app/navigation';
</script>

<div class="button" on:click={() => goto('mailto:cavallogianmarco@gmail.com')}>
	<slot />
</div>

<style>
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

	.button {
		cursor: pointer;
		height: 40px;
		max-width: 200px;
		border-radius: 10px;
		background: linear-gradient(43deg, #4158d0 0%, #c850c0 46%, #ffcc70 100%);

		background-size: 150% 150%;

		display: flex;
		justify-content: center;
		align-items: center;
		font-weight: 500;
	}

	.button:hover {
		animation: gradient 2s ease infinite;
	}
</style>
