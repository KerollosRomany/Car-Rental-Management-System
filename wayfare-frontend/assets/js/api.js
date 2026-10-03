/* ==========================================================================
   API layer (sample data only)
   Every list and detail page asks window.Api for its data. Each method
   returns a Promise, like fetch() would, so the backend team can replace the
   body with a real request. The comment above each one is the suggested
   endpoint. Nothing is saved: a reload resets everything.

   Login, register and logout are plain forms and links in the HTML. The
   server handles them, so there is no session code in the front end.

   Business rules the UI assumes (move these to the server):
   - A car is free for [from, to) unless an approved or active rental overlaps.
     The return day is exclusive, so same-day turnover is allowed.
   - A car in maintenance is never free.
   - Total price = days x dailyRate. Days = return date minus pickup date, minimum 1.
   - Rental status flow: pending -> approved -> active -> completed.
     A pending request can also become rejected or cancelled.
   - Picking up sets the car to "rented". Recording a return sets it to "available".
   ========================================================================== */
(function () {
  const DB = window.DB;
  const BLOCKING = ["approved", "active"];

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

  function bookedRanges(carId) {
    return DB.rentals
      .filter((r) => r.carId === carId && BLOCKING.includes(r.status))
      .map((r) => ({ from: r.pickupDate, to: r.returnDate, rentalId: r.id }));
  }

  function isFree(car, from, to) {
    if (car.status === "maintenance") return false;
    return !bookedRanges(car.id).some((b) => overlap(from, to, b.from, b.to));
  }

  function withRelations(rental) {
    return {
      ...copy(rental),
      car: copy(findCar(rental.carId)),
      customer: copy(findCustomer(rental.customerId)),
      payment: copy(DB.payments.find((p) => p.rentalId === rental.id) || null),
    };
  }

  const Api = {
    /* ----- Reference data ----- */

    // GET /api/locations
    async getLocations() {
      await wait(60);
      return copy(DB.locations);
    },

    /* ----- Cars ----- */

    // GET /api/cars?category=SUV&maxPrice=100&transmission=Automatic&seats=5&fuel=Hybrid&from=2026-10-02&to=2026-10-05&sort=price-asc
    async getCars(filters = {}) {
      await wait();
      const f = filters;
      let list = DB.cars.map((c) => {
        const out = copy(c);
        out.availableForDates = f.from && f.to ? isFree(c, f.from, f.to) : c.status === "available";
        return out;
      });
      if (f.q) {
        const q = f.q.toLowerCase();
        list = list.filter((c) => `${c.brand} ${c.model} ${c.category}`.toLowerCase().includes(q));
      }
      if (f.category && f.category.length) list = list.filter((c) => f.category.includes(c.category));
      if (f.maxPrice) list = list.filter((c) => c.dailyRate <= f.maxPrice);
      if (f.transmission && f.transmission !== "Any") list = list.filter((c) => c.transmission === f.transmission);
      if (f.seats && f.seats !== "Any") {
        if (f.seats === "7+") list = list.filter((c) => c.seats >= 7);
        else if (f.seats === "5") list = list.filter((c) => c.seats === 5);
        else if (f.seats === "2-4") list = list.filter((c) => c.seats <= 4);
      }
      if (f.fuel && f.fuel.length) list = list.filter((c) => f.fuel.includes(c.fuel));
      if (f.availableOnly) list = list.filter((c) => c.availableForDates);
      const order = { "price-asc": (a, b) => a.dailyRate - b.dailyRate, "price-desc": (a, b) => b.dailyRate - a.dailyRate };
      if (order[f.sort]) list.sort(order[f.sort]);
      else list.sort((a, b) => Number(b.availableForDates) - Number(a.availableForDates));
      return list;
    },

    // GET /api/cars/:id   (includes bookedRanges so the calendar can grey out days)
    async getCar(id) {
      await wait(160);
      const car = findCar(id);
      if (!car) return null;
      return { ...copy(car), bookedRanges: bookedRanges(id) };
    },

    // POST /api/cars  or  PUT /api/cars/:id   (staff only)
    async saveCar(data) {
      await wait();
      if (data.id) {
        Object.assign(findCar(data.id), data);
        return copy(findCar(data.id));
      }
      const id = `c${String(nextNumber(DB.cars)).padStart(2, "0")}`;
      const car = {
        images: [], features: [], description: "", mileage: 0, doors: 4, bags: 2, color: "",
        ...data, id,
      };
      DB.cars.unshift(car);
      return copy(car);
    },

    // DELETE /api/cars/:id   (staff only)
    async deleteCar(id) {
      await wait();
      const i = DB.cars.findIndex((c) => c.id === id);
      if (i > -1) DB.cars.splice(i, 1);
      return true;
    },

    /* ----- Rentals ----- */

    // POST /api/rentals   body: { carId, pickupDate, returnDate, pickupLocation }
    async createRental({ carId, pickupDate, returnDate, pickupLocation }) {
      await wait(500);
      const car = findCar(carId);
      if (!car || !isFree(car, pickupDate, returnDate)) {
        throw new Error("This car is no longer available for those dates.");
      }
      const days = daysBetween(pickupDate, returnDate);
      const rental = {
        id: `R-${nextNumber(DB.rentals)}`,
        customerId: DB.me.id,
        carId,
        pickupDate,
        returnDate,
        days,
        total: days * car.dailyRate,
        pickupLocation,
        status: "pending",
        createdAt: DB.today,
      };
      DB.rentals.unshift(rental);
      return withRelations(rental);
    },

    // GET /api/rentals?customerId=u01&status=active   (customers only see their own)
    async getRentals({ customerId, status } = {}) {
      await wait();
      let list = DB.rentals.slice();
      if (customerId) list = list.filter((r) => r.customerId === customerId);
      if (status) list = list.filter((r) => (Array.isArray(status) ? status.includes(r.status) : r.status === status));
      return list.map(withRelations);
    },

    // GET /api/rentals/:id
    async getRental(id) {
      await wait(120);
      const r = findRental(id);
      return r ? withRelations(r) : null;
    },

    // PATCH /api/rentals/:id/status   body: { status, ...extra }
    // approve -> approved, pickup -> active, return -> completed, reject, cancel
    async setRentalStatus(id, status, extra = {}) {
      await wait(350);
      const r = findRental(id);
      if (!r) throw new Error("Rental not found.");
      const car = findCar(r.carId);
      r.status = status;
      if (status === "approved") {
        if (!DB.payments.some((p) => p.rentalId === id)) {
          DB.payments.unshift({
            id: `P-${nextNumber(DB.payments)}`, rentalId: id, customerId: r.customerId,
            amount: r.total, method: "Card", status: "pending", date: DB.today,
          });
        }
      }
      if (status === "active") {
        r.pickedUpAt = DB.today;
        car.status = "rented";
      }
      if (status === "completed") {
        r.returnedAt = extra.returnedAt || DB.today;
        r.condition = extra.condition || "Good";
        if (extra.extraCharge) {
          r.extraCharge = Number(extra.extraCharge);
          r.total += r.extraCharge;
        }
        if (extra.notes) r.notes = extra.notes;
        car.status = "available";
      }
      if (status === "rejected") r.reason = extra.reason || "Request could not be accepted.";
      return withRelations(r);
    },

    /* ----- Customers ----- */

    // GET /api/customers   (staff only)
    async getCustomers() {
      await wait();
      return DB.customers.map((c) => ({
        ...copy(c),
        rentalCount: DB.rentals.filter((r) => r.customerId === c.id && r.status !== "rejected" && r.status !== "cancelled").length,
      }));
    },

    // POST /api/customers  or  PUT /api/customers/:id
    async saveCustomer(data) {
      await wait();
      if (data.id) {
        Object.assign(findCustomer(data.id), data);
        return copy(findCustomer(data.id));
      }
      const customer = {
        licenseVerified: false, joined: DB.today, licenseExpiry: "", ...data,
        id: `u${String(nextNumber(DB.customers)).padStart(2, "0")}`,
      };
      DB.customers.unshift(customer);
      return copy(customer);
    },

    // PUT /api/me
    async updateProfile(data) {
      await wait(400);
      Object.assign(DB.me, data);
      return copy(DB.me);
    },

    /* ----- Payments ----- */

    // GET /api/payments   (staff only)
    async getPayments() {
      await wait();
      return DB.payments.map((p) => ({
        ...copy(p),
        customer: copy(findCustomer(p.customerId)),
        rental: copy(findRental(p.rentalId)),
        car: copy(findCar(findRental(p.rentalId).carId)),
      }));
    },

    // POST /api/payments   body: { rentalId, amount, method, status, date }
    async savePayment(data) {
      await wait();
      const rental = findRental(data.rentalId);
      const existing = DB.payments.find((p) => p.id === data.id);
      if (existing) {
        Object.assign(existing, data);
        return copy(existing);
      }
      const payment = {
        ...data,
        id: `P-${nextNumber(DB.payments)}`,
        customerId: rental.customerId,
      };
      DB.payments.unshift(payment);
      return copy(payment);
    },

    // PATCH /api/payments/:id   body: { status }
    async setPaymentStatus(id, status) {
      await wait(250);
      const p = DB.payments.find((x) => x.id === id);
      p.status = status;
      return copy(p);
    },

    /* ----- Dashboard ----- */

    // GET /api/dashboard   (staff only)
    async getDashboard() {
      await wait(200);
      const since = DB.helpers.day(-30);
      const paid = DB.payments.filter((p) => p.status === "paid" && p.date >= since);
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
        revenue: { amount: paid.reduce((sum, p) => sum + p.amount, 0), count: paid.length, days: 30 },
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
