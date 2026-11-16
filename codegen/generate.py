#!/usr/bin/env python3
"""Generate the SDK methods for every API operation that has no hand-written method.

The same file lives in both SDK repos (upload-post-npm and upload-post-pip) and
writes only the target of the repo it runs in:

    python3 codegen/generate.py           # rewrite the generated regions
    python3 codegen/generate.py --check   # exit 1 if they are out of date

Inputs, both in codegen/:

- openapi.json: copy of the API spec (the backend's openapi/openapi.json, also
  published at https://docs.upload-post.com/openapi.json).
- sdk-map.json: what is not generated.
    existing:  operationId -> name of the hand-written method that covers it.
    excluded:  operationId -> why the SDK leaves it out.
    names:     operationId -> method name, when the default one is not wanted.
    overrides: operationId -> {"auth": "apikey", "path": "..."} where the spec is
               known to be wrong (say why in "why").

Every other operation gets a method named after its operationId (npm: as is,
with the SDK's spelling of LinkedIn/AutoDM/OAuth...; pip: in snake_case). The
methods only describe the operation; the request is built at run time by
_op() from the operation table written next to them.

Standard library only.
"""

import json
import keyword
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TARGET = 'npm' if os.path.exists(os.path.join(ROOT, 'package.json')) else 'pip'
VERBS = ('get', 'post', 'put', 'patch', 'delete')
API_PREFIX = '/api'
# The SDK spells these words this way in its method names.
SPELLING = [('LinkedIn', 'Linkedin'), ('AutoDM', 'Autodm'), ('OAuth', 'Oauth'),
            ('WordPress', 'Wordpress'), ('DevTo', 'Devto'), ('YouTube', 'Youtube')]
FILE_TYPES = ('application/octet-stream', 'image/', 'video/', 'audio/', 'application/pdf', 'application/zip')


def load(name):
    with open(os.path.join(ROOT, 'codegen', name), encoding='utf-8') as fh:
        return json.load(fh)


SPEC = load('openapi.json')
MAP = load('sdk-map.json')


def resolve(node, seen=()):
    while isinstance(node, dict) and '$ref' in node:
        ref = node['$ref']
        if ref in seen:
            return {}
        seen = seen + (ref,)
        target = SPEC
        for part in ref[2:].split('/'):
            target = target[part]
        node = target
    return node


def merged_props(schema):
    schema = resolve(schema)
    props, required = {}, list(schema.get('required', []))
    for sub in schema.get('allOf', []):
        p, r = merged_props(sub)
        props.update(p)
        required += r
    props.update(schema.get('properties', {}))
    return props, required


def is_binary(schema):
    schema = resolve(schema)
    if schema.get('format') == 'binary':
        return True
    return schema.get('type') == 'array' and resolve(schema.get('items', {})).get('format') == 'binary'


def first_paragraphs(text, limit=700):
    text = (text or '').strip()
    paras = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]
    na = ''
    if paras and paras[0].startswith('**Not generally available yet.**'):
        na = paras.pop(0)
    body = paras[0] if paras else ''
    if len(body) > limit:
        cut = body[:limit]
        end = max(cut.rfind('. '), cut.rfind('.\n'))
        body = cut[:end + 1] if end > 200 else cut.rstrip() + '...'
    return na, body


def one_line(text, limit=220):
    text = ' '.join((text or '').split())
    if len(text) > limit:
        cut = text[:limit]
        end = cut.rfind('. ')
        text = cut[:end + 1] if end > 60 else cut.rstrip() + '...'
    return text


def sdk_js_name(op_id):
    name = op_id
    for a, b in SPELLING:
        name = name.replace(a, b)
    return name


def snake(name):
    return re.sub(r'(?<=[a-z0-9])(?=[A-Z])', '_', name).lower()


def camel(name):
    if not re.fullmatch(r'[a-z][a-z0-9]*(_[a-z0-9]+)+', name):
        return name
    head, *rest = name.split('_')
    return head + ''.join(w[:1].upper() + w[1:] for w in rest)


def operations():
    """Every operation of the spec, in spec order."""
    tag_order = {t['name']: i for i, t in enumerate(SPEC.get('tags', []))}
    ops = []
    for path, item in SPEC['paths'].items():
        for verb in VERBS:
            if verb not in item:
                continue
            op = item[verb]
            params = [resolve(p) for p in item.get('parameters', []) + op.get('parameters', [])]
            path_params = re.findall(r'\{(\w+)\}', path)
            query = [p for p in params if p.get('in') == 'query']
            content = op.get('requestBody', {}).get('content', {})
            body_props, required_sets, files = {}, [], []
            for ctype in sorted(content, key=lambda c: c != 'application/json'):
                props, required = merged_props(content[ctype].get('schema', {}))
                for k, v in props.items():
                    body_props.setdefault(k, v)
                    if is_binary(v) and k not in files:
                        files.append(k)
                required_sets.append(set(required))
            body_required = set.intersection(*required_sets) if required_sets else set()
            security = op.get('security')
            bearer = security == [{'BearerAuth': []}]
            raw = None
            ok = op.get('responses', {}).get('200') or op.get('responses', {}).get('201') or {}
            ok_types = list(resolve(ok).get('content', {}))
            if ok_types and 'application/json' not in ok_types:
                raw = 'text' if all(t.startswith('text/') for t in ok_types) else 'binary'
            ops.append({
                'id': op['operationId'], 'verb': verb.upper(), 'path': path, 'tag': op.get('tags', ['Other'])[0],
                'summary': op.get('summary', ''), 'description': op.get('description', ''),
                'na': op.get('x-availability') == 'not_generally_available',
                'deprecated': bool(op.get('deprecated')), 'bearer': bearer,
                'path_params': path_params, 'query': query, 'body': body_props,
                'body_required': [k for k in body_props if k in body_required],
                'files': files, 'multipart_only': bool(content) and 'application/json' not in content,
                'has_body': bool(content), 'raw': raw, 'order': (tag_order.get(op.get('tags', [''])[0], 999),),
                'ok_schema': resolve(ok).get('content', {}).get('application/json', {}).get('schema'),
            })
    return ops


def generated_ops():
    existing, excluded = MAP.get('existing', {}), MAP.get('excluded', {})
    ids = {o['id'] for o in operations()}
    stale = sorted((set(existing) | set(excluded) | set(MAP.get('names', {})) | set(MAP.get('overrides', {}))) - ids)
    if stale:
        sys.exit(f'sdk-map.json names operations that are not in the spec: {", ".join(stale)}')
    out = []
    for op in operations():
        if op['id'] in existing or op['id'] in excluded:
            continue
        override = MAP.get('overrides', {}).get(op['id'], {})
        if override.get('auth') == 'apikey':
            op['bearer'] = False
        if override.get('path'):
            op['path'] = override['path']
        js = MAP.get('names', {}).get(op['id']) or sdk_js_name(op['id'])
        op['js'] = js
        op['py'] = snake(js)
        op['required'] = list(dict.fromkeys(
            op['path_params'] + [q['name'] for q in op['query'] if q.get('required')] + op['body_required']))
        out.append(op)
    out.sort(key=lambda o: o['order'])
    return out


# ---------------------------------------------------------------- shared text

def field_docs(op):
    """(api name, schema, description, required) for every documented field."""
    rows = []
    seen = set()
    for name in op['path_params']:
        p = next((q for q in resolve_params(op) if q.get('name') == name), {})
        rows.append((name, resolve(p.get('schema', {'type': 'string'})), p.get('description', ''), True))
        seen.add(name)
    for q in op['query']:
        if q['name'] in seen:
            continue
        rows.append((q['name'], resolve(q.get('schema', {})), q.get('description', ''), bool(q.get('required'))))
        seen.add(q['name'])
    for name, schema in op['body'].items():
        if name in seen:
            continue
        schema = resolve(schema)
        rows.append((name, schema, schema.get('description', ''), name in op['body_required']))
        seen.add(name)
    return rows


def resolve_params(op):
    item = SPEC['paths'].get(op['path']) or {}
    verb = item.get(op['verb'].lower(), {})
    return [resolve(p) for p in item.get('parameters', []) + verb.get('parameters', [])]


def endpoint(op):
    return f'{op["verb"]} {API_PREFIX}{op["path"]}'


def availability_note(op):
    na, _ = first_paragraphs(op['description'])
    if not op['na']:
        return ''
    return na or '**Not generally available yet.** The API answers HTTP 503 until it is switched on.'


# --------------------------------------------------------------------- npm

def ts_type(schema, depth=0, open_enums=False):
    """TypeScript type of a schema. open_enums: also accept any other string (the
    API can take values the spec does not list yet), keeping the listed ones for
    autocompletion."""
    schema = resolve(schema)
    if not schema:
        return 'any'
    for key in ('oneOf', 'anyOf'):
        if key in schema:
            types = list(dict.fromkeys(ts_type(s, depth, open_enums) for s in schema[key]))
            return ' | '.join(types) if types else 'any'
    if 'enum' in schema and schema.get('type') in (None, 'string', 'integer', 'number'):
        vals = [json.dumps(v) if isinstance(v, str) else str(v) for v in schema['enum'] if v is not None]
        if vals:
            if open_enums and schema.get('type') in (None, 'string'):
                vals.append('(string & {})')
            return ' | '.join(vals)
    t = schema.get('type')
    if isinstance(t, list):
        return ' | '.join(dict.fromkeys(ts_type(dict(schema, type=x), depth, open_enums) for x in t if x != 'null')) or 'any'
    if schema.get('format') == 'binary':
        return 'string | Buffer | NodeJS.ReadableStream'
    if t == 'string':
        return 'string'
    if t in ('integer', 'number'):
        return 'number'
    if t == 'boolean':
        return 'boolean'
    if t == 'array':
        inner = ts_type(schema.get('items', {}), depth, open_enums)
        return f'({inner})[]' if ' ' in inner else f'{inner}[]'
    props, required = merged_props(schema)
    if (t == 'object' or props) and props and depth < 2:
        parts = []
        for k, v in props.items():
            key = k if re.fullmatch(r'[A-Za-z_$][\w$]*', k) else json.dumps(k)
            parts.append(f'{key}{"" if k in required else "?"}: {ts_type(v, depth + 1, open_enums)}')
        return '{ ' + '; '.join(parts) + '; [key: string]: any }'
    if t == 'object' or props:
        return 'Record<string, any>'
    return 'any'


def js_comment(text, indent):
    text = text.replace('*/', '*\\/')
    out = []
    for line in text.split('\n'):
        out.append(f'{indent} *{" " + line if line else ""}'.rstrip())
    return '\n'.join(out)


def pascal(name):
    return name[:1].upper() + name[1:]


def ts_key(name):
    key = camel(name)
    return key if re.fullmatch(r'[A-Za-z_$][\w$]*', key) else json.dumps(key)


def npm_options_type(op):
    return f'{pascal(op["js"])}Options'


def npm_response_type(op):
    return f'{pascal(op["js"])}Response'


def npm_doc(op, indent):
    lines = [op['summary'].rstrip('.') + '.']
    note = availability_note(op)
    if note:
        lines += ['', note]
    _, desc = first_paragraphs(op['description'])
    if desc and desc != op['summary']:
        lines += ['', desc]
    lines += ['', f'`{endpoint(op)}`']
    if op['bearer']:
        lines += ['Authenticated with the profile JWT (`token`), not the API key.']
    lines.append(f'@param {{{npm_options_type(op)}}} {"options" if op["required"] or op["bearer"] else "[options]"}')
    if op['raw'] == 'binary':
        lines.append('@returns {Promise<Buffer>} The file')
    elif op['raw'] == 'text':
        lines.append('@returns {Promise<string>} The file')
    else:
        lines.append('@returns {Promise<Object>}')
    if op['deprecated']:
        lines.append('@deprecated')
    return f'{indent}/**\n' + js_comment('\n'.join(lines), indent) + f'\n{indent} */\n'


def npm_methods(ops):
    out = []
    tag = None
    for op in ops:
        if op['tag'] != tag:
            tag = op['tag']
            out.append(f'  // ---- {tag} ----\n')
        out.append(npm_doc(op, '  '))
        out.append(f'  async {op["js"]}(options = {{}}) {{\n'
                   f"    return this._op('{op['js']}', options);\n  }}\n\n")
    return ''.join(out)


def npm_table(ops):
    rows = []
    for op in ops:
        meta = {}
        q = [p['name'] for p in op['query']]
        if q:
            meta['q'] = q
        b = [k for k in op['body'] if k not in op['path_params']]
        if b:
            meta['b'] = b
        if op['files']:
            meta['f'] = op['files']
        if op['multipart_only']:
            meta['mp'] = 1
        if op['bearer']:
            meta['bearer'] = 1
        if op['raw']:
            meta['raw'] = op['raw']
        if op['na']:
            meta['na'] = 1
        rows.append(f'  {op["js"]}: [{json.dumps(op["verb"])}, {json.dumps(op["path"])}, {json.dumps(meta)}],\n')
    return 'UploadPost.OPENAPI_OPERATIONS = {\n' + ''.join(rows) + '};\n'


def npm_types(ops):
    out = []
    for op in ops:
        fields = field_docs(op)
        body = []
        if op['bearer']:
            body.append('    /** Profile JWT (from generateJwt), sent as `Authorization: Bearer`. */\n    token: string;\n')
        for name, schema, desc, required in fields:
            doc = one_line(desc)
            if doc:
                body.append(f'    /** {doc.replace("*/", "*\\/")} */\n')
            body.append(f'    {ts_key(name)}{"" if required else "?"}: {ts_type(schema, open_enums=True)};\n')
        out.append(f'  /** Options of `{op["js"]}` (`{endpoint(op)}`). Any other API field is sent as well. */\n'
                   f'  export interface {npm_options_type(op)} extends ApiParams {{\n' + ''.join(body) + '  }\n\n')
        schema = resolve(op['ok_schema'] or {})
        props, required = merged_props(schema) if schema else ({}, [])
        if props and not op['raw']:
            rbody = []
            for k, v in props.items():
                doc = one_line(resolve(v).get('description', ''))
                if doc:
                    rbody.append(f'    /** {doc.replace("*/", "*\\/")} */\n')
                key = k if re.fullmatch(r'[A-Za-z_$][\w$]*', k) else json.dumps(k)
                rbody.append(f'    {key}?: {ts_type(v)};\n')
            out.append(f'  /** Answer of `{op["js"]}`. */\n'
                       f'  export interface {npm_response_type(op)} extends ApiResponse {{\n' + ''.join(rbody) + '  }\n\n')
            op['_rtype'] = npm_response_type(op)
    return ''.join(out)


def npm_decls(ops):
    out = []
    tag = None
    for op in ops:
        if op['tag'] != tag:
            tag = op['tag']
            out.append(f'    // ---- {tag} ----\n\n')
        doc = npm_doc(op, '    ')
        doc = re.sub(r'\n {4} \* @param \{[^}]+\} \[?options\]?', '', doc)
        doc = re.sub(r'\n {4} \* @returns [^\n]*', '', doc)
        optional = not (op['required'] or op['bearer'])
        ret = 'Buffer' if op['raw'] == 'binary' else 'string' if op['raw'] == 'text' else op.get('_rtype', 'ApiResponse')
        out.append(doc + f'    {op["js"]}(options{"?" if optional else ""}: {npm_options_type(op)}): Promise<{ret}>;\n\n')
    return ''.join(out)


# --------------------------------------------------------------------- pip

def py_type(schema):
    schema = resolve(schema)
    if schema.get('format') == 'binary':
        return 'Any'
    t = schema.get('type')
    if isinstance(t, list):
        t = next((x for x in t if x != 'null'), None)
    if t == 'array':
        inner = py_type(schema.get('items', {}))
        return f'List[{inner}]'
    return {'string': 'str', 'integer': 'int', 'number': 'float', 'boolean': 'bool',
            'object': 'Dict[str, Any]'}.get(t, 'Any')


def py_ident(name):
    return (re.fullmatch(r'[A-Za-z_]\w*', name) and not keyword.iskeyword(name)
            and name not in ('self', 'params', 'token'))


def py_text(text):
    return text.replace('\\', '\\\\').replace('"""', "'''")


def py_wrap(text, indent, width=88):
    words, lines, line = text.split(), [], ''
    for w in words:
        if line and len(indent) + len(line) + 1 + len(w) > width:
            lines.append(line)
            line = w
        else:
            line = f'{line} {w}' if line else w
    if line:
        lines.append(line)
    return '\n'.join(indent + x for x in lines)


def pip_methods(ops):
    out = []
    tag = None
    for op in ops:
        if op['tag'] != tag:
            tag = op['tag']
            out.append(f'    # ---- {tag} ----\n')
        fields = field_docs(op)
        positional = [n for n in op['required'] if py_ident(n)]
        types = {n: py_type(s) for n, s, _, _ in fields}
        sig = ''.join(f', {n}: {types.get(n, "str")}' for n in positional)
        if op['bearer']:
            sig = ', token: str' + sig
        ret = 'bytes' if op['raw'] == 'binary' else 'str' if op['raw'] == 'text' else 'Dict'
        doc = [py_text(op['summary'].rstrip('.') + '.')]
        note = availability_note(op)
        if note:
            doc += ['', py_wrap(py_text(note.replace('**', '')), '        ')]
        _, desc = first_paragraphs(op['description'])
        if desc and desc != op['summary']:
            doc += ['', py_wrap(py_text(desc), '        ')]
        doc += ['', f'        ``{endpoint(op)}``']
        if op['bearer']:
            doc.append('        Authenticated with the profile JWT (``token``), not the API key.')
        if op['raw']:
            doc.append(f'        Returns the file as {"bytes" if op["raw"] == "binary" else "text"}.')
        args = []
        if op['bearer']:
            args.append('            token: Profile JWT (from ``generate_jwt``), sent as ``Authorization: Bearer``.')
        for name, schema, desc, required in fields:
            label = name if name in positional else f'{name} ({py_type(schema)}, {"required" if required else "optional"})'
            line = f'{label}: {py_text(one_line(desc))}'.rstrip(': ').rstrip()
            wrapped = py_wrap(line, '                ').split('\n')
            args.append('\n'.join(['            ' + wrapped[0].strip()] + wrapped[1:]))
        if args:
            doc += ['', '        Args:'] + args
            doc.append('            **params: Any other API field, by its API name.')
        else:
            doc += ['', '        Any API field goes in ``**params`` by its API name.']
        if op['deprecated']:
            doc += ['', '        Deprecated.']
        docstr = doc[0] + '\n' + '\n'.join(doc[1:]) + '\n        '
        call_args = ''.join(f', {n}={n}' for n in positional)
        if op['bearer']:
            call_args = ', token=token' + call_args
        out.append(f'    def {op["py"]}(self{sig}, **params) -> {ret}:\n'
                   f'        """{docstr}"""\n'
                   f'        return self._op("{op["id"]}", params{call_args})\n\n')
    return ''.join(out)


def pip_table(ops):
    rows = []
    for op in ops:
        meta = {}
        q = [p['name'] for p in op['query']]
        if q:
            meta['q'] = q
        b = [k for k in op['body'] if k not in op['path_params']]
        if b:
            meta['b'] = b
        if op['files']:
            meta['f'] = op['files']
        if op['multipart_only']:
            meta['mp'] = True
        if op['bearer']:
            meta['bearer'] = True
        if op['raw']:
            meta['raw'] = op['raw']
        if op['na']:
            meta['na'] = True
        rows.append(f'        {json.dumps(op["id"])}: ({json.dumps(op["verb"])}, {json.dumps(op["path"])}, {pyrepr(meta)}),\n')
    return '    _OPENAPI_OPERATIONS = {\n' + ''.join(rows) + '    }\n'


def pyrepr(meta):
    return '{' + ', '.join(f'{json.dumps(k)}: {repr(v) if not isinstance(v, list) else "[" + ", ".join(json.dumps(x) for x in v) + "]"}'
                           for k, v in meta.items()) + '}'


# ------------------------------------------------------------------ README

def readme(ops, lang):
    out = ['Generated from the OpenAPI spec (`codegen/openapi.json`) by `codegen/generate.py`. ']
    if lang == 'npm':
        out.append('Each method takes one options object (camelCase or API names; any other API field is sent as well) '
                   'and its TypeScript type lists the fields.\n')
    else:
        out.append('Required fields are positional arguments; every other API field goes in `**params` by its API name.\n')
    out.append('Methods marked *not generally available* answer HTTP 503 until the feature is switched on for your account.\n')
    tag = None
    for op in ops:
        if op['tag'] != tag:
            tag = op['tag']
            level = '####' if lang == 'npm' else '###'
            out.append(f'\n{level} {tag}\n\n| Method | Endpoint | What it does |\n| :-- | :-- | :-- |\n')
        name = op['js'] if lang == 'npm' else op['py']
        note = ' *Not generally available.*' if op['na'] else ''
        if op['deprecated']:
            note += ' *Deprecated.*'
        summary = op['summary'].replace('|', '/').rstrip('.')
        out.append(f'| `{name}` | `{endpoint(op)}` | {summary}.{note} |\n')
    return ''.join(out)


# ------------------------------------------------------------------- write

def replace_region(text, start, end, content, filename):
    i, j = text.find(start), text.find(end)
    if i < 0 or j < 0 or j < i:
        sys.exit(f'{filename}: markers {start!r} / {end!r} not found')
    after_start = text.find('\n', i) + 1
    end_line = text.rfind('\n', 0, j) + 1
    if not content.endswith('\n'):
        content += '\n'
    return text[:after_start] + content + text[end_line:]


def check_names(ops, existing_names, attr):
    seen = {}
    for op in ops:
        n = op[attr]
        if n in existing_names:
            sys.exit(f'{op["id"]}: method name {n} is already taken by a hand-written method; '
                     f'add it to "names" in codegen/sdk-map.json')
        if n in seen:
            sys.exit(f'{op["id"]} and {seen[n]} both generate {n}')
        seen[n] = op['id']


def main():
    check = '--check' in sys.argv
    ops = generated_ops()
    files = {}
    if TARGET == 'npm':
        js_path, dts_path = os.path.join(ROOT, 'index.js'), os.path.join(ROOT, 'index.d.ts')
        js = open(js_path, encoding='utf-8').read()
        dts = open(dts_path, encoding='utf-8').read()
        outside = re.sub(r'// <openapi:methods>.*?// </openapi:methods>', '', js, flags=re.S)
        check_names(ops, set(re.findall(r'^  (?:async )?(\w+)\(', outside, flags=re.M)), 'js')
        types_outside = re.sub(r'// <openapi:types>.*?// </openapi:types>', '', dts, flags=re.S)
        taken = set(re.findall(r'export (?:interface|type) (\w+)', types_outside))
        clash = [n for op in ops for n in (npm_options_type(op), npm_response_type(op)) if n in taken]
        if clash:
            sys.exit(f'index.d.ts already declares {", ".join(clash)}; rename with "names" in codegen/sdk-map.json')
        js = replace_region(js, '// <openapi:methods>', '// </openapi:methods>', npm_methods(ops), 'index.js')
        js = replace_region(js, '// <openapi:operations>', '// </openapi:operations>', npm_table(ops), 'index.js')
        types = npm_types(ops)
        dts = replace_region(dts, '// <openapi:types>', '// </openapi:types>', types, 'index.d.ts')
        dts = replace_region(dts, '// <openapi:methods>', '// </openapi:methods>', npm_decls(ops), 'index.d.ts')
        files = {js_path: js, dts_path: dts}
    else:
        py_path = os.path.join(ROOT, 'upload_post', 'api_client.py')
        py = open(py_path, encoding='utf-8').read()
        outside = re.sub(r'# <openapi:methods>.*?# </openapi:methods>', '', py, flags=re.S)
        check_names(ops, set(re.findall(r'^    def (\w+)\(', outside, flags=re.M)), 'py')
        py = replace_region(py, '# <openapi:methods>', '# </openapi:methods>', pip_table(ops) + '\n' + pip_methods(ops), 'api_client.py')
        files = {py_path: py}
    readme_path = os.path.join(ROOT, 'README.md')
    text = open(readme_path, encoding='utf-8').read()
    files[readme_path] = replace_region(text, '<!-- openapi:methods -->', '<!-- /openapi:methods -->',
                                        readme(ops, TARGET), 'README.md')
    stale = []
    for path, content in files.items():
        current = open(path, encoding='utf-8').read()
        if current != content:
            stale.append(os.path.relpath(path, ROOT))
            if not check:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(content)
    if check and stale:
        sys.exit('Out of date with codegen/openapi.json: ' + ', '.join(stale) + '. Run: python3 codegen/generate.py')
    print(f'{TARGET}: {len(ops)} generated operations' + (' (up to date)' if not stale else f', wrote {", ".join(stale)}'))


if __name__ == '__main__':
    main()
