import { UserInfoEndpoint } from '$lib/Constants';
export async function load({ fetch }) {
	let devToArticles;
	try {
		devToArticles = await fetch(`${UserInfoEndpoint}ladvace`);

		devToArticles = await devToArticles.json();
	} catch (e) {
		// console.error(e);
	}

	return {
		devToArticles
	};
}
