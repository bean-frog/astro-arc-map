# astro-arc-map

---

Digital mind map of prior knowledge of astronomy concepts from the UOregon Astro ARC (Fall 2025)

some notes:
- `/data-entry` contains some scripts to create the data structures from a physical medium.
- `data-entry.js` creates the entire data array with every person
- `single-person.js` creates only the inner object for a single person, in the `./output` directory
- `merge.js` takes a directory (containing output files from `single-person.js`) and combines them into one large data object.
- don't directly edit `style.css` as it is dynamically built and minified by Tailwind.

Licensed under the MIT License, as follows: 
```
Copyright 2025 beanfrog / Graeme Kieran

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
