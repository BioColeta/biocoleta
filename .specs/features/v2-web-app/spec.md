# v2: Web App With Mocked API

**Status:** implemented on `main`; acceptance tracked in GitHub milestone `v2-react`.
**Epic:** https://github.com/BioColeta/biocoleta/issues/12 (issues #13 to #31 hold the criteria).

## Decisions

See AD-006 in `.specs/STATE.md`.

## Deviations from the issue text

| Issue | Deviation | Reason |
| ----- | --------- | ------ |
| #13 | v1 folders not removed; tag `v1-php-mvp` kept | Waiting for the professor's confirmation |
| #14 | TanStack Table 8, not 9 | Stable API already known to the team's examples |
| #14 | shadcn/ui style components written by hand over Radix | Only the needed components |
| #15 | Alert detection analyses the two latest readings in arrival order | Same as v1 |
| #22 | Analysis window starts at the alert evidence | Older healthy readings hid fresh obstructions |
| #28 | QR code still points to the repository | The public link only exists after Pages is enabled |

## Open items

- Professor confirmation (blocks removing v1).
- Demo city: v1 sent `MATAO-SP` with São Paulo coordinates; v2 uses São Paulo (`CITY` constant).
- Enable GitHub Pages.
- `docs/presentation/` still describes v1.
