import json
import re
from pathlib import Path

VAULT_PEOPLE_DIR = Path("/Users/fewh/Documents/MIT ISN Obsidian Vault/People")
OUTPUT_JSON = Path("/Users/fewh/isn-dashboard/public/data/people.json")

TOP_LEVEL_FIELD_RE = re.compile(
    r"^(name|positions|engagement|lastContact|introducedBy|lane|highlight|importance|status|photo|tier|why|hook|bio):"
)


def person_id_from_name(name: str) -> str:
    s = name.lower().strip()
    s = s.replace("“", "").replace("”", "").replace('"', "")
    s = s.replace("’", "").replace("'", "")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return s


def extract_dashboard_block(text: str) -> list[str] | None:
    lines = text.splitlines()
    start = None
    end = None

    for i, line in enumerate(lines):
        if line.strip() == "## Dashboard":
            start = i + 1
            break

    if start is None:
        return None

    for j in range(start, len(lines)):
        if lines[j].startswith("## ") and j > start:
            end = j
            break

    block = lines[start:end] if end is not None else lines[start:]
    return [line.rstrip() for line in block if line.strip()]


def parse_dashboard_block(lines: list[str]) -> dict:
    data = {}
    i = 0

    while i < len(lines):
        stripped = lines[i].strip()

        if stripped.startswith("name:"):
            data["name"] = stripped[len("name:") :].strip()
            i += 1
            continue

        if stripped.startswith("positions:"):
            positions = []
            i += 1
            current = None

            while i < len(lines):
                s = lines[i].strip()

                if TOP_LEVEL_FIELD_RE.match(s) and not s.startswith(("org:", "parentOrg:")):
                    break

                if s.startswith("- title:"):
                    if current:
                        positions.append(current)
                    current = {"title": s[len("- title:") :].strip()}
                elif current and s.startswith("org:"):
                    current["org"] = s[len("org:") :].strip()
                elif current and s.startswith("parentOrg:"):
                    current["parentOrg"] = s[len("parentOrg:") :].strip()

                i += 1

            if current:
                positions.append(current)

            data["positions"] = positions
            continue

        if stripped.startswith("engagement:"):
            data["engagement"] = stripped[len("engagement:") :].strip()
            i += 1
            continue

        if stripped.startswith("lastContact:"):
            data["lastContact"] = stripped[len("lastContact:") :].strip()
            i += 1
            continue

        if stripped.startswith("introducedBy:"):
            data["introducedBy"] = stripped[len("introducedBy:") :].strip()
            i += 1
            continue

        if stripped.startswith("lane:"):
            lanes = []
            i += 1

            while i < len(lines):
                s = lines[i].strip()

                if TOP_LEVEL_FIELD_RE.match(s):
                    break

                if s.startswith("- "):
                    lanes.append(s[2:].strip())

                i += 1

            data["lane"] = lanes
            continue

        if stripped.startswith("highlight:"):
            value = stripped[len("highlight:") :].strip().lower()
            data["highlight"] = value == "true"
            i += 1
            continue

        if stripped.startswith("importance:"):
            data["importance"] = stripped[len("importance:") :].strip()
            i += 1
            continue

        if stripped.startswith("status:"):
            data["status"] = stripped[len("status:") :].strip()
            i += 1
            continue

        if stripped.startswith("photo:"):
            data["photo"] = stripped[len("photo:") :].strip()
            i += 1
            continue

        if stripped.startswith("tier:"):
            raw_tier = stripped[len("tier:") :].strip()
            data["tier"] = int(raw_tier) if raw_tier.isdigit() else raw_tier
            i += 1
            continue

        if stripped.startswith("why:"):
            data["why"] = stripped[len("why:") :].strip()
            i += 1
            continue

        if stripped.startswith("hook:"):
            data["hook"] = stripped[len("hook:") :].strip()
            i += 1
            continue

        if stripped.startswith("bio:"):
            data["bio"] = stripped[len("bio:") :].strip()
            i += 1
            continue

        i += 1

    if "name" in data and "id" not in data:
        data["id"] = person_id_from_name(data["name"])

    return data


def main():
    people = []

    if not VAULT_PEOPLE_DIR.exists():
        raise FileNotFoundError(f"Vault people folder not found: {VAULT_PEOPLE_DIR}")

    for md_file in sorted(VAULT_PEOPLE_DIR.glob("Person - *.md")):
        text = md_file.read_text(encoding="utf-8")
        block = extract_dashboard_block(text)

        if not block:
            continue

        person = parse_dashboard_block(block)

        if "name" not in person:
            continue

        people.append(person)

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(
        json.dumps(people, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"Wrote {len(people)} people to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()