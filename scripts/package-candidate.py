"""Package only the fixed candidate build; never read or overwrite installed dist."""
from pathlib import Path
import json, zipfile

root = Path(__file__).resolve().parents[1]
candidate = root / 'candidate-dist'
manifest = json.loads((candidate / 'manifest.json').read_text())
if manifest['version'] != json.loads((root / 'manifest.json').read_text())['version']:
    raise SystemExit('Rebuild the current candidate before packaging')
files = sorted(path for path in candidate.rglob('*') if path.is_file())
if any(path.is_symlink() for path in candidate.rglob('*')):
    raise SystemExit('Candidate symlinks are not allowed')
if len(files) != 13:
    raise SystemExit('Candidate must contain the expected 13 extension files')
destination = root / 'release' / ('webskins-' + manifest['version'] + '.zip')
destination.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(destination, 'w', compression=zipfile.ZIP_DEFLATED) as archive:
    for path in files:
        entry = zipfile.ZipInfo(path.relative_to(candidate).as_posix(), (2026, 1, 1, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o644 << 16
        archive.writestr(entry, path.read_bytes())
print('Packaged ' + str(destination.relative_to(root)))
