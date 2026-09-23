#!/usr/bin/env python3
"""Validate the supplied design handoff without installing app dependencies.

Run from any directory. --write-inventory refreshes only the reviewed inventory;
it never edits lda/. Warnings are known content gaps, not launch approval.
"""

import argparse
import base64
from collections import Counter
import gzip
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import struct
import sys
from urllib.parse import urlparse
import xml.etree.ElementTree as ET
import zlib


ROOT = Path(__file__).resolve().parents[1]
HANDOFF = ROOT / "lda"
INVENTORY = ROOT / "docs/brand-revamp/asset-inventory.json"


class BundleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.kind = None
        self.scripts = {}

    def handle_starttag(self, tag, attrs):
        if tag == "script":
            kind = dict(attrs).get("type", "")
            self.kind = kind if kind.startswith("__bundler/") else None
            if self.kind:
                self.scripts[self.kind] = ""

    def handle_data(self, data):
        if self.kind:
            self.scripts[self.kind] += data

    def handle_endtag(self, tag):
        if tag == "script":
            self.kind = None


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def shape(value):
    if isinstance(value, dict):
        return {key: shape(item) for key, item in sorted(value.items())}
    if isinstance(value, list):
        return [shape(item) for item in value]
    return type(value).__name__


def strings(value, path=""):
    if isinstance(value, str):
        yield path, value
    elif isinstance(value, dict):
        for key, item in value.items():
            yield from strings(item, f"{path}.{key}")
    elif isinstance(value, list):
        for index, item in enumerate(value):
            yield from strings(item, f"{path}[{index}]")


def png_dimensions(data):
    require(data[:8] == b"\x89PNG\r\n\x1a\n", "Invalid PNG signature")
    offset, dimensions, ended = 8, None, False
    while offset < len(data):
        require(offset + 12 <= len(data), "Truncated PNG chunk")
        length = struct.unpack_from(">I", data, offset)[0]
        end = offset + 12 + length
        require(end <= len(data), "Truncated PNG payload")
        kind = data[offset + 4:offset + 8]
        payload = data[offset + 8:offset + 8 + length]
        expected = struct.unpack_from(">I", data, end - 4)[0]
        require(zlib.crc32(kind + payload) & 0xFFFFFFFF == expected,
                "PNG checksum mismatch")
        if kind == b"IHDR":
            require(length == 13, "Invalid PNG header")
            dimensions = list(struct.unpack_from(">II", payload))
        if kind == b"IEND":
            ended = True
            break
        offset = end
    require(dimensions and all(dimensions) and ended, "Incomplete PNG")
    return dimensions


def category(path):
    relative = path.relative_to(HANDOFF).as_posix()
    if relative.startswith("_src/"):
        return "design-source-only"
    if relative.startswith("design/") or path.name == "Sousa Dev Brand Guidelines.html":
        return "design-reference-only"
    if relative.startswith("content/"):
        return "content-source"
    if relative.startswith("tokens/"):
        return "web-tokens"
    if relative.startswith("brand-kit/email/"):
        return "email-collateral"
    if relative.startswith("brand-kit/"):
        return "brand-asset-or-instructions"
    return "handoff-instructions"


def inspect_file(path):
    data = path.read_bytes()
    record = {
        "path": path.relative_to(ROOT).as_posix(),
        "category": category(path),
        "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
    }
    if path.suffix == ".json":
        json.loads(data)
    elif path.suffix == ".png":
        record["dimensions"] = png_dimensions(data)
    elif path.suffix == ".svg":
        svg = ET.fromstring(data)
        require(svg.tag == "{http://www.w3.org/2000/svg}svg", "Invalid SVG root")
        require(svg.get("viewBox"), "SVG missing viewBox")
        require(not svg.findall(".//{http://www.w3.org/2000/svg}text"),
                "Logo/loader contains live font-dependent text")
        record["viewBox"] = svg.get("viewBox")
    elif path.suffix == ".html":
        parser = BundleParser()
        parser.feed(data.decode("utf-8"))
        if parser.scripts:
            manifest = json.loads(parser.scripts["__bundler/manifest"])
            template = json.loads(parser.scripts["__bundler/template"])
            require(isinstance(template, str) and "<x-dc>" in template,
                    "Missing design template")
            for resource in manifest.values():
                raw = base64.b64decode(resource["data"], validate=True)
                if resource.get("compressed"):
                    gzip.decompress(raw)
            record["bundled_resources"] = dict(sorted(Counter(
                resource["mime"] for resource in manifest.values()).items()))
    return record


def check_content():
    tokens = read_json("lda/tokens/tokens.json")
    css = (HANDOFF / "tokens/tokens.css").read_text(encoding="utf-8")
    declarations = re.findall(r"--([\w-]+)\s*:\s*([^;]+);", css)
    require(len(dict(declarations)) == len(declarations), "Duplicate CSS token names")
    normalize = lambda value: re.sub(r"\s+", "", value)
    require({key: normalize(value) for key, value in declarations}
            == {key: normalize(value) for key, value in tokens.items()},
            "CSS and JSON web tokens differ")

    locales = {lang: read_json(f"lda/content/i18n/{lang}.json") for lang in ("en", "pt")}
    require(shape(locales["en"]) == shape(locales["pt"]), "Locale key/type/array shape differs")
    services = read_json("lda/content/services.json")
    products = read_json("lda/content/products.json")
    require(len({item["slug"] for item in services}) == len(services), "Duplicate service slug")
    require(len({item["url"] for item in products}) == len(products), "Duplicate product URL")
    for lang, locale in locales.items():
        expected = [{"num": item["num"], "title": item["title"][lang],
                     "desc": item["description"][lang], "tags": item["tags"][lang]}
                    for item in services]
        require(locale["services"]["items"] == expected, f"{lang}: service copies differ")
    for product in products:
        require(product["status"] in ("live", "in-development"), "Unknown product status")
        parsed = urlparse(product["url"])
        require(parsed.scheme == "https" and parsed.netloc == product["domain"],
                f"Invalid URL/domain: {product['name']}")
        require(set(product["description"]) == {"en", "pt"}, "Product description locales differ")
    for name, value in [("locales", locales), ("services", services), ("products", products)]:
        for key, text in strings(value):
            require(bool(text.strip()), f"Empty content: {name}{key}")
            require("\u2014" not in text, f"Em dash in content: {name}{key}")
    live = sum(item["status"] == "live" for item in products)
    print(f"PASS: {len(tokens)} matching web tokens; EN/PT shapes; {len(services)} services; "
          f"{len(products)} products ({live} live).")
    if tokens.get("text-label-sm") == "11px":
        print("WARN D02: supplied small label token is below the 12px production minimum.")
    print("REVIEW: hero count vs product statuses (D01); color/motion exceptions (D10/D11).")
    print("REVIEW: missing launch assets, legal content, fonts and provider choices: "
          "docs/brand-revamp/LAUNCH.md")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write-inventory", action="store_true",
                        help="Refresh the inventory after reviewing intentional handoff changes")
    args = parser.parse_args()
    require(HANDOFF.is_dir(), "lda/ is missing")
    records = []
    for path in sorted(HANDOFF.rglob("*")):
        if path.is_file():
            try:
                records.append(inspect_file(path))
            except (ValueError, KeyError, ET.ParseError, OSError) as error:
                raise ValueError(f"{path.relative_to(ROOT)}: {error}") from error
    require(records, "lda/ is empty")
    check_content()
    inventory = {"schema_version": 1, "root": "lda", "files": records}
    if args.write_inventory:
        INVENTORY.parent.mkdir(parents=True, exist_ok=True)
        INVENTORY.write_text(json.dumps(inventory, indent=2, ensure_ascii=False) + "\n",
                             encoding="utf-8")
        print(f"WROTE: {INVENTORY.relative_to(ROOT)}")
    else:
        require(INVENTORY.exists(), "Inventory missing; review then use --write-inventory")
        previous = json.loads(INVENTORY.read_text(encoding="utf-8"))
        require(previous == inventory,
                "Inventory drift: review added/removed/changed files, then use --write-inventory")
    print(f"PASS: {len(records)} files inventoried; PNG checksums, SVGs and bundle resources valid.")
    print("Handoff checks passed. This is not a production launch check.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, TypeError, OSError, ET.ParseError, struct.error) as error:
        print(f"FAIL: {error}", file=sys.stderr)
        sys.exit(1)
