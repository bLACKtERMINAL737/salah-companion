"""One-time repo fix: converts every `@/...` aliased import/require specifier
to a correctly computed relative path. Run once from the project root, then
delete or ignore — not part of the app itself.
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INCLUDE_DIRS = ["app", "components", "context", "hooks", "lib"]
EXTS = (".ts", ".tsx")

# Matches: from "@/x/y"  or  from '@/x/y'  or  import("@/x/y")
PATTERN = re.compile(r'''(from\s+|import\s*\(\s*)(['"])@/([^'"]+)\2''')


def compute_relative(from_file_dir: str, target_root_relative_path: str) -> str:
    target_abs = os.path.join(ROOT, target_root_relative_path)
    rel = os.path.relpath(target_abs, from_file_dir)
    rel = rel.replace(os.sep, "/")
    if not rel.startswith("."):
        rel = "./" + rel
    return rel


def fix_file(path: str) -> int:
    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    file_dir = os.path.dirname(path)
    count = 0

    def replacer(m: re.Match) -> str:
        nonlocal count
        prefix, quote, target = m.group(1), m.group(2), m.group(3)
        rel = compute_relative(file_dir, target)
        count += 1
        return f"{prefix}{quote}{rel}{quote}"

    new_content = PATTERN.sub(replacer, content)
    if new_content != content:
        with open(path, "w", encoding="utf-8") as f:
            f.write(new_content)
    return count


def main():
    total_files = 0
    total_imports = 0
    for d in INCLUDE_DIRS:
        base = os.path.join(ROOT, d)
        for dirpath, _, filenames in os.walk(base):
            for name in filenames:
                if name.endswith(EXTS):
                    path = os.path.join(dirpath, name)
                    n = fix_file(path)
                    if n:
                        total_files += 1
                        total_imports += n
                        print(f"  fixed {n:2d} import(s) in {os.path.relpath(path, ROOT)}")
    print(f"\nDone: rewrote {total_imports} aliased imports across {total_files} files.")


if __name__ == "__main__":
    main()
