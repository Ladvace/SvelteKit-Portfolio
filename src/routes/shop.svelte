<svelte:head>
	<title>Gianmarco Cavallo — Shop</title>
	<!-- Global site tag (gtag.js) - Google Analytics -->
	<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
	<script>
		window.dataLayer = window.dataLayer || [];
		function gtag() {
			window.dataLayer.push(arguments);
		}
		gtag('js', new Date());

		gtag('config', 'G-B4HJHY6RC4');
	</script>
</svelte:head>

<div class="shopContainer">
	<script src="https://gumroad.com/js/gumroad.js"></script>
	<a class="gumroad-button" href="https://gumroad.com/l/XdDuL">Portfolio template in svelte</a>
</div>

<style>
	.shopContainer {
		width: 100%;
		max-width: 900px;
		display: flex;
		justify-content: center;
		align-items: center;
		box-sizing: border-box;
		text-align: center;
		padding: 1em;
		margin: 0 auto;
	}
</style>
