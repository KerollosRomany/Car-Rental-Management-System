/* ==========================================================================
   API layer (sample data only)
   Every list and detail page asks window.Api for its data. Each method
   returns a Promise, like fetch() would, so the backend team can replace the
   body with a real request. The comment above each one is the endpoint it
   stands for. Nothing is saved: a reload resets everything.

   Login, register and logout are plain forms and links in the HTML. The
   server handles them, so there is no session code in the front end.

   Business rules the UI assumes (the server owns these):
   - Customers only ever see cars they can book: not in maintenance and, when
     dates are chosen, free for them. A car is free for [from, to) unless an
     approved or active rental overlaps. The return day is exclusive.
   - Total price = days x dailyRate. Days = return date minus pickup date, minimum 1.
   - The customer pays the total when sending the request (paidAmount).
     Rejected by staff, or cancelled before approval: everything is refunded.
     Cancelled after approval (status "refused"): 10% is kept, 90% refunded.
   - Rental status flow: pending -> approved -> active -> completed.
     pending can also become rejected or cancelled; approved can become refused.
   - Handing over the keys sets the car to "rented". Recording a return sets it to "available".
   ========================================================================== */
(function() {
    const DB = window.DB;

    /* ==========================================================================
       Real backend (wayfare-backend). Only the endpoints that exist today are
       connected here:
         POST /api/Authentication/register      POST /api/Authentication/login
         GET  /api/Customer/profile             PUT  /api/Customer/profile
         PUT  /api/Customer/license             PUT  /api/Customer/change-password
         GET  /api/Admin/profile                PUT  /api/Admin/profile
       Everything else below still uses the sample data in data.js until its
       endpoint is built.
       ========================================================================== */
    const API_BASE = String(window.WAYFARE_API || "http://localhost:5290").replace(/\/+$/, "");
    const TOKEN_KEY = "authToken";
    const USER_KEY = "currentUser";

    const store = {
        get(k) {
            try { return localStorage.getItem(k); } catch (e) { return null; }
        },
        set(k, v) {
            try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* private mode */ }
        },
    };

    const Session = {
        token: () => store.get(TOKEN_KEY),
        user() {
            try { return JSON.parse(store.get(USER_KEY) || "null"); } catch (e) { return null; }
        },
        save(token, user) {
            store.set(TOKEN_KEY, token);
            store.set(USER_KEY, JSON.stringify(user));
        },
        clear() {
            store.set(TOKEN_KEY, null);
            store.set(USER_KEY, null);
        },
        isStaff: () => Boolean(Session.token() && (Session.user() || {}).role === "Admin"),
        isCustomer: () => Boolean(Session.token() && (Session.user() || {}).role === "Customer"),
    };

    const isAdminPage = () => document.body && document.body.dataset.layout === "admin";
    const base = () => (document.body && document.body.dataset.base) || "";

    function goToLogin() {
        location.href = isAdminPage() ? `${base()}admin/login.html` : `${base()}login.html`;
    }

    function errorMessage(data, status) {
        if (!data && status === 403)
            return "This account is not allowed to do that (staff only).";
        if (!data) return `Request failed (${status}).`;
        if (typeof data === "string") return data;
        if (data.message || data.Message) return data.message || data.Message;
        // Identity errors come back as [{ code, description }]; validation as { errors: { Field: ["msg"] } }
        if (Array.isArray(data)) return data.map((e) => e.description || e).join(" ");
        if (data.errors) {
            const list = Array.isArray(data.errors) ? data.errors : Object.values(data.errors).flat();
            if (list.length) return list.join(" ");
        }
        return data.title || `Request failed (${status}).`;
    }

    async function request(method, path, { json, form, auth = true } = {}) {
        const headers = { Accept: "application/json" };
        if (auth && Session.token()) headers.Authorization = `Bearer ${Session.token()}`;
        let body;
        if (json !== undefined) {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(json);
        } else if (form) {
            body = form; // multipart: the browser sets the boundary
        }
        let res;
        try {
            res = await fetch(API_BASE + path, { method, headers, body });
        } catch (e) {
            throw Object.assign(new Error(`Could not reach the server at ${API_BASE}. Is the backend running?`), { status: 0 });
        }
        const text = await res.text();
        let data = null;
        if (text) {
            try { data = JSON.parse(text); } catch (e) { data = text; }
        }
        if (res.status === 401 && auth) {
            Session.clear();
            goToLogin();
        }
        if (!res.ok) throw Object.assign(new Error(errorMessage(data, res.status)), { status: res.status, data });
        return data;
    }

    const dateOnly = (v) => (v ? String(v).slice(0, 10) : null);

    // UserProfileDto -> the fields the customer pages read on DB.me
    function applyCustomerProfile(p) {
        Object.assign(DB.me, {
            name: p.fullName || DB.me.name,
            email: p.email || "",
            phone: p.phone || "",
            licenseExpiry: dateOnly(p.licenseExpiry),
            licenseVerified: p.licenseState === "verified",
            licensePhoto: p.licenseImageUrl || "",
            joined: dateOnly(p.joinedAt) || DB.me.joined,
        });
        return DB.me;
    }

    // AdminProfileDto -> DB.staff
    function applyStaffProfile(p) {
        Object.assign(DB.staff, { id: p.adminId, name: p.fullName || DB.staff.name, email: p.email || "", phone: p.phone || "" });
        return DB.staff;
    }

    // Helpers to normalize backend DTOs to what the frontend pages expect
    function normalizeCategory(cat) {
        if (!cat) return "";
        const map = { suv: "SUV", economy: "Economy", luxury: "Luxury", van: "Van" };
        return map[String(cat).toLowerCase()] || String(cat);
    }

    function normalizeCar(c) {
        if (!c) return null;
        const features = Array.isArray(c.features) ?
            c.features :
            typeof c.includedFeature === "string" ?
            c.includedFeature.split(",").map((s) => s.trim()).filter(Boolean) : [];
        const bookedRanges = Array.isArray(c.bookedRanges) ?
            c.bookedRanges.map((b) => ({
                from: dateOnly(b.from || b.startDate || b.StartDate),
                to: dateOnly(b.to || b.endDate || b.EndDate),
                rentalId: b.rentalId || b.id || null,
            })) : [];
        return {
            ...c,
            category: normalizeCategory(c.category),
            features,
            bookedRanges,
            availableForDates: c.availableForDates !== false,
        };
    }


    const capitalize = (s) => (s ? String(s).charAt(0).toUpperCase() + String(s).slice(1).toLowerCase() : "");

    // AdminCarDto (GET /api/admin/cars, POST newcar, PUT editcar) -> the shape admin-cars.js reads.
    // images stays a list of URLs (first = main) like the rest of the site;
    // imageList keeps the ids, which the edit form needs to say which photos to keep.
    function normalizeAdminCar(c) {
        if (!c) return null;
        const imageList = (Array.isArray(c.images) ? c.images : [])
            .map((i) => ({ id: i.id, url: i.url, isMain: Boolean(i.isMain), displayOrder: i.displayOrder }))
            .sort((a, b) => (b.isMain - a.isMain) || (a.displayOrder - b.displayOrder));
        return {
            id: c.id,
            brand: c.brand,
            model: c.model,
            year: c.year,
            category: normalizeCategory(c.carType),
            transmission: capitalize(c.transmission),
            fuel: capitalize(c.fuel),
            seats: c.seats,
            bags: c.luggage,
            dailyRate: c.dailyRate,
            color: c.color || "",
            plate: c.plateNumber,
            status: String(c.status || "").toLowerCase(),
            branchId: c.branchId,
            branchName: c.branchName || "",
            description: c.description || "",
            features: Array.isArray(c.features) ? c.features : [],
            images: imageList.map((i) => i.url),
            imageList,
        };
    }

    // The car form -> multipart fields with the names of AddCarRequestDto / EditCarRequestDto.
    function carFormData(data) {
        const fd = new FormData();
        fd.append("Brand", data.brand);
        fd.append("Model", data.model);
        fd.append("Year", String(data.year));
        fd.append("CarType", data.category); // "SUV" binds to CarType.Suv (case does not matter)
        fd.append("Transmission", data.transmission);
        fd.append("Fuel", data.fuel);
        fd.append("Seat", String(data.seats));
        fd.append("Luggage", String(data.bags || 0));
        fd.append("DailyRate", String(data.dailyRate));
        fd.append("PlateNumber", data.plate);
        fd.append("Color", data.color);
        fd.append("Status", data.status);
        fd.append("BranchId", String(data.branchId));
        fd.append("Description", data.description || "");
        fd.append("IncludedFeature", (data.features || []).join(", "));
        // Edit only: existing photos to keep, in order. Photos left out are deleted.
        (data.keepImageIds || []).forEach((id) => fd.append("KeepImageIds", String(id)));
        // New photo files, in order. On add the first one is the main photo.
        (data.newFiles || []).forEach((file) => fd.append("Images", file, file.name));
        return fd;
    }

    function buildCarsQuery(filters = {}) {
        const params = new URLSearchParams();
        if (filters.from) params.set("from", filters.from);
        if (filters.to) params.set("to", filters.to);
        if (filters.branchId) params.set("branchId", String(filters.branchId));
        if (Array.isArray(filters.category)) {
            filters.category.filter(Boolean).forEach((cat) => params.append("category", cat));
        } else if (filters.category) {
            params.set("category", filters.category);
        }
        if (Array.isArray(filters.fuel)) {
            filters.fuel.filter(Boolean).forEach((f) => params.append("fuel", f));
        } else if (filters.fuel) {
            params.set("fuel", filters.fuel);
        }
        if (filters.transmission && filters.transmission !== "Any") {
            params.set("transmission", filters.transmission);
        }
        if (filters.seats && filters.seats !== "Any") {
            params.set("seats", String(filters.seats));
        }
        if (filters.maxPrice) {
            params.set("maxPrice", String(filters.maxPrice));
        }
        if (filters.sort) {
            params.set("sort", filters.sort);
        }
        if (filters.q && String(filters.q).trim()) {
            params.set("q", String(filters.q).trim());
        }
        const qs = params.toString();
        return qs ? `?${qs}` : "";
    }

    const BLOCKING = ["approved", "active"];
    const CANCEL_FEE = 0.1;

    const wait = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));
    const copy = (x) => JSON.parse(JSON.stringify(x));
    const overlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;
    const findCar = (id) => DB.cars.find((c) => c.id === id);
    const findCustomer = (id) => DB.customers.find((c) => c.id === id);
    const findRental = (id) => DB.rentals.find((r) => r.id === id);
    const nextNumber = (list) =>
        Math.max(0, ...list.map((x) => parseInt(String(x.id).replace(/\D/g, ""), 10) || 0)) + 1;
    const parse = (iso) => {
        const [y, m, d] = iso.split("-").map(Number);
        return new Date(y, m - 1, d);
    };
    const daysBetween = (from, to) => Math.max(1, Math.round((parse(to) - parse(from)) / 86400000));
    const round2 = (n) => Math.round(n * 100) / 100;

    function bookedRanges(carId) {
        return DB.rentals
            .filter((r) => r.carId === carId && BLOCKING.includes(r.status))
            .map((r) => ({ from: r.pickupDate, to: r.returnDate, rentalId: r.id }));
    }

    function isFree(car, from, to) {
        if (car.status === "maintenance") return false;
        return !bookedRanges(car.id).some((b) => overlap(from, to, b.from, b.to));
    }

    // What a cancellation would cost right now (the server decides for real).
    function cancelQuote(rental) {
        const fee = rental.status === "approved" ? round2(rental.paidAmount * CANCEL_FEE) : 0;
        return { fee, refund: round2(rental.paidAmount - fee), lateCancel: rental.status === "approved" };
    }

    function paymentState(r) {
        if (!r.refundedAmount) return "paid";
        return r.refundedAmount >= r.paidAmount ? "refunded" : "partial";
    }

    function withRelations(rental) {
        return {
            ...copy(rental),
            car: copy(findCar(rental.carId)),
            customer: copy(findCustomer(rental.customerId)),
            paymentStatus: paymentState(rental),
        };
    }

    const Api = {
        /* ----- Reference data ----- */

        // GET /api/branches
        async getLocations() {
            const list = await request("GET", "/api/branches", { auth: false });
            return Array.isArray(list) ? list : [];
        },

        /* ----- Cars ----- */

        // GET /api/customer/cars?from=2026-10-02&to=2026-10-05&type=suv&fuel=hybrid&transmission=automatic&seats=5&maxPrice=100&sort=price-asc
        // Customers only get cars they can book: without dates, cars that are available now.
        async getCars(filters = {}) {
            const qs = buildCarsQuery(filters);
            const list = await request("GET", `/api/car${qs}`, { auth: false });
            return Array.isArray(list) ? list.map(normalizeCar) : [];
        },

        // GET /api/admin/cars   (staff only: every car, whatever its status)
        async getFleet() {
            const list = await request("GET", "/api/admin/cars");
            return Array.isArray(list) ? list.map(normalizeAdminCar) : [];
        },

        // GET /api/car/:id
        async getCar(id) {
            try {
                const car = await request("GET", `/api/car/${id}`, { auth: false });
                return normalizeCar(car);
            } catch (e) {
                if (e && e.status === 404) return null;
                throw e;
            }
        },

        // POST /api/admin/newcar  or  PUT /api/admin/editcar/:id   (staff only, multipart form data)
        // data.keepImageIds: existing photos to keep (edit only). data.newFiles: new File objects.
        // The server orders photos as: kept ones first, then the new files. The first is the main photo.
        async saveCar(data) {
            const form = carFormData(data);
            const saved = data.id ?
                await request("PUT", `/api/admin/editcar/${data.id}`, { form }) :
                await request("POST", "/api/admin/newcar", { form });
            return normalizeAdminCar(saved);
        },

        // DELETE /api/admin/deletecar/:id   (staff only). A car with rental history answers 409.
        async deleteCar(id) {
            await request("DELETE", `/api/admin/deletecar/${id}`);
            return true;
        },

        /* ----- Rentals ----- */

        // POST /api/rentalrequests   body: { carId, pickupDate, returnDate, branchId }
        async createRental(input) {
            const carId = input.carId;
            const pickupDate = input.pickupDate;
            const returnDate = input.returnDate;
            const branchId = input.branchId;

            const payload = {
                carId: Number(carId),
                pickupDate: pickupDate,
                returnDate: returnDate,
            };
            if (branchId !== undefined && branchId !== null && branchId !== "") {
                payload.branchId = Number(branchId);
            }

            const created = await request("POST", "/api/rentalrequest", { json: payload, auth: true });
            const pickup = dateOnly(created.startDate ? created.startDate : created.pickupDate) || pickupDate;
            const ret = dateOnly(created.endDate ? created.endDate : created.returnDate) || returnDate;
            const days = created.days ? created.days : daysBetween(pickup, ret);
            const total = created.totalAmount !== undefined && created.totalAmount !== null ?
                created.totalAmount :
                (created.total !== undefined && created.total !== null ? created.total : 0);

            return {
                id: created.reference ? created.reference : created.id,
                rentalId: created.id,
                carId: created.carId !== undefined && created.carId !== null ? created.carId : Number(carId),
                branchId: created.branchId,
                branchName: created.branchName,
                pickupDate: pickup,
                returnDate: ret,
                days: days,
                total: total,
                paidAmount: created.paidAmount !== undefined && created.paidAmount !== null ? created.paidAmount : total,
                refundedAmount: created.refundedAmount !== undefined && created.refundedAmount !== null ? created.refundedAmount : 0,
                status: String(created.status ? created.status : "pending").toLowerCase(),
            };
        },

        // Customers: GET /api/customer/rentals     Staff: GET /api/admin/rentals?status=pending
        async getRentals({ customerId, status } = {}) {
            await wait();
            let list = DB.rentals.slice();
            if (customerId) list = list.filter((r) => r.customerId === customerId);
            if (status) list = list.filter((r) => (Array.isArray(status) ? status.includes(r.status) : r.status === status));
            return list.map(withRelations);
        },

        // Shown in the cancel dialog before the customer confirms.
        cancelQuote,

        // pending:  PUT /api/customer/cancelrental/:id   (full refund)
        // approved: PUT /api/customer/refuserental/:id   (10% kept, 90% refunded)
        // Customers can only cancel their own rentals.
        async cancelRental(id) {
            await wait(350);
            const r = findRental(id);
            if (!r || !["pending", "approved"].includes(r.status)) throw new Error("This rental can no longer be cancelled.");
            const { refund } = cancelQuote(r);
            r.status = r.status === "approved" ? "refused" : "cancelled";
            r.refundedAmount = refund;
            return withRelations(r);
        },

        // Staff actions, one endpoint each:
        // PUT /api/admin/approve/:id
        // PUT /api/admin/reject/:id          body: { reason }
        // PUT /api/admin/handoverkeys/:id
        // PUT /api/admin/return/:id          body: { returnedAt, notes }
        async setRentalStatus(id, status, extra = {}) {
            await wait(350);
            const r = findRental(id);
            if (!r) throw new Error("Rental not found.");
            const car = findCar(r.carId);
            r.status = status;
            if (status === "active") {
                r.pickedUpAt = DB.today;
                car.status = "rented";
            }
            if (status === "completed") {
                r.returnedAt = extra.returnedAt || DB.today;
                if (extra.notes) r.notes = extra.notes;
                car.status = "available";
            }
            if (status === "rejected") {
                r.reason = extra.reason || "Request could not be accepted.";
                r.refundedAmount = r.paidAmount;
            }
            return withRelations(r);
        },

        /* ----- Customers ----- */

        // GET /api/admin/customers   (staff only)
        async getCustomers() {
            await wait();
            return DB.customers.map((c) => ({
                ...copy(c),
                rentalCount: DB.rentals.filter((r) => r.customerId === c.id && ["approved", "active", "completed"].includes(r.status)).length,
            }));
        },

        // PUT /api/admin/customers/:id/license   body: { verified }
        // Customers are never added by staff: they appear when they register.
        async setLicenseVerified(id, verified) {
            await wait();
            const c = findCustomer(id);
            c.licenseVerified = Boolean(verified);
            return copy(c);
        },

        /* ----- Sign in and register (real backend) ----- */

        session: Session,

        // POST /api/Authentication/login   body: { email, password }  ->  { token, roles }
        async login({ email, password }) {
            const data = await request("POST", "/api/Authentication/login", { json: { email, password }, auth: false });
            const roles = data.roles || [];
            const role = roles.includes("Admin") ? "Admin" : roles.includes("Customer") ? "Customer" : roles[0] || "";
            Session.save(data.token, { email, role, roles });
            return { email, role, roles };
        },

        // POST /api/Authentication/register   multipart: Name, Email, Phone, Password, LicenseExpiry, LicensePhoto
        // The backend does not return a token, so the caller logs in afterwards.
        async register(formData) {
            return request("POST", "/api/Authentication/register", { form: formData, auth: false });
        },

        logout() {
            Session.clear();
        },

        // Runs before the page scripts: loads the signed-in user's real profile.
        async boot() {
            const layout = document.body.dataset.layout;
            const page = document.body.dataset.page;
            const signedIn = layout === "admin" ? Session.isStaff() : Session.isCustomer();
            DB.signedIn = false;

            if (!signedIn) {
                if (page === "profile") {
                    goToLogin();
                    return new Promise(() => {});
                }
                return;
            }

            // Mark as signed in immediately from the stored session
            const savedUser = Session.user() || {};
            if (layout !== "admin") {
                DB.me.email = savedUser.email || DB.me.email;
                DB.me.name = (savedUser.email || "User").split("@")[0];
            }
            DB.signedIn = true;

            try {
                if (layout === "admin") applyStaffProfile(await request("GET", "/api/Admin/profile"));
                else applyCustomerProfile(await request("GET", "/api/Customer/profile"));
            } catch (e) {
                console.warn("Could not refresh profile from API:", e);
                if (page === "profile") throw e;
            }
        },
        /* ----- Profile (real backend) ----- */

        // PUT /api/Customer/profile   body: { fullName, email, phone }
        async updateProfile(data) {
            return applyCustomerProfile(
                await request("PUT", "/api/Customer/profile", { json: { fullName: data.name, email: data.email, phone: data.phone } })
            );
        },

        // PUT /api/Customer/license   multipart: LicenseExpiry and (optional) LicensePhoto file. Resets the staff check.
        // The endpoint only answers { message }, so the profile is read again afterwards.
        async updateLicense(data) {
            const fd = new FormData();
            fd.append("LicenseExpiry", data.licenseExpiry);
            if (data.licenseFile) fd.append("LicensePhoto", data.licenseFile, data.licenseFile.name);
            await request("PUT", "/api/Customer/license", { form: fd });
            return applyCustomerProfile(await request("GET", "/api/Customer/profile"));
        },

        // PUT /api/Admin/profile   body: { fullName, email, phone }
        async updateStaffProfile(data) {
            return applyStaffProfile(
                await request("PUT", "/api/Admin/profile", { json: { fullName: data.name, email: data.email, phone: data.phone } })
            );
        },

        // PUT /api/Customer/change-password   body: { currentPassword, newPassword }
        // Customers only: the backend has no change-password endpoint for staff yet.
        async changePassword({ currentPassword, newPassword }) {
            if (isAdminPage()) throw new Error("Changing the staff password is not available yet (no backend endpoint).");
            await request("PUT", "/api/Customer/change-password", { json: { currentPassword, newPassword } });
            return true;
        },

        /* ----- Payments ----- */

        // GET /api/admin/payments   (staff only)
        // One row per rental: what was paid and what was refunded. The server records
        // both on its own, so there is nothing to enter by hand.
        async getPayments() {
            await wait();
            return DB.rentals
                .filter((r) => r.paidAmount > 0)
                .map((r) => ({
                    rentalId: r.id,
                    rentalStatus: r.status,
                    paidAt: r.paidAt,
                    paid: r.paidAmount,
                    refunded: r.refundedAmount,
                    kept: round2(r.paidAmount - r.refundedAmount),
                    status: paymentState(r), // paid | partial | refunded
                    customer: copy(findCustomer(r.customerId)),
                    car: copy(findCar(r.carId)),
                }))
                .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1));
        },

        /* ----- Dashboard ----- */

        // No endpoint of its own: the dashboard works these numbers out from the staff lists
        // (cars, rentals, payments, customers). Replace the body with those four calls.
        async getDashboard() {
            await wait(200);
            const since = DB.helpers.day(-30);
            const recent = DB.rentals.filter((r) => r.paidAt >= since && r.paidAmount - r.refundedAmount > 0);
            const rentals = DB.rentals.map(withRelations);
            return {
                cars: {
                    total: DB.cars.length,
                    available: DB.cars.filter((c) => c.status === "available").length,
                    rented: DB.cars.filter((c) => c.status === "rented").length,
                    maintenance: DB.cars.filter((c) => c.status === "maintenance").length,
                },
                customers: DB.customers.length,
                pending: rentals.filter((r) => r.status === "pending"),
                active: rentals.filter((r) => r.status === "active"),
                revenue: { amount: round2(recent.reduce((sum, r) => sum + r.paidAmount - r.refundedAmount, 0)), count: recent.length, days: 30 },
                monthly: copy(DB.monthly),
                byCategory: DB.categories.map((name) => ({
                    name,
                    count: DB.cars.filter((c) => c.category === name).length,
                })),
            };
        },

        // Used by pages, not an endpoint: shared date helpers
        daysBetween,
        parse,
    };

    window.Api = Api;
})();