/* ==========================================================================
   Mock data (fixtures)
   This file stands in for the database. The backend team can delete it once
   api.js talks to real endpoints. Field names here are the proposed API shape.

   Dates are ISO strings (YYYY-MM-DD). Rentals are generated relative to today
   so the demo always looks current.
   ========================================================================== */
(function () {
  const TODAY = new Date();
  TODAY.setHours(0, 0, 0, 0);

  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const day = (offset) => {
    const d = new Date(TODAY);
    d.setDate(d.getDate() + offset);
    return iso(d);
  };
  const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1400&q=80`;

  // Stand-in for the license photo a customer uploads. The real one is a file URL.
  const licenseCard = (name, expiry) =>
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 640 404'>` +
        `<rect width='640' height='404' rx='22' fill='#ebe6dc'/><path d='M0 22a22 22 0 0 1 22-22h596a22 22 0 0 1 22 22v52H0z' fill='#1f4f7a'/>` +
        `<text x='32' y='48' font-family='Arial' font-size='26' font-weight='700' fill='#fff' letter-spacing='2'>DRIVING LICENCE</text>` +
        `<rect x='32' y='100' width='150' height='190' rx='8' fill='#cfc7ba'/><circle cx='107' cy='168' r='38' fill='#aaa194'/><rect x='57' y='216' width='100' height='62' rx='31' fill='#aaa194'/>` +
        `<text x='214' y='126' font-family='Arial' font-size='15' fill='#6b645a'>NAME</text><text x='214' y='158' font-family='Arial' font-size='28' font-weight='700' fill='#22262a'>${name}</text>` +
        `<text x='214' y='206' font-family='Arial' font-size='15' fill='#6b645a'>EXPIRES</text><text x='214' y='236' font-family='Arial' font-size='24' fill='#22262a'>${expiry}</text>` +
        `<text x='214' y='278' font-family='Arial' font-size='15' fill='#6b645a'>CLASS B</text><rect x='32' y='318' width='576' height='54' rx='6' fill='#dfd8cb'/>` +
        `</svg>`
    );

  /* ---------- Locations ---------- */
  const locations = [
    { id: "airport", name: "Airport terminal 2" },
    { id: "downtown", name: "Downtown branch" },
    { id: "station", name: "Central station" },
    { id: "harbor", name: "Harbor branch" },
  ];

  /* ---------- Cars ---------- */
  const cars = [
    {
      id: "c01", brand: "Toyota", model: "Corolla", year: 2023, category: "Economy",
      transmission: "Automatic", fuel: "Petrol", seats: 5, bags: 2,
      dailyRate: 38, status: "available", plate: "WF 4821", color: "White",
      images: [photo("photo-1623869675781-80aa31012a5a"), photo("photo-1638618164682-12b986ec2a75")],
      features: ["Air conditioning", "Bluetooth audio", "Reverse camera", "Apple CarPlay and Android Auto", "Cruise control", "USB-C charging"],
      description: "A dependable compact sedan that is easy to park and cheap to run. A good first pick for city trips and airport transfers.",
    },
    {
      id: "c02", brand: "Volkswagen", model: "Golf", year: 2022, category: "Economy",
      transmission: "Manual", fuel: "Petrol", seats: 5, bags: 2,
      dailyRate: 36, status: "available", plate: "WF 1907", color: "White",
      images: [photo("photo-1572811298797-9eecadf6cb24")],
      features: ["Air conditioning", "Bluetooth audio", "Parking sensors", "Apple CarPlay and Android Auto", "Cruise control"],
      description: "Sharp handling and a roomy boot for its size, with a six speed manual gearbox. A good fit if you like to stay in control.",
    },
    {
      id: "c03", brand: "Mini", model: "Cooper", year: 2022, category: "Economy",
      transmission: "Automatic", fuel: "Petrol", seats: 4, bags: 1,
      dailyRate: 46, status: "maintenance", plate: "WF 7733", color: "Red",
      images: [photo("photo-1720343012322-40620ced673f")],
      features: ["Air conditioning", "Bluetooth audio", "Sport mode", "USB-C charging"],
      description: "Small, quick and fun in town. Seats two adults comfortably, with two more for short rides.",
    },
    {
      id: "c04", brand: "Hyundai", model: "Kona", year: 2024, category: "SUV",
      transmission: "Automatic", fuel: "Hybrid", seats: 5, bags: 3,
      dailyRate: 58, status: "rented", plate: "WF 3058", color: "Sage green",
      images: [photo("photo-1674110997072-41f11b7d4ae7")],
      features: ["Air conditioning", "Reverse camera", "Lane assist", "Apple CarPlay and Android Auto", "Keyless entry", "Heated seats"],
      description: "A compact crossover with a higher seating position, hybrid efficiency and a boot big enough for a weekend away.",
    },
    {
      id: "c05", brand: "Toyota", model: "RAV4", year: 2023, category: "SUV",
      transmission: "Automatic", fuel: "Hybrid", seats: 5, bags: 4,
      dailyRate: 72, status: "available", plate: "WF 5614", color: "Blue",
      images: [photo("photo-1632137924251-fcea5ff46035"), photo("photo-1615887110697-0819ec23465f")],
      features: ["Air conditioning", "Reverse camera", "Lane assist", "GPS navigation", "Roof rails", "Keyless entry", "Child seat ready"],
      description: "A hybrid SUV with real space for five and their luggage. Calm on long highway stretches and light on fuel.",
    },
    {
      id: "c06", brand: "BMW", model: "X5", year: 2023, category: "SUV",
      transmission: "Automatic", fuel: "Diesel", seats: 5, bags: 5,
      dailyRate: 128, status: "rented", plate: "WF 9002", color: "Black",
      images: [
        photo("photo-1609184166822-bd1f1b991a06"),
        photo("photo-1731988666894-482242ceae2f"),
        photo("photo-1635089917414-6da790da8479"),
        photo("photo-1653227158553-ddaa680cdd65"),
      ],
      features: ["Three zone climate control", "Panoramic roof", "Leather seats", "GPS navigation", "Heated seats", "Parking sensors", "Keyless entry", "Bluetooth audio"],
      description: "A large premium SUV with a smooth diesel engine, three zone climate control and a panoramic roof. Plenty of room for five adults and five bags.",
    },
    {
      id: "c07", brand: "Jeep", model: "Wrangler", year: 2022, category: "SUV",
      transmission: "Automatic", fuel: "Petrol", seats: 4, bags: 2,
      dailyRate: 96, status: "rented", plate: "WF 6641", color: "Red",
      images: [photo("photo-1591738802175-709fedef8288")],
      features: ["Air conditioning", "Removable roof", "4x4 drive", "Bluetooth audio", "Roof rack"],
      description: "Removable roof, high ground clearance and a loud personality. Built for gravel roads and beach trips.",
    },
    {
      id: "c08", brand: "Range Rover", model: "Sport", year: 2023, category: "Luxury",
      transmission: "Automatic", fuel: "Diesel", seats: 5, bags: 4,
      dailyRate: 165, status: "available", plate: "WF 8120", color: "White",
      images: [photo("photo-1725815761064-b84c3f4f9b94")],
      features: ["Air suspension", "Leather seats", "Heated seats", "Panoramic roof", "GPS navigation", "Parking sensors", "Keyless entry"],
      description: "Air suspension and a quiet cabin make long drives feel short. Leather seats, heated in front and rear.",
    },
    {
      id: "c09", brand: "Mercedes-Benz", model: "C-Class", year: 2023, category: "Luxury",
      transmission: "Automatic", fuel: "Petrol", seats: 5, bags: 3,
      dailyRate: 112, status: "available", plate: "WF 2276", color: "Silver",
      images: [photo("photo-1551836989-b4622a17a792")],
      features: ["Air conditioning", "Wireless phone charging", "Lane assist", "GPS navigation", "Leather seats", "Keyless entry", "Cruise control"],
      description: "A business class sedan with a refined ride, wireless charging and a strong set of driver assistance features.",
    },
    {
      id: "c10", brand: "BMW", model: "7 Series", year: 2022, category: "Luxury",
      transmission: "Automatic", fuel: "Hybrid", seats: 5, bags: 4,
      dailyRate: 189, status: "available", plate: "WF 7007", color: "Blue grey",
      images: [photo("photo-1601362840608-942cdd122b52")],
      features: ["Reclining rear seats", "Heated seats", "Panoramic roof", "GPS navigation", "Parking sensors", "Leather seats", "Bluetooth audio"],
      description: "Our flagship sedan. The rear seats recline and heat, the ride is very quiet and the boot takes four large suitcases.",
    },
    {
      id: "c11", brand: "Tesla", model: "Model 3", year: 2023, category: "Luxury",
      transmission: "Automatic", fuel: "Electric", seats: 5, bags: 2,
      dailyRate: 89, status: "available", plate: "WF 3030", color: "White",
      images: [
        photo("photo-1560958089-b8a1929cea89"),
        photo("photo-1606016159991-dfe4f2746ad5"),
        photo("photo-1638398417409-dd54452eccdf"),
      ],
      features: ["Fast charging", "Large central screen", "Lane assist", "GPS navigation", "Heated seats", "Keyless entry", "Bluetooth audio"],
      description: "Electric, quick and quiet. Around 500 km of range, fast charging on the road and a minimal interior built around one large screen.",
    },
    {
      id: "c12", brand: "Hyundai", model: "Staria", year: 2023, category: "Van",
      transmission: "Automatic", fuel: "Diesel", seats: 9, bags: 6,
      dailyRate: 104, status: "rented", plate: "WF 9190", color: "White",
      images: [photo("photo-1653978681856-ab2f1feb221b")],
      features: ["Air conditioning", "Sliding doors", "Rear climate control", "Reverse camera", "Bluetooth audio", "Child seat ready"],
      description: "A nine seat van with sliding doors and individual rear seats. Fits a family, or a small team with luggage.",
    },
  ];

  /* ---------- Customers ---------- */
  // licensePhoto is added below from the name and expiry date.
  const customers = [
    { id: "u01", name: "Ahmed Ali", email: "ahmed.ali@example.com", phone: "0100 482 7731", licenseNumber: "DL-48219377", licenseExpiry: day(640), licenseVerified: true, joined: day(-212) },
    { id: "u02", name: "Sara Mohamed", email: "sara.mohamed@example.com", phone: "0111 305 6482", licenseNumber: "DL-30577145", licenseExpiry: day(1010), licenseVerified: true, joined: day(-188) },
    { id: "u03", name: "Omar Hassan", email: "omar.hassan@example.com", phone: "0122 918 4406", licenseNumber: "DL-91844021", licenseExpiry: day(75), licenseVerified: true, joined: day(-164) },
    { id: "u04", name: "Mariam Adel", email: "mariam.adel@example.com", phone: "0155 640 2219", licenseNumber: "DL-64022190", licenseExpiry: day(1420), licenseVerified: true, joined: day(-151) },
    { id: "u05", name: "Youssef Nabil", email: "youssef.nabil@example.com", phone: "0100 771 5038", licenseNumber: "DL-77150388", licenseExpiry: day(390), licenseVerified: true, joined: day(-139) },
    { id: "u06", name: "Nour Eldin", email: "nour.eldin@example.com", phone: "0106 224 9917", licenseNumber: "DL-22499172", licenseExpiry: day(860), licenseVerified: false, joined: day(-96) },
    { id: "u07", name: "Kareem Samy", email: "kareem.samy@example.com", phone: "0112 580 3346", licenseNumber: "DL-58033469", licenseExpiry: day(212), licenseVerified: true, joined: day(-88) },
    { id: "u08", name: "Hana Mostafa", email: "hana.mostafa@example.com", phone: "0127 336 8804", licenseNumber: "DL-33688049", licenseExpiry: day(1190), licenseVerified: true, joined: day(-73) },
    { id: "u09", name: "Tarek Zaki", email: "tarek.zaki@example.com", phone: "0101 659 2275", licenseNumber: "DL-65922755", licenseExpiry: day(48), licenseVerified: true, joined: day(-61) },
    { id: "u10", name: "Dina Ashraf", email: "dina.ashraf@example.com", phone: "0150 417 6630", licenseNumber: "DL-41766308", licenseExpiry: day(730), licenseVerified: true, joined: day(-47) },
    { id: "u11", name: "Laila Farouk", email: "laila.farouk@example.com", phone: "0109 842 1175", licenseNumber: "DL-84211758", licenseExpiry: day(940), licenseVerified: true, joined: day(-33) },
    { id: "u12", name: "Hassan Reda", email: "hassan.reda@example.com", phone: "0128 093 5561", licenseNumber: "DL-09355614", licenseExpiry: day(505), licenseVerified: false, joined: day(-12) },
  ].map(({ licenseNumber, ...c }) => ({ ...c, licensePhoto: licenseCard(c.name, c.licenseExpiry) }));

  /* ---------- Rentals ---------- */
  // Money lives on the rental, like the backend's Rental table: the customer pays
  // the total when sending the request. Rejected or cancelled before approval:
  // all of it comes back. Cancelled after approval ("refused"): 10% is kept.
  const carById = Object.fromEntries(cars.map((c) => [c.id, c]));
  let rentals = [];
  const refundFor = (status, paid) =>
    status === "rejected" || status === "cancelled" ? paid : status === "refused" ? Math.round(paid * 0.9 * 100) / 100 : 0;
  const rent = (id, customerId, carId, start, end, status, loc, created, extra = {}) => {
    const days = Math.max(1, end - start);
    const total = days * carById[carId].dailyRate;
    rentals.push({
      id: `R-${id}`,
      customerId,
      carId,
      pickupDate: day(start),
      returnDate: day(end),
      days,
      total,
      pickupLocation: loc,
      status, // pending | approved | active | completed | rejected | cancelled | refused
      createdAt: day(created),
      paidAmount: total,
      refundedAmount: refundFor(status, total),
      paidAt: day(created),
      ...extra,
    });
  };

  // Customer u01 (the demo customer)
  rent(2064, "u01", "c04", -2, 3, "active", "airport", -6, { pickedUpAt: day(-2) });
  rent(2071, "u01", "c05", 9, 12, "pending", "downtown", -1);
  rent(2068, "u01", "c02", 20, 24, "approved", "station", -4);
  rent(2012, "u01", "c01", -41, -38, "completed", "airport", -45, { pickedUpAt: day(-41), returnedAt: day(-38), condition: "Good" });
  rent(2003, "u01", "c09", -96, -94, "completed", "downtown", -99, { pickedUpAt: day(-96), returnedAt: day(-94), condition: "Good" });
  rent(1988, "u01", "c01", -150, -147, "completed", "harbor", -153, { pickedUpAt: day(-150), returnedAt: day(-147), condition: "Good" });
  rent(2031, "u01", "c08", -23, -20, "rejected", "airport", -26, { reason: "Car was reserved for another customer." });
  rent(2049, "u01", "c11", -14, -11, "cancelled", "downtown", -17);

  // Other customers
  rent(2073, "u02", "c09", 5, 7, "pending", "airport", -2);
  rent(2074, "u03", "c11", 3, 6, "pending", "harbor", -1);
  rent(2062, "u04", "c06", -3, 2, "active", "airport", -8, { pickedUpAt: day(-3) });
  rent(2059, "u05", "c07", -1, 4, "active", "station", -5, { pickedUpAt: day(-1) });
  rent(2066, "u07", "c12", -4, 0, "active", "downtown", -9, { pickedUpAt: day(-4) });
  rent(2069, "u06", "c01", 2, 5, "approved", "station", -3);
  rent(2040, "u08", "c05", -30, -26, "completed", "downtown", -34, { pickedUpAt: day(-30), returnedAt: day(-26), condition: "Good" });
  rent(2037, "u09", "c10", -33, -31, "completed", "airport", -36, { pickedUpAt: day(-33), returnedAt: day(-31), condition: "Minor scratch" });
  rent(2028, "u10", "c08", -45, -41, "completed", "harbor", -49, { pickedUpAt: day(-45), returnedAt: day(-41), condition: "Good" });
  rent(2022, "u11", "c01", -52, -49, "completed", "station", -55, { pickedUpAt: day(-52), returnedAt: day(-49), condition: "Good" });
  rent(2015, "u12", "c04", -60, -55, "completed", "downtown", -63, { pickedUpAt: day(-60), returnedAt: day(-55), condition: "Needs cleaning" });
  rent(2009, "u02", "c02", -70, -66, "completed", "airport", -73, { pickedUpAt: day(-70), returnedAt: day(-66), condition: "Good" });
  rent(2044, "u03", "c06", -20, -17, "rejected", "harbor", -23, { reason: "Driving license expired at the time of request." });
  rent(2056, "u09", "c10", -9, -6, "refused", "airport", -12);

  rentals.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  /* ---------- Dashboard series ---------- */
  const monthLabel = (offset) => {
    const d = new Date(TODAY.getFullYear(), TODAY.getMonth() + offset, 1);
    return d.toLocaleString("en-US", { month: "short" });
  };
  const monthly = [-5, -4, -3, -2, -1, 0].map((o, i) => ({
    label: monthLabel(o),
    rentals: [11, 14, 13, 18, 17, 9][i], // rentals that started in that month
  }));

  const db = {
    today: iso(TODAY),
    staff: { id: "s01", name: "Nadia Fathy", email: "nadia.fathy@wayfare.test", phone: "0100 555 0142", role: "Branch manager" },
    locations,
    categories: ["Economy", "SUV", "Luxury", "Van"],
    cars,
    customers,
    rentals,
    monthly,
    helpers: { iso, day },
  };

  // The signed-in customer. The backend decides this per session.
  db.me = db.customers[0];

  window.DB = db;
})();