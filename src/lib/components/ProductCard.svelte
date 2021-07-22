<script>
	import Button from './Button.svelte';
	import commerce from '$lib/commerce.js';

	export let product;
	console.log(product);
	const image = product.assets[0].url;

	const checkOut = async () => {
		await commerce.cart.add(product.id, 5);
		const cardId = await commerce.cart.id();

		const token = await commerce.checkout.generateToken(product.permalink, { type: 'permalink' });

		console.log('token', product, token);

		commerce.checkout
			.capture(token.id, {
				line_items: {
					[product.id]: {
						quantity: 1,
						selected_options: {
							vgrp_p6dP5g0M4ln7kA: 'optn_DeN1ql93doz3ym'
						}
					}
					// item_7RyWOwmK5nEa2V: {
					// 	quantity: 1,
					// 	selected_options: {
					// 		vgrp_p6dP5g0M4ln7kA: 'optn_DeN1ql93doz3ym'
					// 	}
					// }
				},
				customer: {
					firstname: 'John',
					lastname: 'Doe',
					email: 'john.doe@example.com'
				},
				billing: {
					name: 'John Doe',
					street: '234 Fake St',
					town_city: 'San Francisco',
					county_state: 'US-CA',
					postal_zip_code: '94103',
					country: 'US'
				},
				payment: {
					gateway: 'paypal',
					card: {
						token
						// token: 'irh98298g49'
					}
				},
				pay_what_you_want: '149.99'
			})
			.then((response) => console.log(response));
	};
</script>

<article class="container">
	<div>
		<img src={image} alt="productImage" />
		<a rel="prefetch" href="/shop/{product.permalink}">
			<h4>{product.name}</h4>
		</a>
		<var>{product.price.formatted}<abbr title="EUR">€</abbr></var>
		{#if product.assets[0].description}
			<p>{product.assets[0].description}</p>
		{/if}
	</div>

	<!-- <div class="row"> -->
	<!-- <Button class="button" >Add to Card</Button> -->
	<Button class="button" onclick={() => checkOut()}>Purchase</Button>
	<!-- </div> -->
</article>

<style>
	.container {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		width: 300px;
		height: 400px;
		padding: 30px 10px;
		border-radius: 25px;
		background: linear-gradient(155deg, rgba(255, 255, 255, 0.15), transparent);
		-webkit-backdrop-filter: blur(20px);
		backdrop-filter: blur(20px);
		-webkit-animation: cardWobble 10000ms infinite;
		animation: cardWobble 10000ms infinite;
		box-shadow: 2px 4px 6px rgba(0, 0, 0, 0.1), inset 0 0 0 2px rgba(255, 255, 255, 0.1);
	}

	a {
		color: white;
	}

	h4 {
		margin: 10px 0;
	}

	var {
		margin-bottom: 5px;
	}

	.container img {
		max-width: 200px;
		border-radius: 10px;
	}

	.row {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* :global(.button) {
		margin-bottom: 10px;
		width: 200px;
	} */
</style>
