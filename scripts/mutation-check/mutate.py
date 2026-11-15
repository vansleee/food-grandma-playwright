"""Write a copy of app/routers/restaurant.py with one seeded defect.

Usage: python mutate.py <original restaurant.py> <output path> <mutant>

Each mutant targets mark_order_ready() and fails loudly if the code it
patches has changed, so a stale mutant can never silently become a no-op.
"""
import sys

RET = '    return {"order": serialize_order(session, order)}'
SET = '        order.status = READY\n'
COMMIT = '        session.commit()\n        session.refresh(order)\n'
GUARD = 'if order and order.status == COOKING:'

MUTANTS = {
    # No defect: every test must pass here, or the other results mean nothing.
    "baseline": lambda src: src,
    # Response format drift: an extra top-level key next to `order`.
    "M1-extra-field": lambda src: src.replace(
        RET, '    return {"order": serialize_order(session, order), "warning": "kitchen busy"}'),
    # Side effect: also rewrites another order of the same restaurant.
    "M2-touch-other-order": lambda src: src.replace(SET, SET +
        '        other = session.exec(select(Order).where(Order.restaurant_id == restaurant.id, Order.id != order.id)).first()\n'
        '        other.address = "MUTATED"\n'
        '        session.add(other)\n'),
    # Response says Ready, but nothing is committed.
    "M3-not-persisted": lambda src: src.replace(COMMIT, ''),
    # Any status, not only Cooking, is moved to Ready.
    "M4-no-cooking-guard": lambda src: src.replace(GUARD, 'if order:'),
}


def main():
    original, output, name = sys.argv[1:4]
    if name not in MUTANTS:
        sys.exit(f"unknown mutant {name}; choose from: {', '.join(MUTANTS)}")
    src = open(original).read()
    for needle in (RET, SET, COMMIT, GUARD):
        if src.count(needle) != 1:
            sys.exit(f"mark_order_ready() changed; mutant anchor not found exactly once: {needle!r}")
    mutated = MUTANTS[name](src)
    if name != "baseline" and mutated == src:
        sys.exit(f"mutant {name} did not change the source")
    open(output, "w").write(mutated)


if __name__ == "__main__":
    main()
