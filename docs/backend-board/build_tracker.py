# -*- coding: utf-8 -*-
"""Build the Wayfare backend board page.

Reads the Trello board, merges it with the specs in spec_*.py and writes one HTML file.
Run:  python build_tracker.py [--offline] [--out PATH]
"""
import datetime as dt
import json
import re
import sys
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

from spec_dtos import DTOS                      # noqa: E402
from spec_endpoints import ENDPOINTS, AREAS     # noqa: E402
from spec_pages import PAGES                    # noqa: E402
import spec_tasks as S                          # noqa: E402

BOARD_JSON = "https://trello.com/b/MFhbwJxe.json"
BOARD_URL = "https://trello.com/b/MFhbwJxe/wayfare"
REPO_URL = "https://github.com/KerollosRomany/Car-Rental-Management-System"
CACHE = HERE / "board-cache.json"

args = sys.argv[1:]
out_path = Path(args[args.index("--out") + 1]) if "--out" in args else HERE / "backend-board.html"

# ------------------------------------------------------------------ Trello
if "--offline" in args and CACHE.exists():
    board = json.loads(CACHE.read_text(encoding="utf-8"))
else:
    try:
        with urllib.request.urlopen(BOARD_JSON, timeout=40) as r:
            board = json.loads(r.read().decode("utf-8"))
        CACHE.write_text(json.dumps(board), encoding="utf-8")
    except Exception as e:  # use the last good copy
        if not CACHE.exists():
            raise
        print("Trello fetch failed, using cache:", e)
        board = json.loads(CACHE.read_text(encoding="utf-8"))


def local_date(iso):
    t = dt.datetime.strptime(iso[:19], "%Y-%m-%dT%H:%M:%S")
    return t.date().isoformat()


lists = {l["id"]: l for l in board["lists"]}
members = {m["id"]: (m.get("fullName") or m["username"]) for m in board["members"]}
NAME_FIX = {"matthewashrf": "Matthew Ashraf", "miinmaher": "Mina Maher"}
members = {k: NAME_FIX.get(v, v) for k, v in members.items()}
labels = {x["id"]: x["name"] for x in board["labels"] if x["name"]}

cards = {}
for c in board["cards"]:
    lst = lists[c["idList"]]
    if c["closed"] or lst["closed"]:
        continue
    cards[c["idShort"]] = dict(
        n=c["idShort"], name=c["name"].strip(), url=c.get("shortUrl") or c.get("url"), list=re.sub(r"\s*-.*$", "", lst["name"]).strip(),
        listName=lst["name"].strip(), pos=(lst["pos"], c["pos"]),
        start=local_date(c["start"]) if c.get("start") else None, due=local_date(c["due"]) if c.get("due") else None,
        done=bool(c.get("dueComplete")), members=[members[i] for i in c["idMembers"] if i in members],
        labels=[labels[i] for i in c["idLabels"] if i in labels],
    )

# ------------------------------------------------------------------ new cards that now exist on Trello
by_name = {c["name"]: c for c in cards.values()}
added = []
for key in list(S.NEW_CARDS):
    nc = S.NEW_CARDS[key]
    card = by_name.get(nc["title"])
    if not card:
        continue
    for t in S.T:
        if t["newCard"] == key:
            t["trello"] = list(t["trello"]) + [card["n"]]
            t["newCard"] = None
            t["_planned"] = (nc["start"], card["due"] or nc["due"])
            code = t["code"]
    added.append(dict(key=key, n=card["n"], title=card["name"], url=card["url"], list=card["list"], due=card["due"], code=code))
    del S.NEW_CARDS[key]

ep_by_id = {e["id"]: e for e in ENDPOINTS}
task_by_id = {t["id"]: t for t in S.T}
problems = []

for t in S.T:
    for n in t["trello"]:
        if n not in cards:
            problems.append(f"{t['id']} refers to Trello card {n} that is not an open card")
    for e in t["endpoints"]:
        if e not in ep_by_id:
            problems.append(f"{t['id']} refers to unknown endpoint {e}")
    for d in t["depends"]:
        if d not in task_by_id:
            problems.append(f"{t['id']} depends on unknown task {d}")
    if t["newCard"] and t["newCard"] not in S.NEW_CARDS:
        problems.append(f"{t['id']} refers to unknown new card {t['newCard']}")
    if t["pkg"] not in {p["id"] for p in S.PACKAGES}:
        problems.append(f"{t['id']} has unknown package {t['pkg']}")

    tc = [cards[n] for n in t["trello"] if n in cards]
    starts = [c["start"] or c["due"] for c in tc if c["start"] or c["due"]]
    dues = [c["due"] for c in tc if c["due"]]
    if t["newCard"]:
        nc = S.NEW_CARDS[t["newCard"]]
        starts, dues = [nc["start"]], [nc["due"]]
    t["start"] = min(starts) if starts else None
    t["due"] = max(dues) if dues else None
    if t.get("_planned"):
        t["start"], t["due"] = t.pop("_planned")
    t["cards"] = [dict(n=c["n"], name=c["name"], url=c["url"], done=c["done"], due=c["due"]) for c in tc]
    if t["base"] != "done" and tc and all(c["done"] for c in tc):
        t["base"] = "done"          # Trello says every card is ticked

    # a readable checklist for endpoint tasks
    if t["endpoints"] and not t["steps"]:
        eps = [ep_by_id[e] for e in t["endpoints"]]
        files = []
        for e in eps:
            for f in e["files"]:
                if f not in files:
                    files.append(f)
        routes = "; ".join(f"{e['method']} {e['route']}" for e in eps)
        nrules = sum(len(e["rules"]) for e in eps)
        roles = sorted({e["role"] for e in eps})
        t["steps"] = [
            "Read the endpoint spec below and ask in the group chat if anything is unclear.",
            "Create the DTOs and the mapper. Suggested files: " + ", ".join(files) + ".",
            f"Add the controller action: {routes}. Authorization: {', '.join(roles)}.",
            f"Implement the {nrules} rule{'s' if nrules != 1 else ''} listed in the spec. Put anything shared with other endpoints in Services/RentalRules.cs.",
            "Add the request to wayfare-backend.http (use 'Copy as .http' on the Endpoints tab) and run every test case in the spec.",
            "Open a pull request to main and ask a second member to review it.",
            "Tick the Trello card, or create it first if the board shows this task as a new card.",
        ]
    if t["endpoints"]:
        t["files"] = t["files"] or sorted({f for e in t["endpoints"] for f in ep_by_id[e]["files"]})
        t["accept"] = t["accept"] or [x for e in t["endpoints"] for x in ep_by_id[e]["tests"]]

# every task is listed in exactly one package, and that package is the one it names
listed = {}
for p in S.PACKAGES:
    for tid in p["tasks"]:
        if tid not in task_by_id:
            problems.append(f"package {p['id']} lists unknown task {tid}")
        elif task_by_id[tid]["pkg"] != p["id"]:
            problems.append(f"package {p['id']} lists {tid} but the task names package {task_by_id[tid]['pkg']}")
        if tid in listed:
            problems.append(f"task {tid} is listed in packages {listed[tid]} and {p['id']}")
        listed[tid] = p["id"]
for t_ in S.T:
    if t_["id"] not in listed:
        problems.append(f"task {t_['id']} is in no package")


def depth(tid, seen=()):
    """How many cards come before this one. Used to put the cards of a package in a sensible order."""
    if tid in seen:
        problems.append(f"dependency loop at {tid}")
        return 0
    return 1 + max((depth(d, seen + (tid,)) for d in task_by_id[tid]["depends"]), default=-1)


for t_ in S.T:
    t_["depth"] = depth(t_["id"])

# every endpoint must be built by some task
built = {e for t in S.T for e in t["endpoints"]}
for e in ENDPOINTS:
    if e["id"] not in built:
        problems.append(f"endpoint {e['id']} has no task")
    for n in e["trello"]:
        if n not in cards:
            problems.append(f"endpoint {e['id']} refers to Trello card {n} that is not open")
    if e["response"]["dto"] and e["response"]["dto"] not in DTOS:
        problems.append(f"endpoint {e['id']} uses unknown DTO {e['response']['dto']}")
for p in PAGES:
    for c in p["calls"]:
        for e in c["eps"]:
            if e not in ep_by_id:
                problems.append(f"page {p['id']} refers to unknown endpoint {e}")

mapped_cards = {n for t in S.T for n in t["trello"]}
unmapped = sorted(n for n in cards if n not in mapped_cards)

# which tasks build which endpoint, for the pages and endpoints tabs
for e in ENDPOINTS:
    e["tasks"] = [t["id"] for t in S.T if e["id"] in t["endpoints"]]

if problems:
    print("PROBLEMS:")
    for p in problems:
        print("  -", p)
    sys.exit(1)

data = dict(
    generatedAt=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    boardUrl=BOARD_URL, repoUrl=REPO_URL,
    team=S.TEAM, packages=S.PACKAGES, tasks=S.T, endpoints=ENDPOINTS, areas=AREAS, dtos=DTOS, pages=PAGES,
    decisions=S.DECISIONS, entities=S.ENTITIES, enums=S.ENUMS, changes=S.CHANGES, fieldMap=S.FIELD_MAP,
    conventions=S.CONVENTIONS, glossary=S.GLOSSARY, setup=S.SETUP, doneDef=S.DONE_DEF, newCards=S.NEW_CARDS, addedCards=added,
    trelloCards=sorted(cards.values(), key=lambda c: c["pos"]),
)
for c in data["trelloCards"]:
    c.pop("pos", None)

blob = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
blob = blob.replace("</", "<\\/").replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
template = (HERE / "tracker_template.html").read_text(encoding="utf-8")
assert template.count("/*DATA*/null") == 1
html = template.replace("/*DATA*/null", blob)
out_path.write_text(html, encoding="utf-8", newline="\n")

todo = [t for t in S.T if t["base"] != "done" and t["tier"] != "optional"]
print(f"wrote {out_path}  {len(html) // 1024} KB")
print(f"tasks {len(S.T)} (done {sum(t['base'] == 'done' for t in S.T)}, to do {len(todo)}, optional {sum(t['tier'] == 'optional' for t in S.T)})")
print(f"endpoints {len(ENDPOINTS)}  pages {len(PAGES)}  trello cards open {len(cards)}  still to add {len(S.NEW_CARDS)}  linked {len(added)}")
print("open Trello cards with no tracker task:", unmapped or "none")
HOURS = {"S": 2, "M": 4, "L": 8}
for p in S.PACKAGES:
    if p["kind"] == "package":
        hs = sum(HOURS[task_by_id[i]["size"]] for i in p["tasks"])
        print(f"  package {p['letter']}  {p['name']:<45} {len(p['tasks'])} cards  {hs:>3} h")
