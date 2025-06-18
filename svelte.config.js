import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

const config = {
  kit: {
    adapter: adapter()
  },
  preprocess: preprocess()
};

export default config;
