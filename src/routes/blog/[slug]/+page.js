import { ArticleEndPoint } from '$lib/Constants';

export async function load({ params, fetch }) {
	let response = await fetch(`${ArticleEndPoint}/${params.slug}`);
	return {
		article: response.ok && (await response.json())
	};
}
