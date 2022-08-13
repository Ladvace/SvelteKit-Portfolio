// vite.config.js
import { sveltekit } from '@sveltejs/kit/vite';
// import adapter from '@sveltejs/adapter-netlify';

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [sveltekit()]
};

export default config;
