import netlify from '@sveltejs/adapter-netlify';

export default {
	kit: {
		adapter: netlify(), // currently the adapter does not take any options
		target: '#svelte'
	}
};
