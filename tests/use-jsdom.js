import { JSDOM } from 'jsdom';
import { setup } from '../dist/setup.js';
setup(JSDOM);
export default JSDOM;
