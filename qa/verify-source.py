"""Run the committed CI commands in a disposable source-only copy.
The accepted installed dist and Store ZIP are never modified.
"""
from pathlib import Path
import os, shutil, subprocess, tempfile, sys
source=Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='webskins-ci-') as temporary:
 root=Path(temporary);root.chmod(0o700)
 names=subprocess.check_output(['git','ls-files','-z'],cwd=source).decode().split('\0')
 for name in names:
  path=Path(name)
  if not name or path.parts[0] not in {'src','backend','scripts','test','icons','manifest.json','package.json','package-lock.json','tailwind.config.js','PRIVACY.md'}:continue
  if any(x in {'node_modules','dist','data','backups'} or x.startswith('.env') or x.endswith(('.db','.db-wal','.db-shm')) for x in path.parts):continue
  original=source/path
  if not original.is_file() or original.is_symlink():continue
  target=root/path;target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(original,target)
 env={'HOME':str(Path.home()),'TMPDIR':temporary,'LANG':'C','LC_ALL':'C','PATH':'/opt/homebrew/opt/node@24/bin:/usr/local/bin:/usr/bin:/bin','RATE_LIMIT_SECRET':'synthetic-ci-only','DATABASE_URL':'file:'+str(root/'not-used.db')}
 commands=[(['npm','ci','--ignore-scripts'],root),(['npm','ci'],root/'backend'),(['npm','test'],root),(['npm','test'],root/'backend'),(['npm','run','build'],root),(['npm','audit','--omit=dev'],root),(['npm','audit','--omit=dev'],root/'backend')]
 for index,(args,cwd) in enumerate(commands):
  if '--finish-build' in sys.argv and index in (2,3):continue
  print('CHECK '+' '.join(args)+' at '+('backend' if cwd.name=='backend' else 'extension'),flush=True)
  result=subprocess.run(args,cwd=cwd,env=env,text=True,capture_output=True,timeout=240)
  print(result.stdout,flush=True)
  if result.returncode:print(result.stderr,flush=True);raise SystemExit(result.returncode)
 print('All source workflow commands passed; accepted installed package unchanged.',flush=True)
