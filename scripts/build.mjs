// Assembles the standalone page (index.html) from the parts in src/.
// Usage: node scripts/build.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const head = read('src/head.html');
const body = read('src/body.html');
const engine = read('src/engine.js');
const ui = read('src/ui.js');

for (const [name, text] of [['engine.js', engine], ['ui.js', ui]]) {
  if (text.includes('</script>')) throw new Error(`${name} contains "</script>" and cannot be inlined`);
}

// Base styles that the claude.ai artifact host normally supplies around the page.
const reset = '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui,-apple-system,"Segoe UI",sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>';

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${reset}
${head}
</head>
<body>
${body}
<script>
${engine}
</script>
<script>
${ui}
</script>
</body>
</html>
`;
writeFileSync(join(root, 'index.html'), page);
console.log(`index.html written (${page.length.toLocaleString('en-US')} characters)`);
