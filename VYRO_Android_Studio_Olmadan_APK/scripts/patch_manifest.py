from pathlib import Path
import xml.etree.ElementTree as ET

manifest = Path("android/app/src/main/AndroidManifest.xml")
if not manifest.exists():
    raise SystemExit(f"Android manifest bulunamadı: {manifest}")
ET.register_namespace("android", "http://schemas.android.com/apk/res/android")
tree = ET.parse(manifest)
root = tree.getroot()
ns = "{http://schemas.android.com/apk/res/android}"
existing = {p.attrib.get(ns + "name") for p in root.findall("uses-permission")}
for permission in ("android.permission.CAMERA", "android.permission.RECORD_AUDIO"):
    if permission not in existing:
        node = ET.Element("uses-permission")
        node.set(ns + "name", permission)
        root.insert(0, node)
tree.write(manifest, encoding="utf-8", xml_declaration=True)
print("Kamera ve mikrofon izinleri eklendi.")
