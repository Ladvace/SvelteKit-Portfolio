import { UserInfoEndpoint } from '$lib/Constants';
import { error } from '@sveltejs/kit';

export async function load({ fetch }) {
	let devToArticles;
	try {
		devToArticles = await fetch(`${UserInfoEndpoint}ladvace`);

		devToArticles = await devToArticles.json();
	} catch (e) {
		throw error(404, 'Not found');
	}

	return {
		devToArticles
	};
}
