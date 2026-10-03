# Wayfare: car rental front end

Front end only. No server, no database, no login logic. The pages are linked together and filled with sample data so the backend team can see every screen and wire it up.

## Run it

Open `index.html` in a browser. It needs internet for fonts, icons, the date picker and the car photos (all loaded from CDNs).

If you prefer a local server:

```bash
npx serve .
```

## What is in it

**Customer site** (dark theme)

| Page | File | What it shows |
|---|---|---|
| Home | `index.html` | Hero, search (location, dates, type), popular cars, how it works |
| Cars | `cars.html` | Filters, sorting, availability for chosen dates |
| Car details | `car.html?id=c05` | Gallery, specs, calendar with booked days, price, request flow |
| My rentals | `my-rentals.html` | Summary, current rental, tabs, details drawer, cancel |
| Profile | `profile.html` | Personal details, driving license, password |
| Log in | `login.html` | Customer login form |
| Create account | `register.html` | Registration form with license details |

**Staff console** (light theme, in `admin/`)

| Page | File | What it shows |
|---|---|---|
| Staff login | `admin/login.html` | Staff login form |
| Dashboard | `admin/index.html` | Key numbers, charts, waiting requests, cars due back |
| Cars | `admin/cars.html` | Add, edit, delete cars, photo upload |
| Rentals | `admin/rentals.html` | Requests, approved, active, history. Approve, reject, hand over keys, record return |
| Customers | `admin/customers.html` | Contact details, license check, rental history |
| Payments | `admin/payments.html` | Record a payment, mark paid, refund |

## How the pages connect

Plain links, no router.

- Forms on the three login and register pages have an `action`. Today it is the page to open next.
- The header user menu links to `my-rentals.html`, `profile.html` and `login.html` (log out).
- Car cards link to `car.html?id=...` and carry the chosen dates in the query string (`from`, `to`, `loc`).
- The staff sidebar links to the five staff pages. "Log out" goes to `admin/login.html`.

## Where the backend plugs in

1. **Login, register, log out.** Set `action` and `method="post"` on the form (`data-auth-form` in `login.html`, `register.html`, `admin/login.html`) and delete the redirect at the bottom of `assets/js/pages/auth.js`. The browser then submits the form for real. The customer pages always show a signed-in header ("Ahmed Ali"). Replace that with the real user.
2. **Data.** `assets/js/api.js` is the only place pages ask for data. Each method returns a Promise and has the suggested endpoint in a comment above it. Replace the body with `fetch()` and delete `assets/js/data.js`. Nothing is saved: a reload resets the sample data.
3. **Server-side templates instead.** If you render pages on the server, copy the markup out of the JS template strings (`assets/js/render.js` for the car card and rental drawer, `assets/js/pages/*.js` for each page) and loop over your data.

Every dynamic value in a template goes through `App.esc()`. Keep doing that.

### Data shape (see `assets/js/data.js`)

- **Car**: `id, brand, model, year, category, transmission, fuel, seats, doors, bags, dailyRate, status, plate, color, mileage, images[], features[], description`
- **Customer**: `id, name, email, phone, licenseNumber, licenseExpiry, licenseVerified, joined`
- **Rental**: `id, customerId, carId, pickupDate, returnDate, days, total, pickupLocation, status, createdAt` plus `pickedUpAt, returnedAt, condition, extraCharge, notes, reason`
- **Payment**: `id, rentalId, customerId, amount, method, status, date`

Statuses: car `available | rented | maintenance`, rental `pending | approved | active | completed | rejected | cancelled`, payment `paid | pending | refunded`.

### Rules the UI assumes (move them to the server)

- A car is free for `[from, to)` unless an approved or active rental overlaps. The return day is exclusive.
- A car in maintenance is never free.
- Total = days x daily rate. Days = return date minus pickup date, minimum 1.
- Flow: pending, approved, active, completed. A pending request can also be rejected or cancelled.
- Handing over keys sets the car to rented. Recording a return sets it to available.

## Design system

- **Look:** Obsidian (near-black) with one accent, Cognac. Pearl text. Crisp 2 to 6 px corners, hairline borders, almost no shadow.
- **Signature:** the stitch, a dashed seam like leather stitching. It appears in the logo, the booking panel, dividers and progress lines.
- **Logo:** `assets/img/logo-mark.svg`, a key-tag badge with a stitched edge. The wordmark is live text (Archivo, wide, tracked) in `.brand-word`.
- **Type:** Archivo (wide) for headings, Geist for text, Geist Mono for IDs and plates.
- **Themes:** the customer site is dark by default. Add `class="theme-light"` to `<body>` for the light staff theme. Both use the same token names.
- **Change the accent:** edit `--accent` and friends in `assets/css/tokens.css`. Components only use semantic tokens (`--surface`, `--text`, `--accent`, ...), never raw colours.
- **Chart colour:** `--chart-1` passes the contrast, lightness and chroma checks on white. Re-check it if you change the accent.
- **Brand name:** `App.brand` in `assets/js/ui.js`, plus the `<title>` of each page.

## Folder map

```
index.html cars.html car.html my-rentals.html profile.html login.html register.html
admin/            staff pages
assets/css/       tokens, base, components, layout, pages, datepicker (app.css imports them)
assets/js/        data.js (sample data), api.js (data calls), ui.js (layout, forms, dialogs),
                  render.js (car card, rental drawer), charts.js, admin-actions.js
assets/js/pages/  one small script per page
assets/img/       logo
```

## Third-party

Phosphor icons, Flatpickr (date picker), Google Fonts (Archivo, Geist). Car photos are hot-linked from Unsplash. Swap them for your own files when you have them.
