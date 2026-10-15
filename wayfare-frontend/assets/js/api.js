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
(function () {
  const DB = window.DB;
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

    // GET /api/branches   (the four seeded branches)
    async getLocations() {
      await wait(60);
      return copy(DB.locations);
    },

    /* ----- Cars ----- */

    // GET /api/cars?from=2026-10-02&to=2026-10-05&type=SUV&fuel=Hybrid&transmission=Automatic&seats=5&maxPrice=100&sort=price-asc
    // Customers only get cars they can book: without dates, cars that are available now.
    async getCars(filters = {}) {
      await wait();
      const f = filters;
      let list = DB.cars
        .filter((c) => (f.from && f.to ? isFree(c, f.from, f.to) : c.status === "available"))
        .map((c) => ({ ...copy(c), availableForDates: true }));
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
      const order = { "price-asc": (a, b) => a.dailyRate - b.dailyRate, "price-desc": (a, b) => b.dailyRate - a.dailyRate };
      if (order[f.sort]) list.sort(order[f.sort]);
      return list;
    },

    // GET /api/admin/cars   (staff only: every car, whatever its status)
    async getFleet() {
      await wait();
      return copy(DB.cars);
    },

    // GET /api/cars/:id   (includes bookedRanges so the calendar can grey out days)
    async getCar(id) {
      await wait(160);
      const car = findCar(id);
      if (!car) return null;
      return { ...copy(car), bookedRanges: bookedRanges(id) };
    },

    // POST /api/admin/cars  or  PUT /api/admin/cars/:id   (staff only, multipart form data)
    // images: the first one is the main photo, the rest keep their order.
    async saveCar(data) {
      await wait();
      if (data.id) {
        Object.assign(findCar(data.id), data);
        return copy(findCar(data.id));
      }
      const id = `c${String(nextNumber(DB.cars)).padStart(2, "0")}`;
      const car = {
        images: [], features: [], description: "", bags: 2, color: "",
        ...data, id,
      };
      DB.cars.unshift(car);
      return copy(car);
    },

    // DELETE /api/admin/cars/:id   (staff only)
    async deleteCar(id) {
      await wait();
      const i = DB.cars.findIndex((c) => c.id === id);
      if (i > -1) DB.cars.splice(i, 1);
      return true;
    },

    /* ----- Rentals ----- */

    // POST /api/rentals   body: { carId, pickupDate, returnDate, pickupLocation }
    // The server charges the total here (paidAmount) and stores the request as pending.
    async createRental({ carId, pickupDate, returnDate, pickupLocation }) {
      await wait(500);
      const car = findCar(carId);
      if (!car || !isFree(car, pickupDate, returnDate)) {
        throw new Error("This car is no longer available for those dates.");
      }
      const days = daysBetween(pickupDate, returnDate);
      const total = days * car.dailyRate;
      const rental = {
        id: `R-${nextNumber(DB.rentals)}`,
        customerId: DB.me.id,
        carId,
        pickupDate,
        returnDate,
        days,
        total,
        pickupLocation,
        status: "pending",
        createdAt: DB.today,
        paidAmount: total,
        refundedAmount: 0,
        paidAt: DB.today,
      };
      DB.rentals.unshift(rental);
      return withRelations(rental);
    },

    // Customers: GET /api/rentals/my        Staff: GET /api/admin/rentals?status=pending
    async getRentals({ customerId, status } = {}) {
      await wait();
      let list = DB.rentals.slice();
      if (customerId) list = list.filter((r) => r.customerId === customerId);
      if (status) list = list.filter((r) => (Array.isArray(status) ? status.includes(r.status) : r.status === status));
      return list.map(withRelations);
    },

    // Shown in the cancel dialog before the customer confirms.
    cancelQuote,

    // PUT /api/rentals/:id/cancel   (customer, own rental only)
    // pending -> cancelled with a full refund; approved -> refused, 10% kept.
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
    // PUT /api/admin/rentals/:id/approve
    // PUT /api/admin/rentals/:id/reject     body: { reason }
    // PUT /api/admin/rentals/:id/handover
    // PUT /api/admin/rentals/:id/return     body: { returnedAt, notes }
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

    // Walk-in customers and edits: POST /api/admin/customers  or  PUT /api/admin/customers/:id
    // License check only:          PUT /api/admin/customers/:id/license   body: { verified }
    async saveCustomer(data) {
      await wait();
      if (data.id) {
        Object.assign(findCustomer(data.id), data);
        return copy(findCustomer(data.id));
      }
      const customer = {
        licenseVerified: false, joined: DB.today, licenseExpiry: "", licensePhoto: "", ...data,
        id: `u${String(nextNumber(DB.customers)).padStart(2, "0")}`,
      };
      DB.customers.unshift(customer);
      return copy(customer);
    },

    /* ----- Profile (customers and staff) ----- */

    // PUT /api/profile   body: { name, email, phone }
    async updateProfile(data) {
      await wait(400);
      Object.assign(DB.me, data);
      return copy(DB.me);
    },

    // PUT /api/profile/license   (customer, multipart: licensePhoto file and licenseExpiry)
    // A new photo or date resets the staff check.
    async updateLicense(data) {
      await wait(400);
      Object.assign(DB.me, data, { licenseVerified: false });
      return copy(DB.me);
    },

    // PUT /api/profile   (signed-in staff member, same endpoint as customers)
    async updateStaffProfile(data) {
      await wait(400);
      Object.assign(DB.staff, data);
      return copy(DB.staff);
    },

    // PUT /api/profile/password   body: { currentPassword, newPassword }
    async changePassword() {
      await wait(500);
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

    // GET /api/admin/dashboard   (staff only)
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
