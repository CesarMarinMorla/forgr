import hljs from 'highlight.js/lib/core';

import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import lua from 'highlight.js/lib/languages/lua';
import r from 'highlight.js/lib/languages/r';

import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import swift from 'highlight.js/lib/languages/swift';

import java from 'highlight.js/lib/languages/java';
import kotlin from 'highlight.js/lib/languages/kotlin';
import scala from 'highlight.js/lib/languages/scala';
import csharp from 'highlight.js/lib/languages/csharp';

import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import powershell from 'highlight.js/lib/languages/powershell';
import vbscript from 'highlight.js/lib/languages/vbscript';
import nix from 'highlight.js/lib/languages/nix';

import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import xml from 'highlight.js/lib/languages/xml';
import ini from 'highlight.js/lib/languages/ini';
import diff from 'highlight.js/lib/languages/diff';

import css from 'highlight.js/lib/languages/css';
import markdown from 'highlight.js/lib/languages/markdown';
import plaintext from 'highlight.js/lib/languages/plaintext';

import sql from 'highlight.js/lib/languages/sql';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import nginx from 'highlight.js/lib/languages/nginx';
import apache from 'highlight.js/lib/languages/apache';
import makefile from 'highlight.js/lib/languages/makefile';

import graphql from 'highlight.js/lib/languages/graphql';
import protobuf from 'highlight.js/lib/languages/protobuf';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rb', ruby);
hljs.registerLanguage('php', php);
hljs.registerLanguage('lua', lua);
hljs.registerLanguage('r', r);

hljs.registerLanguage('c', c);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('swift', swift);

hljs.registerLanguage('java', java);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('scala', scala);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);

hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('shell', shell);
hljs.registerLanguage('powershell', powershell);
hljs.registerLanguage('ps1', powershell);
hljs.registerLanguage('vbscript', vbscript);
hljs.registerLanguage('nix', nix);

hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('ini', ini);
hljs.registerLanguage('toml', ini);
hljs.registerLanguage('diff', diff);
hljs.registerLanguage('patch', diff);

hljs.registerLanguage('css', css);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('text', plaintext);
hljs.registerLanguage('tree', plaintext);

hljs.registerLanguage('sql', sql);
hljs.registerLanguage('dockerfile', dockerfile);
hljs.registerLanguage('nginx', nginx);
hljs.registerLanguage('apache', apache);
hljs.registerLanguage('makefile', makefile);
hljs.registerLanguage('make', makefile);

hljs.registerLanguage('graphql', graphql);
hljs.registerLanguage('gql', graphql);
hljs.registerLanguage('protobuf', protobuf);
hljs.registerLanguage('proto', protobuf);

export default hljs;
