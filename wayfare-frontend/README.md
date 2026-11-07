# Wayfare: car rental front end

Front end only. No server, no database, no login logic. The pages are linked together and filled with sample data so the backend team can see every screen and wire it up.

## Run it

Open `index.html` in a browser. It needs internet for fonts, icons, the date picker and the car photos (all loaded from CDNs).

If you prefer a local server:

```bash
npx serve .
```

## What is in it

**Customer site** (light theme, dark navy footer and photo panels)

| Page | File | What it shows |
|---|---|---|
| Home | `index.html` | Hero, search (location, dates, type), popular cars, how it works |
| Cars | `cars.html` | Only cars that can be booked, with filters, sorting and dates |
| Car details | `car.html?id=c05` | Gallery, specs, calendar with booked days, price, request flow |
| My rentals | `my-rentals.html` | Summary, current rental, tabs, details drawer, cancel |
| Profile | `profile.html` | Personal details, driving license photo and expiry, password |
| Log in | `login.html` | Customer login form |
| Create account | `register.html` | Registration form with a driving license photo upload |

**Staff console** (light theme, in `admin/`)

| Page | File | What it shows |
|---|---|---|
| Staff login | `admin/login.html` | Staff login form |
| Dashboard | `admin/index.html` | Key numbers, charts, waiting requests, cars due back |
| Cars | `admin/cars.html` | Add, edit, delete cars, up to 8 photos per car |
| Rentals | `admin/rentals.html` | Requests, approved, active, history. Approve, reject, hand over keys, record return (date and notes) |
| Customers | `admin/customers.html` | Contact details, license check, rental history |
| Payments | `admin/payments.html` | Read only: what each rental paid, refunded and kept |
| My profile | `admin/profile.html` | Staff name, email, phone and password |

## How the pages connect

Plain links, no router.

- Forms on the three login and register pages have an `action`. Today it is the page to open next.
- The header user menu links to `my-rentals.html`, `profile.html` and `login.html` (log out).
- Car cards link to `car.html?id=...` and carry the chosen dates in the query string (`from`, `to`, `loc`).
- The staff sidebar links to the five staff pages. "Log out" goes to `admin/login.html`.

## Where the backend plugs in

1. **Login, register, log out.** Set `action` and `method="post"` on the form (`data-auth-form` in `login.html`, `register.html`, `admin/login.html`) and delete the redirect at the bottom of `assets/js/pages/auth.js`. The browser then submits the form for real. The customer pages always show a signed-in header ("Ahmed Ali"). Replace that with the real user.
2. **Data.** `assets/js/api.js` is the only place pages ask for data. Each method returns a Promise and has its endpoint in a comment above it. Replace the body with `fetch()` and delete `assets/js/data.js`. Nothing is saved: a reload resets the sample data. The team tracker lists every endpoint with its request, response and rules.
3. **Server-side templates instead.** If you render pages on the server, copy the markup out of the JS template strings (`assets/js/render.js` for the car card and rental drawer, `assets/js/pages/*.js` for each page) and loop over your data.

Every dynamic value in a template goes through `App.esc()`. Keep doing that.

### Data shape (see `assets/js/data.js`)

These are the shapes the pages read. Names follow the backend models in the team repo.

- **Car**: `id, brand, model, year, category, transmission, fuel, seats, bags, dailyRate, status, plate, color, images[], features[], description`. The first image is the main photo.
- **Customer**: `id, name, email, phone, licensePhoto, licenseExpiry, licenseVerified, joined`
- **Rental**: `id, customerId, carId, pickupDate, returnDate, days, total, pickupLocation, status, createdAt, paidAmount, refundedAmount, paidAt` plus `pickedUpAt, returnedAt, notes, reason` once they apply
- **Payment**: there is no payment record. The money lives on the rental (`paidAmount`, `refundedAmount`). The payments page is read only and shows one row per rental.

Statuses: car `available | rented | maintenance`, rental `pending | approved | active | completed | rejected | cancelled | refused`. A payment shows as `paid | partial | refunded`, worked out from the two amounts.

### Rules the UI assumes (the server owns these)

- Customers only get cars they can book. Without dates that is every car that is available now. With dates it is every car that is not in maintenance and has no approved or active rental overlapping `[from, to)`. The return day is exclusive.
- Total = days x daily rate. Days = return date minus pickup date, minimum 1.
- The customer pays the total when sending the request (`paidAmount`). Rejected by staff, or cancelled before approval: all of it is refunded. Cancelled after approval: status `refused`, 10% is kept and 90% refunded.
- Flow: pending, approved, active, completed. A pending request can also be rejected or cancelled. An approved one can be refused (cancelled by the customer).
- Handing over the keys sets the car to rented. Recording a return sets it to available.

## Design system

- **Look:** Cloud Cobalt. A light page with white panels, deep navy text and dark panels, and one accent, cobalt. Crisp 2 to 6 px corners, hairline borders, almost no shadow.
- **Signature:** the stitch, a dashed seam like a road marking. It appears in the booking panel, dividers and progress lines.
- **Logo:** the Wayfare plate, a licence plate that reads WAYFARE with a cobalt W band. `App.logo` in `assets/js/ui.js` holds the inline SVG, which reads its colours from `--logo-*` tokens, so one file works on light and dark panels. Static copies: `assets/img/logo-plate.svg`, `logo-plate-on-dark.svg`. The favicon is `logo-icon.svg`. Static pages mark the spot with `<span data-logo></span>`.
- **Type:** Archivo (wide) for headings, Geist for text, Geist Mono for IDs and plates.
- **Themes:** one light theme for the customer site and the staff console. Dark panels (footer, hero, call-to-action, sign-in photo, staff sidebar) redefine the same token names in `tokens.css`, so components never use raw palette steps. Every page body carries `class="theme-light"`, which switches on the light form-control rules.
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
assets/img/       logo plate (light and dark) and favicon
```

## Third-party

Phosphor icons, Flatpickr (date picker), Google Fonts (Archivo, Geist). Car photos are hot-linked from Unsplash. Swap them for your own files when you have them.
