import adapter from '@sveltejs/adapter-static';
import preprocess from 'svelte-preprocess';

const config = {
  preprocess: preprocess(),

  kit: {
    adapter: adapter({
      strict: false 
    }),
    alias: {
      $lib: 'src/lib'
    }
  }
};

export default config;
