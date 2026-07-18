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

const LANGUAGES = [
  { module: javascript, names: ['javascript', 'js'] },
  { module: typescript, names: ['typescript', 'ts'] },
  { module: python, names: ['python'] },
  { module: ruby, names: ['ruby', 'rb'] },
  { module: php, names: ['php'] },
  { module: lua, names: ['lua'] },
  { module: r, names: ['r'] },
  { module: c, names: ['c'] },
  { module: cpp, names: ['cpp'] },
  { module: rust, names: ['rust'] },
  { module: go, names: ['go'] },
  { module: swift, names: ['swift'] },
  { module: java, names: ['java'] },
  { module: kotlin, names: ['kotlin'] },
  { module: scala, names: ['scala'] },
  { module: csharp, names: ['csharp', 'cs'] },
  { module: bash, names: ['bash', 'sh'] },
  { module: shell, names: ['shell'] },
  { module: powershell, names: ['powershell', 'ps1'] },
  { module: vbscript, names: ['vbscript'] },
  { module: nix, names: ['nix'] },
  { module: json, names: ['json'] },
  { module: yaml, names: ['yaml', 'yml'] },
  { module: xml, names: ['xml', 'html'] },
  { module: ini, names: ['ini', 'toml'] },
  { module: diff, names: ['diff', 'patch'] },
  { module: css, names: ['css'] },
  { module: markdown, names: ['markdown', 'md'] },
  { module: plaintext, names: ['plaintext', 'text', 'tree'] },
  { module: sql, names: ['sql'] },
  { module: dockerfile, names: ['dockerfile'] },
  { module: nginx, names: ['nginx'] },
  { module: apache, names: ['apache'] },
  { module: makefile, names: ['makefile', 'make'] },
  { module: graphql, names: ['graphql', 'gql'] },
  { module: protobuf, names: ['protobuf', 'proto'] },
];

for (const { module, names } of LANGUAGES) {
  for (const name of names) {
    hljs.registerLanguage(name, module);
  }
}

export default hljs;
