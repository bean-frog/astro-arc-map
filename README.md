# astro-arc-map

---

Digital mind map of prior knowledge of astronomy concepts from the UOregon Astro ARC (Fall 2025)

### Dev Info
- Styled with Tailwind + DaisyUI. Use `npm run tw` to automatically detect changes and rebuild the css.
- Use `npm run fmt` to format with Prettier.

### Data Entry Scripts
Both can be run with `node script.js` or `./script.js`
- `single-person.js`
	- Enter the person's name as prompted, then enter all connections in the form 'NodeA-NodeB'
	- Enter 'done' when finished, will save as `./output/Name.json`
- `merge.js <directory>`
	- takes a directory to JSON files (e.g. `./output`) and consolidates them into a single javascript file that sets `window.mapData`. Just update the reference in `index.html`, or copy the contents to `./data.js`.
	


Licensed under the MIT License, as follows: 
```
Copyright 2025 beanfrog / Graeme Kieran

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
