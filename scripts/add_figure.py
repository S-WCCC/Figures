"""Register a new image and its metadata, then validate the complete catalog."""
from pathlib import Path
from datetime import date
import argparse,json,re,shutil,sys
from build_site import ROOT,TYPES,EXTENSIONS,validate

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--file',required=True,type=Path);p.add_argument('--id',required=True)
    p.add_argument('--title',required=True);p.add_argument('--authors',required=True)
    p.add_argument('--year',required=True,type=int);p.add_argument('--venue',default='ICML')
    p.add_argument('--pattern',choices=sorted(TYPES),required=True)
    p.add_argument('--source',default='');p.add_argument('--figure',default='主图')
    p.add_argument('--note',default='');p.add_argument('--tag',action='append',default=[])
    p.add_argument('--featured',action='store_true');args=p.parse_args()
    assert re.fullmatch(r'[a-z0-9][a-z0-9_-]*',args.id),'Use a stable lowercase ID with hyphens or underscores'
    src=args.file.resolve();assert src.is_file() and src.suffix.lower() in EXTENSIONS,'Use PNG/JPG/WEBP/GIF'
    catalog_path=ROOT/'data/figures.json';original=catalog_path.read_text(encoding='utf-8');figures=json.loads(original)
    assert not any(x['id']==args.id for x in figures),'This ID already exists; edit its existing record'
    dest=ROOT/'figures'/(args.id+src.suffix.lower());assert not dest.exists(),'Image path already exists'
    rank=max((x['rank'] for x in figures if x['featured']),default=0)+1 if args.featured else 999
    entry=dict(id=args.id,venue=args.venue,year=args.year,title=args.title,authors=args.authors,figure=args.figure,pattern=args.pattern,image=dest.relative_to(ROOT).as_posix(),paper=args.source,featured=args.featured,rank=rank,note=args.note,tags=args.tag,source_collection='Original contribution' if not args.source else 'Contributor submission')
    try:
        shutil.copy2(src,dest);figures.append(entry)
        catalog_path.write_text(json.dumps(figures,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
        validate(ROOT)
    except Exception:
        catalog_path.write_text(original,encoding='utf-8')
        if dest.exists():dest.unlink()
        raise
    config_path=ROOT/'data/config.json';config=json.loads(config_path.read_text(encoding='utf-8'));config['updated']=date.today().isoformat()
    config_path.write_text(json.dumps(config,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print('Added '+args.id+'; run python scripts/build_site.py to preview.')

if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8');main()
