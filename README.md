# GLP-1 Universe

A Consumer Choice Center research project combining an op-ed, sourced manufacturer cash-price histories, policy timelines, and an interactive product universe. Regular prices are distinguished from conditional, introductory, and temporary offers.

## Tech stack

- Next.js
- React
- Vite
- TypeScript
- Tailwind / custom CSS
- Cloudflare local dev tooling

## Local development

```bash
npm install
npm run dev
```

Then open the local URL shown in the terminal.

## Production build

```bash
npm run build
```

## Validation

```bash
npx tsc --noEmit --incremental false
npm run lint
npm run build
```

The build produces Cloudflare Worker assets and configuration in `dist/`. Deploy the generated `dist/server/wrangler.json` with your hosting account; local development state and environment files are excluded from Git.

## Data and editorial scope

- Price observations and sources live in `data/glp1-prices.ts`; the latest verification snapshot is November 8, 2026. October 5 observations remain historical records.
- A current snapshot is not automatically a dated price cut. The analysis compares existing products at the same dose, form, and regular self-pay basis, excluding launches and promotional offers.
- The headline comparison covers Wegovy injection and Zepbound 2.5/5 mg vials only. Higher-dose regular vial prices have lower current observations with unverified change dates.
- The $650 Wegovy predecessor is a retail savings offer with an unverified start date; its plotting anchor is schematic.
- Dates establish the sequence of market and policy actions, not their causal contribution.
- Dated stepped price panels lead the evidence section. The Product Universe and 3D landscape use the shared manufacturer-offer dataset. Chart 1 (Zepbound) and chart 2 (Wegovy) from `charts/` are displayed in the Price channels section with their edited descriptions and full-size viewing. Public copies are served from `public/charts/`. The restored “The signal” section follows these charts, with product/dose selectors, historical prices, offer cards, and a separate policy announcement.

## Notes

- The app is organized around  [app/page.tsx](app/page.tsx) and the visual scene in  [app/universe-scene.tsx](app/universe-scene.tsx).
- Database support is optional and is configured through the Cloudflare environment when needed.
- If you want to add different Cloudflare bindings, do it in the project environment/config and keep app logic independent from the hosting layer.

The portable build runs Vinext directly without needing a host `timeout` command. The managed-linux build uses `scripts/build-verified.sh` and its existing `SITES_BUILD_TIMEOUT` setting.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)

## Manufacturer verification — November 8, 2026

Prices verified November 8, 2026 using the supplied U.S. manufacturer snapshot. **No new November price change was established.** November records have status `observed` and event `Price verified — unchanged`; historical effective dates are preserved. Current offers select the latest observation per product, form, dose, channel and price basis, rather than counting old snapshots as additional offers.

| Product / device | Supply | Regular self-pay prices (USD) | Separate offers |
| --- | --- | --- | --- |
| Wegovy single-dose injection pen | 28 days | 0.25, 0.5, 1, 1.7, 2.4 mg: $349 | $199 for the first two eligible 0.25/0.5 mg fills; expires December 31, 2026 |
| Wegovy HD pen | 28 days | 7.2 mg: $399 | — |
| Wegovy pill | 30 days | 1.5 mg $149; 4 mg $199; 9/25 mg $299 | — |
| Zepbound vial / KwikPen | 28 days | 2.5 mg $299; 5 mg $399; 7.5 mg $499; 10/12.5/15 mg $699 | 7.5–15 mg Journey offer: $449 first purchase, then refill within 45 days of prior delivery/receipt |
| Foundayo tablet | 30 days | 0.8 mg $149; 2.5 mg $199; 5.5/9 mg $299; 14.5/17.2 mg $349 | Temporary: 2.5 mg $149, 5.5 mg $199 through December 31, 2026. Conditional: 14.5/17.2 mg $299 first purchase, then refill within 45 days of prior delivery/receipt |

Sources supplied for this verification:

- [NovoCare Wegovy](https://www.novocare.com/patient/medicines/wegovy.html)
- [LillyDirect Zepbound](https://www.lilly.com/lillydirect/zepbound)
- [Zepbound savings terms](https://zepbound.lilly.com/savings)
- [Foundayo coverage and savings](https://foundayo.lilly.com/coverage-savings)

Zepbound vial/KwikPen prices do not apply to the separate single-dose pen. Needles/syringes may require a separate purchase. Offer expiry is stored in `effectiveUntil`; it does not guarantee regular prices after an offer/program expires. No separate Journey program expiry was supplied, so none is invented. Approval-status dates were not advanced by this price verification. The announced January 2027 $675 Wegovy **list price** remains separate from current self-pay prices.

### Historical chart evidence

Foundayo's former April 6 launch-price and September 1 temporary-price steps cited only an undated/current manufacturer page. Exact historical start/change dates remain unverified. The separate Foundayo dataset now uses October 5 and November 8 observation markers, retaining the dated April 1 approval/starting-price announcement separately. It does not backdate current offers as documented price cuts.

No generation code was found for the PNG charts in `charts/` and `public/charts/`; their binary files and real observation dates are retained. Displayed price-channel charts are explicitly labelled historical, last observation September 10, 2026; dashed 2027 announcements are not November-verified cash prices. The archived October workbook is not relabelled as a November verification.

### Security review for this update

Reviewed the local diff, repository references to Proliv/proliv4, install/build scripts and dependency lifecycle configuration. No Proliv/proliv4 references or malicious download/execution code were found. Existing installer wrappers use package-manager/locked-tarball tooling; they were not executed for this data update. No dependencies or executable downloads were added.
