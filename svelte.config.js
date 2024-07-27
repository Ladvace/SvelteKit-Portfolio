import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-netlify';

export default {
  preprocess: [vitePreprocess()],
  kit: {
	adapter: adapter()
	}
};