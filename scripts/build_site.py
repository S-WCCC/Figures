"""Validate the catalog and assemble a static image-only website (stdlib only)."""
from pathlib import Path
from urllib.parse import urlparse
import argparse,csv,json,re,shutil,sys

ROOT=Path(__file__).resolve().parents[1]
TYPES={'pipeline','architecture','framework','conceptual','comparison'}
EXTENSIONS={'.png','.jpg','.jpeg','.webp','.gif'}

def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))

def validate(root):
    figures=read_json(root/'data/figures.json')
    config=read_json(root/'data/config.json')
    collections=read_json(root/'data/collections.json')
    assert isinstance(figures,list) and figures,'Catalog must be a non-empty array'
    ids=set();images=set()
    for x in figures:
        ident=x['id']
        assert re.fullmatch(r'[a-z0-9][a-z0-9_-]*',ident),f'Invalid ID: {ident}'
        assert ident not in ids,f'Duplicate ID: {ident}'
        ids.add(ident)
        for key in ['title','authors','image','figure','venue']:
            assert isinstance(x.get(key),str) and x[key].strip(),f'{ident}: missing {key}'
        assert type(x.get('year')) is int and 1900<=x['year']<=2100,f'{ident}: invalid year'
        assert x.get('pattern') in TYPES,f'{ident}: invalid pattern'
        assert type(x.get('featured')) is bool,f'{ident}: featured must be boolean'
        assert type(x.get('rank')) is int and x['rank']>=1,f'{ident}: rank must be positive integer'
        path=Path(x['image'])
        assert not path.is_absolute() and path.parts[0]=='figures' and '..' not in path.parts,f'{ident}: invalid image path'
        target=(root/path).resolve()
        assert target.is_relative_to((root/'figures').resolve()),f'{ident}: image outside figures/'
        assert target.is_file() and target.suffix.lower() in EXTENSIONS,f'{ident}: missing/unsupported image'
        head=target.read_bytes()[:16]
        assert head.startswith((b'\x89PNG\r\n\x1a\n',b'\xff\xd8\xff',b'GIF87a',b'GIF89a')) or (head.startswith(b'RIFF') and head[8:12]==b'WEBP'),f'{ident}: invalid image signature'
        for key in ['paper','pdf','image_source']:
            if x.get(key):assert urlparse(x[key]).scheme in {'http','https'} and urlparse(x[key]).netloc,f'{ident}: invalid URL in {key}'
        if 'tags' in x:assert isinstance(x['tags'],list) and all(isinstance(t,str) for t in x['tags']),f'{ident}: tags must be strings'
        images.add(x['image'])
    collection_ids=set()
    for coll in collections:
        assert re.fullmatch(r'[a-z0-9][a-z0-9_-]*',coll['id']),f'Invalid collection ID: {coll["id"]}'
        assert coll['id'] not in collection_ids,'Duplicate collection ID'
        collection_ids.add(coll['id'])
        assert coll.get('title') and isinstance(coll['ids'],list),'Invalid collection'
        assert len(coll['ids'])==len(set(coll['ids'])),'Duplicate figure in collection'
        assert all(i in ids for i in coll['ids']),f'{coll["id"]}: unknown figure ID'
    for guide in config['guide']:
        assert all(i in ids for i in guide['ids']),f'Unknown guide ID in {guide["title"]}'
    for path in root.rglob('*.pdf'):
        rel=path.relative_to(root)
        assert rel.parts[0] in {'.git','_site'},f'PDF files are not part of this image library: {rel}'
    return figures,config,collections,images

def build(root=ROOT,check=False):
    figures,config,collections,images=validate(root)
    if not check:
        out=(root/'_site').resolve()
        # Only replace this repository's known generated directory.
        assert out.parent==root.resolve() and out.name=='_site' and not (root/'_site').is_symlink()
        if out.exists():shutil.rmtree(out)
        out.mkdir()
        shutil.copy2(root/'index.html',out/'index.html')
        for folder in ['assets','data']:shutil.copytree(root/folder,out/folder)
        for name in images:
            dest=out/name;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/name,dest)
        (out/'.nojekyll').touch()
        with (out/'figure_index.csv').open('w',encoding='utf-8-sig',newline='') as f:
            keys=['id','venue','year','title','authors','figure','pattern','featured','rank','note','image','paper','source_collection','image_source']
            writer=csv.DictWriter(f,fieldnames=keys);writer.writeheader()
            writer.writerows({k:x.get(k,'') for k in keys} for x in figures)
    print(json.dumps({'figures':len(figures),'images':len(images),'featured':sum(x['featured'] for x in figures),'collections':len(collections),'pdf_files':0,'mode':'validate' if check else 'build'},ensure_ascii=False))

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    build(check=args.check)
