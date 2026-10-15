# -*- coding: utf-8 -*-
"""Page by page walk through: what each screen needs from the back end."""


def C(when, eps, backend):
    return dict(when=when, eps=eps, backend=backend)


PAGES = [
    dict(
        id="shared", site="all", file="Every page", title="Behavior shared by all pages", who="Everyone",
        purpose="Rules that every page relies on. Build these once and each page then works the same way.",
        calls=[
            C("Any request that needs a signed-in user", [], "Read the token from the Authorization header: Bearer <token>. A missing or expired token answers 401. A token with the wrong role answers 403."),
            C("Any error", [], "Answer with ProblemDetails. The front end shows detail in a toast, and for a 400 it puts each message under its field using the names in errors."),
            C("Customer pages", [], "On 401 the front end sends the person to login.html. The header shows fullName from the stored login result."),
            C("Staff pages", [], "On 401 or 403 the front end sends the person to admin/login.html. The sidebar badge counts pending rentals using GET /api/admin/rentals?status=pending."),
            C("Log out", [], "No endpoint. The front end deletes the stored token. Tokens last 8 hours."),
        ],
        edge=["Every list endpoint returns an empty array, never null, so the empty states show.", "Money is a number with two decimals. Dates are yyyy-MM-dd strings.", "The front end shows a loading skeleton while a call runs and an error state if it fails, so a slow or failing endpoint is visible to testers."],
    ),
    dict(
        id="home", site="customer", file="index.html", title="Home", who="Signed-in customer",
        purpose="Search box, quick links by car type, and four cars to start from.",
        calls=[
            C("Page loads: fill the pick-up list", ["e04"], "Return the four branches."),
            C("Page loads: popular cars", ["e05"], "Return the available cars. The page shows the first four. There is no separate popular endpoint."),
            C("Press Search", [], "No call. The page opens cars.html with from, to, loc and category in the address."),
        ],
        edge=["The type chips show a count. The page works it out from the same car list (cars available now).", "If no cars are available the 'popular' row is hidden."],
    ),
    dict(
        id="login", site="customer", file="login.html", title="Log in", who="Anyone",
        purpose="Customer login form.",
        calls=[C("Press Log in", ["e02"], "Check the password and return the token. A wrong email or password answers 401 and the page shows the message above the form.")],
        edge=["Right credentials of a staff account: the customer site accepts it too (the role only decides where the front end sends the person).", "Both fields empty: the page stops it before any call, the server answers 400."],
    ),
    dict(
        id="register", site="customer", file="register.html", title="Create account", who="Anyone",
        purpose="New customer account with a driving license photo.",
        calls=[C("Press Create account", ["e01"], "Send the form as multipart/form-data. Create the user, the Customer row and save the photo. Answer 201 with a token, so the person is signed in at once.")],
        edge=["Email already used: 409. The page shows 'An account with this email already exists.' under the email field.", "Photo that is not JPG, PNG or WebP, or over 5 MB: 400 with a message for licensePhoto.", "Expiry date in the past: 400.", "The password strength meter is only advice. The server rule is 8 characters."],
    ),
    dict(
        id="cars", site="customer", file="cars.html", title="Available cars", who="Signed-in customer",
        purpose="Only cars the customer can book, with filters, sorting and dates. There is no 'show available only' switch any more.",
        calls=[
            C("Page loads", ["e04"], "Return the branches for the pick-up list."),
            C("Page loads and every change of dates, type, price, transmission, seats, fuel or sort", ["e05"], "Return only bookable cars. Maintenance cars never come back. With dates, cars with an approved or active rental that overlaps are left out."),
        ],
        edge=["The price slider sends maxPrice. The front end waits a moment after the last move before calling.", "Dates with no free car: the server returns [] and the page shows 'No free cars for these dates and filters'.", "from without to, or to before from: 400."],
    ),
    dict(
        id="car", site="customer", file="car.html?id=5", title="Car details and request", who="Signed-in customer",
        purpose="Photos, specs, price, calendar of booked days, and the request form.",
        calls=[
            C("Page loads", ["e06"], "Return the car with all photos, features and bookedRanges."),
            C("Page loads: 'You might also like'", ["e05"], "The same list endpoint with the same dates. The page picks four other cars."),
            C("Pick-up location list", ["e04"], "Branches."),
            C("Press Send request (after the review dialog)", ["e07"], "Check the rules, charge the total and create the Pending rental. Answer 201 with the rental. The page shows the reference R-<id>."),
        ],
        edge=["A rented or maintenance car still opens. The page shows a notice and disables the request button.", "409 on request (someone else got the dates, or the license ends too soon): the page shows the message in a toast and closes the dialog.", "Unknown id: 404 and the page shows 'We could not find that car'.", "The page shows days x rate before sending. The server works the total out again and its number is the one that counts."],
    ),
    dict(
        id="my-rentals", site="customer", file="my-rentals.html", title="My rentals", who="Signed-in customer",
        purpose="Summary tiles, the car the customer has now, a tabbed list and a details drawer with a progress stepper and the payment block.",
        calls=[
            C("Page loads", ["e10"], "Return every rental of this customer with car, branch, money and dates. The page builds the tabs, tiles and the stepper from status."),
            C("Cancel a pending request", ["e08"], "Cancel and refund everything. The page then loads the list again."),
            C("Cancel an approved booking", ["e09"], "The dialog warns that 10% will be charged and shows the refund. The server charges 10% and refunds the rest. The page then loads the list again."),
        ],
        edge=["The page decides which endpoint to call from the status: pending uses cancelrental, approved uses refuserental.", "Another customer's id: 404.", "The stepper shows every step up to the current status as done, and the next one as 'next'. Cancelled, rejected and refused end with a red cross.", "paymentStatus partial shows the '10% fee kept' label."],
    ),
    dict(
        id="profile", site="customer", file="profile.html", title="Profile", who="Signed-in customer",
        purpose="Three forms: personal details, license photo and expiry, password.",
        calls=[
            C("Page loads", ["e11"], "Return the profile and license."),
            C("Save personal details", ["e12"], "Update name, email and phone."),
            C("Save license", ["e13"], "Multipart: the expiry date and, if the person chose one, a new photo. Set the state back to Pending."),
            C("Update password", ["e03"], "Check the current password and set the new one."),
        ],
        edge=["License photo field starts with the current photo. Leaving it alone keeps it.", "A license that expires within 90 days shows a warning on the page. The server only needs to return licenseExp.", "Wrong current password: 400 and the message appears under 'Current password'."],
    ),
    dict(
        id="admin-login", site="staff", file="admin/login.html", title="Staff login", who="Staff",
        purpose="Login form for the staff console.",
        calls=[C("Press Log in", ["e02"], "Same endpoint as customers. The page opens the console only if role is Admin and otherwise shows 'This account is not a staff account.'")],
        edge=["The seeded admin account is the first staff login. Create it in the seed task."],
    ),
    dict(
        id="admin-dashboard", site="staff", file="admin/index.html", title="Dashboard", who="Staff",
        purpose="Key numbers, two charts, the requests waiting and the cars due back.",
        calls=[
            C("Page loads: cars by status and by type", ["e14"], "The full fleet list. The page counts it."),
            C("Page loads: requests waiting, active rentals, rentals per month", ["e18"], "All rentals. The page filters pending and active and counts rentals by month for the last six months."),
            C("Page loads: revenue, last 30 days", ["e25"], "The payments list. The page adds keptAmount of rentals created in the last 30 days."),
            C("Page loads: number of customers", ["e23"], "The customers list."),
            C("Approve or reject a waiting request", ["e19", "e20"], "Same endpoints as the rentals page."),
            C("Record a return from 'Due back'", ["e22"], "Same endpoint as the rentals page."),
        ],
        edge=["There is no dashboard endpoint. Four list calls are enough for a small fleet, and it keeps the back end short. Add one later only if the page gets slow.", "An active rental whose endDate is before today shows as Overdue (the page decides that)."],
    ),
    dict(
        id="admin-cars", site="staff", file="admin/cars.html", title="Cars (staff)", who="Staff",
        purpose="The fleet table with search, filters and paging, and the add and edit dialog with up to eight photos.",
        calls=[
            C("Page loads", ["e14", "e04"], "The fleet and the branch list for the branch field."),
            C("Press Add car", ["e15"], "Multipart with the fields and 1 to 8 images. The first is the main photo."),
            C("Press Save changes in Edit", ["e16"], "Multipart. keepImageIds says which existing photos stay and in what order, images adds new ones. The first in the final order is the main photo."),
            C("Press the trash button", ["e17"], "Delete a car without rentals. A car with rental history answers 409 and the page shows the message in a toast."),
        ],
        edge=["Duplicate plate: 409 and the page shows 'This plate number is already used.' under the plate field.", "The photo grid stops at 8 photos and needs at least 1.", "Status choices in the form: Available and Maintenance. The page shows Rented only for cars that are out and does not let staff change it.", "The table's Status column is the car's own status, not a date check."],
    ),
    dict(
        id="admin-rentals", site="staff", file="admin/rentals.html", title="Rentals (staff)", who="Staff",
        purpose="Tabs for requests, approved, active and history, with the actions for each stage and a read-only details drawer.",
        calls=[
            C("Page loads", ["e18"], "All rentals. The page makes the tabs and counts."),
            C("Approve", ["e19"], "Move to Approved after the overlap check."),
            C("Reject (reason list plus note)", ["e20"], "The page joins the chosen reason and the note into reason. Reject and refund everything."),
            C("Hand over keys (dialog shows the license photo)", ["e21"], "Move to Active and set the car to Rented."),
            C("Record return (date and notes)", ["e22"], "Move to Completed and set the car to Available."),
        ],
        edge=["Approve answers 409 when another rental took the dates in the meantime. The page shows the message and loads the list again.", "Hand over answers 409 when the car is still out. The page shows the message.", "After each action the page loads the list again and follows the rental to its next tab.", "The drawer shows the payment block: paid, refunded, kept."],
    ),
    dict(
        id="admin-customers", site="staff", file="admin/customers.html", title="Customers (staff)", who="Staff",
        purpose="Customer table with license photo and state, and a drawer with the big photo, the check switch and the rental history. Staff do not add or edit customers: a customer appears here when they register.",
        calls=[
            C("Page loads", ["e23"], "Every customer with license data and rentalCount."),
            C("Open a customer's drawer", ["e18"], "Call the rentals list with customerId to show the history."),
            C("Switch 'I checked this photo against the original license'", ["e24"], "Mark the license Verified or back to Pending."),
        ],
        edge=["Expired licenses show a red label. The server sends licenseState expired when licenseExp is before today.", "Verified on an expired license: 409 and the switch goes back."],
    ),
    dict(
        id="admin-payments", site="staff", file="admin/payments.html", title="Payments (staff)", who="Staff",
        purpose="Read only. Three totals and a table of what each rental paid, refunded and kept. Nothing is recorded by hand: the system takes the payment when a request is sent and makes every refund.",
        calls=[C("Page loads", ["e25"], "One row per paid rental. The page computes the three totals for the last 30 days from the rows.")],
        edge=["There are no buttons for 'record payment', 'mark as paid' or 'refund'. The review asked for them to go.", "A refused rental shows partial (10% kept). A rejected or cancelled one shows refunded."],
    ),
    dict(
        id="admin-profile", site="staff", file="admin/profile.html", title="My profile (staff)", who="Staff",
        purpose="The staff member's name, email, phone and password. It replaced 'View customer site'.",
        calls=[
            C("Page loads", ["e26"], "Return the signed-in staff member."),
            C("Save changes", ["e27"], "Update name, email and phone."),
            C("Update password", ["e03"], "Same endpoint as customers."),
        ],
        edge=["Another account's email: 409."],
    ),
]
