# -*- coding: utf-8 -*-
"""Work breakdown, Trello gaps, data model notes, decisions and the guide."""
import datetime as dt

TEAM = ["Abdelrahman Hany", "Kerollos Romany", "Mina Maher", "Samuel Mokhles", "Matthew Ashraf", "Marwan Mohamed"]

def Pk(**k):
    k.setdefault("kind", "package")
    k.setdefault("pages", [])
    k.setdefault("tags", [])
    k.setdefault("tip", "")
    k.setdefault("skills", [])
    k.setdefault("letter", "")
    return k


# Six packages for six members. Each one is a set of related cards that one person can own.
# The lists below are the starting split. The team can move cards between packages on the board.
PACKAGES = [
    Pk(id="a", letter="A", name="Foundation and sign in", level="Hard", tags=["Critical path", "Start first"],
       skills=["EF Core migration", "ASP.NET Core setup", "JWT and Identity", "Seeding data"],
       tasks=["t10", "t11", "t12", "t14", "t15", "t70", "t71"], pages=["login.html", "admin/login.html"],
       goal="The API runs and people can log in. The database has the right enums and fields and fills itself with roles, an admin, 12 cars and demo rentals. Everyone else tests against this.",
       why="One chain: fix the data, set up the API, add tokens, add the login endpoint, then the file everyone uses to test it. One person keeps the whole chain in their head.",
       first="Open Enums/CarEnums/Fuel.cs, rename Disel to Diesel, then search the solution for the other two typos (card F1). Tell the group chat when the migration is merged.",
       tip="Critical path: the other packages need login and the seed data to test. Aim to finish login in about two days. To get the others testing sooner, move card F3 (seed data) to a member who is waiting."),
    Pk(id="b", letter="B", name="Accounts and profiles", level="Medium", skills=["File upload", "Identity", "Update endpoints"],
       tasks=["t13", "t16", "t17", "t60", "t61", "t64"], pages=["register.html", "profile.html", "admin/profile.html"],
       goal="People sign up with a license photo, see and edit their profile and license, and change their password. Staff do the same for their own profile.",
       why="Everything about one person's own account: create it, show it, edit it, protect it. All of it uses ApplicationUser, Customer and the image service.",
       first="Create Services/ImageStorage.cs (card F4). It needs nothing from other packages, so you can start today.",
       tip="Register, UpdateLicense and AddCar all reuse the image service, so build it first and test it well."),
    Pk(id="c", letter="C", name="Browse cars and request one", level="Hard", skills=["Business rules", "EF Core queries", "Validation"],
       tasks=["t20", "t18", "t30", "t31", "t40", "t72"], pages=["index.html", "cars.html", "car.html"],
       goal="Customers see the branches and the cars they can book, open a car, and send a request. The system checks the rules, charges the total and saves a Pending rental.",
       why="The first half of the customer's journey, from the home page to the request dialog. It shares one car query and the rental rules: price, dates and overlap.",
       first="Create Services/RentalRules.cs and write CountDays and Total first (card M1). Then the Branches endpoint (card F9).",
       tip="The rules card needs nobody else, so start there today. The request endpoint is the biggest card of the whole project: leave time for it."),
    Pk(id="d", letter="D", name="Rental lifecycle", level="Medium", skills=["EF Core queries", "Status changes", "Money rules"],
       tasks=["t41", "t42", "t43", "t50", "t51", "t52", "t53", "t54", "t74"], pages=["my-rentals.html", "admin/rentals.html", "admin/index.html"],
       goal="Once a request exists: customers see and cancel their rentals. Staff list, approve, reject, hand over the keys and record the return. Each step changes the rental, the money and the car in the right way.",
       why="One status flow from Pending to Completed, plus the cancel and reject branches. Every card lists or changes rentals and calls the same refund rules, so one person keeps the status rules consistent.",
       first="Write the ListMyRentals query and DTO (card R2) and the staff list (card A1). Everything else works on those rows.",
       tip="Use the demo rentals from the seed data. You do not need the request endpoint. This is the biggest package, so hand cards (for example the two cancel cards) to anyone who finishes early."),
    Pk(id="e", letter="E", name="Staff fleet", level="Hard", skills=["Multipart upload", "Images", "EF Core"],
       tasks=["t32", "t33", "t34", "t35", "t75"], pages=["admin/cars.html", "admin/index.html (fleet counts)"],
       goal="Staff see the whole fleet, add a car with one to eight photos, edit its details and photos, and delete a car that has no rentals.",
       why="The whole staff cars page: list, add, edit, delete. The cards share the car DTO, the mapper and the photo handling.",
       first="Write Staff ListCars (card C3), then AddCar with the multipart upload (card C4).",
       tip="AddCar is the hardest endpoint on the staff side. EditCar reuses its photo code, so keep both."),
    Pk(id="f", letter="F", name="Staff customers, payments and final test", level="Easy", tags=["Good first package"], skills=["List endpoints", "Final testing"],
       tasks=["t62", "t63", "t21", "t73", "t76"], pages=["admin/customers.html", "admin/payments.html", "admin/index.html (revenue)"],
       goal="Staff see every customer with the license photo and mark it checked, and see what each rental paid, refunded and kept. This package also leads the final test of the whole system.",
       why="The read-only staff pages: two list endpoints and one switch. They have the least code, so this package also owns the Sprint 5 test and the final test.",
       first="Write ListCustomers and its DTO (card P3), then VerifyLicense (card P4), then ListPayments (card M2).",
       tip="A good first package if the back end is new to you. When your endpoints are done you are the natural lead for the final test."),
    Pk(id="done", kind="done", name="Finished before Sprint 3", tasks=["t01", "t02", "t03", "t04", "t05", "t06", "t07", "t08"],
       goal="Sprints 1 and 2 are ticked on Trello.", why="", first=""),
]

# ---------------------------------------------------------------------------------------------
# New Trello cards the board does not have yet. key -> card
# ---------------------------------------------------------------------------------------------
D = lambda m, d: dt.date(2026, m, d).isoformat()
NEW_CARDS = {
    "n1": dict(title="Fix enum typos and add Rental fields", list="Sprint 3", start=D(10, 15), due=D(10, 16), labels=["Database"],
               desc="Rename Disel to Diesel, Acitve to Active and Canceled to Cancelled. Add UserLicense.Pending. Add PickedUpAt, ReturnedAt and ReturnNotes to Rental. Create the migration and update the ERD document."),
    "n2": dict(title="Program.cs setup: controllers, JSON, CORS, OpenAPI viewer", list="Sprint 3", start=D(10, 15), due=D(10, 16), labels=["Feature"],
               desc="AddControllers with string enums, ProblemDetails, CORS for development, a viewer for the OpenAPI document, static files, Identity password options."),
    "n14": dict(title="RentalRules service: price, overlap and refund", list="Sprint 3", start=D(10, 16), due=D(10, 17), labels=["Feature"],
                desc="One place for CountDays, Total, the overlap test, the 10% fee and the payment status. ListCars, RentCar, Approve and the refund endpoints all use it."),
    "n3": dict(title="Seed roles, admin account and sample cars", list="Sprint 3", start=D(10, 16), due=D(10, 17), labels=["Database"],
               desc="Create the Admin and Customer roles, one admin user (password from user-secrets) and the twelve sample cars from the front end, so everyone can test."),
    "n4": dict(title="Image storage service for license and car photos", list="Sprint 3", start=D(10, 16), due=D(10, 17), labels=["Feature"],
               desc="Save, validate and delete uploaded images under wwwroot/uploads. Used by Register, UpdateLicense, AddCar and EditCar."),
    "n5": dict(title="Branches endpoint", list="Sprint 3", start=D(10, 17), due=D(10, 17), labels=["Feature"],
               desc="GET /api/branches returns the four branches for the pick-up lists and the staff car form."),
    "n6": dict(title="ChangePassword endpoint", list="Sprint 3", start=D(10, 19), due=D(10, 20), labels=["Authentication", "Feature"],
               desc="PUT /api/authentication/change-password for customers and staff."),
    "n7": dict(title=".http file for every endpoint", list="Sprint 3", start=D(10, 15), due=D(10, 22), labels=["Testing"],
               desc="Replace the weatherforecast sample in wayfare-backend.http. Add a request, with a sample body, for each endpoint as it lands, so anyone can test it."),
    "n8": dict(title="CarDetails endpoint (customer)", list="Sprint 4", start=D(10, 23), due=D(10, 25), labels=["Feature"],
               desc="GET /api/customer/cars/{id}: one car with every photo and its booked ranges."),
    "n9": dict(title="RefuseRental controller (cancel after approval, 10% fee)", list="Sprint 4", start=D(10, 29), due=D(10, 31), labels=["Feature"],
               desc="PUT /api/customer/refuserental/{id}: approved booking becomes Refused, 10% is kept and 90% refunded. It is on the team's endpoint list but has no card."),
    "n10": dict(title="UpdateProfile and UpdateLicense endpoints", list="Sprint 4", start=D(10, 31), due=D(11, 2), labels=["Feature"],
                desc="PUT /api/customer/profile and PUT /api/customer/profile/license (photo and expiry). A new license goes back to Pending."),
    "n11": dict(title="VerifyLicense endpoint (staff)", list="Sprint 5", start=D(11, 5), due=D(11, 6), labels=["Feature"],
                desc="PUT /api/admin/customers/{id}/license marks a license Verified or Pending."),
    "n12": dict(title="RecordReturn controller", list="Sprint 7", start=D(11, 23), due=D(11, 25), labels=["Feature"],
                desc="PUT /api/admin/return/{id}: Active becomes Completed, the car becomes Available. This is the 'vehicle returns' feature from the brief."),
    "n13": dict(title="Admin profile endpoints", list="Sprint 7", start=D(11, 25), due=D(11, 27), labels=["Feature"],
                desc="GET and PUT /api/admin/profile for the staff profile page."),
}

# ---------------------------------------------------------------------------------------------
# Tasks. endpoints, trello and newCard link a task to the spec and the board.
# steps: custom checklist. Endpoint tasks also get generated steps (see build.py).
# ---------------------------------------------------------------------------------------------
T = []


def task(**k):
    k.setdefault("base", "todo")
    k.setdefault("tier", "core")
    k.setdefault("endpoints", [])
    k.setdefault("trello", [])
    k.setdefault("newCard", None)
    k.setdefault("depends", [])
    k.setdefault("steps", [])
    k.setdefault("accept", [])
    k.setdefault("files", [])
    k.setdefault("notes", [])
    T.append(k)


# ---- already done ----
task(id="t01", code="D1", pkg="done", base="done", title="Project setup: repo, requirements, stack and structure", size="M", sprint=1, trello=[23, 29, 24, 25],
     summary="GitHub repository with all members, requirements, the web stack (ASP.NET Core, EF Core, SQL Server, plain HTML, CSS and JavaScript) and the folder structure.")
task(id="t02", code="D2", pkg="done", base="done", title="Front-end wireframe, review and review edits", size="L", sprint=1, trello=[26, 27],
     summary="14 linked pages with sample data. The review edits are applied: no 'show available only' switch, a status stepper that ticks every step so far, license photo upload, read-only payments, the 10% cancel warning, up to eight car photos, and a staff profile page.")
task(id="t03", code="D3", pkg="done", base="done", title="Business flow, entities and NuGet packages", size="M", sprint=2, trello=[28, 32, 35],
     summary="The rental flow, the six entities with their attributes and the EF Core, Identity and SQL Server packages.")
task(id="t04", code="D4", pkg="done", base="done", title="ERD and its documentation", size="M", sprint=2, trello=[31],
     summary="docs/ERD.png and docs/Wayfare CRMS ERD Documentation.md in the repository.")
task(id="t05", code="D5", pkg="done", base="done", title="Models and enums", size="M", sprint=2, trello=[30],
     summary="ApplicationUser, Customer, Branch, Car, CarImage and Rental, with the enums. A few typos and missing fields are fixed in task F1.")
task(id="t06", code="D6", pkg="done", base="done", title="List of all API endpoints", size="S", sprint=2, trello=[36],
     summary="The 18 endpoints in the team's Google doc. This board extends that list to 27 and keeps the same routes.")
task(id="t07", code="D7", pkg="done", base="done", title="DbContext, configurations and the first migration", size="L", sprint=2, trello=[33, 34],
     summary="AppDbContext with five configuration classes, the four seeded branches and the InitialCreate migration, merged to main.")
task(id="t08", code="D8", pkg="done", base="done", title="Sprint 2 bug fixing and edits", size="S", sprint=2, trello=[71],
     summary="Fixes after the data layer review.")

# ---- foundation ----
task(id="t10", code="F1", pkg="a", title="Fix enum typos and add the missing fields", size="S", sprint=3, newCard="n1",
     summary="Three typos would leak into the API and the database, and the front end needs four fields the models do not have yet. Do this first, before any data exists, because enums are stored as text.",
     steps=[
         "Rename Fuel.Disel to Diesel, RentalStatus.Acitve to Active and RentalStatus.Canceled to Cancelled. Fix every place that uses them.",
         "Add UserLicense.Pending. New customers start in this state. Keep Verified and Expired as they are.",
         "Add three nullable fields to Rental: PickedUpAt (DateTime?), ReturnedAt (DateTime?) and ReturnNotes (string?, 500 characters in RentalConfiguration).",
         "Run: dotnet ef migrations add FixEnumsAndRentalFields, then dotnet ef database update.",
         "Update docs/Wayfare CRMS ERD Documentation.md with the new values and fields.",
         "Tell the group chat so everyone pulls and updates their database.",
     ],
     accept=["The project builds and no 'Disel', 'Acitve' or 'Canceled' is left in the code (search for them).", "The migration applies on a fresh database.", "The ERD document lists the new fields."],
     files=["Enums/CarEnums/Fuel.cs", "Enums/RentalEnums/RentalStatus.cs", "Enums/UserEnums/UserLicense.cs", "Models/Rental.cs", "Configurations/RentalConfiguration.cs"])
task(id="t11", code="F2", pkg="a", title="Program.cs setup", size="M", sprint=3, newCard="n2", depends=[],
     summary="Right now Program.cs has Identity and the database but no controllers, no CORS and no error handling. Add the pieces every endpoint needs.",
     steps=[
         "Call AddControllers().AddJsonOptions and add JsonStringEnumConverter(JsonNamingPolicy.CamelCase), so enums travel as strings like 'suv'.",
         "Call AddProblemDetails() and app.UseExceptionHandler(), so every error body is a ProblemDetails.",
         "Add a CORS policy that allows any origin, header and method in the Development environment. The front end opens from a file or a local port, and the token travels in a header, not a cookie.",
         "Keep AddOpenApi and MapOpenApi. Add a viewer so everyone can try requests in the browser: the Scalar.AspNetCore package and app.MapScalarApiReference().",
         "Call app.UseStaticFiles() (uploads live under wwwroot/uploads), then UseAuthentication, UseAuthorization and MapControllers in that order.",
         "Set the Identity password options to RequiredLength = 8 and switch the other requirements off, to match the register form.",
         "Delete the weatherforecast sample from wayfare-backend.http. Add wwwroot/uploads/ to .gitignore.",
     ],
     accept=["dotnet run starts, the OpenAPI viewer opens, and a test controller returns JSON with camelCase names.", "A thrown exception comes back as ProblemDetails, not an HTML page."],
     files=["Program.cs", "wayfare-backend.http", ".gitignore"])
task(id="t12", code="F3", pkg="a", title="Seed roles, admin account and sample cars", size="M", sprint=3, newCard="n3", depends=["t10"],
     summary="Nobody can log in or test anything without roles, an admin, some cars and some rentals. The branches are already seeded in BranchConfiguration. The demo rentals let every other package test before the request endpoint exists.",
     steps=[
         "Create Data/DbSeeder.cs with an async SeedAsync(IServiceProvider) and call it from Program.cs in Development, after Build().",
         "Create the roles Admin and Customer with RoleManager. Skip roles that exist.",
         "Create one admin user: email admin@wayfare.test, full name Nadia Fathy, role Admin. Read the password from user-secrets (Seed:AdminPassword). Never commit it.",
         "Seed the twelve cars from assets/js/data.js in the front end, only when the Cars table is empty. Map brand, model, year, category to CarType, transmission, fuel, seats, bags to Luggage, dailyRate, plate to PlateNumber, color, features joined with commas to IncludedFeature, description, status and a branch.",
         "Use the same photo URLs as CarImage.ImageUrl (first one IsMainImage), so the front end shows pictures with no upload.",
         "Create one demo customer (demo@wayfare.test, same password as the admin from Seed:AdminPassword, license photo URL, license Verified) and seven rentals for them on different cars, one in each status: pending, approved, active, completed, cancelled, rejected, refused. Fill PaidAmount and RefundedAmount to match the money rules (refused keeps 10%, rejected and cancelled refund everything). Other packages test their endpoints on these rows before the request endpoint exists.",
     ],
     accept=["On an empty database, dotnet run creates both roles, the admin, twelve cars and the demo customer with seven rentals.", "Running it twice creates nothing twice.", "The admin and the demo customer can log in once the login endpoint exists."],
     files=["Data/DbSeeder.cs", "Program.cs"])
task(id="t13", code="F4", pkg="b", title="Image storage service", size="M", sprint=3, newCard="n4",
     summary="Register, UpdateLicense, AddCar and EditCar all take image uploads. Write the saving and checking once.",
     steps=[
         "Create Services/ImageStorage with SaveAsync(IFormFile file, string folder) that returns a URL such as /uploads/licenses/<guid>.jpg, and Delete(string url).",
         "Accept only .jpg, .jpeg, .png and .webp up to 5 MB. Also check the first bytes: JPEG starts FF D8 FF, PNG starts 89 50 4E 47, WebP has RIFF at the start and WEBP at byte 8. A renamed text file must fail.",
         "Name files with Guid.NewGuid() and the real extension. Never use the uploaded file name.",
         "Folders: wwwroot/uploads/licenses and wwwroot/uploads/cars/{carId}. Create them when missing.",
         "Register it with AddScoped. Throw one clear exception type that the controllers turn into a 400.",
         "Test with a JPG, a PNG, a renamed .txt and an 8 MB file.",
     ],
     accept=["Valid images are saved and the URL opens in the browser.", "A .txt renamed .jpg is refused.", "A file over 5 MB is refused."],
     files=["Services/ImageStorage.cs"])
task(id="t14", code="F5", pkg="a", title="Authentication and authorization with Identity and JWT", size="M", sprint=3, trello=[77], depends=["t11"],
     summary="Milestone M2. Login hands out a signed token, and controllers check it and the role.",
     steps=[
         "Add the Microsoft.AspNetCore.Authentication.JwtBearer package (same major version as the other packages).",
         "Add settings: Jwt:Key in user-secrets (32 characters or more), Jwt:Issuer, Jwt:Audience and Jwt:ExpiryMinutes (480) in appsettings.json.",
         "Create Services/JwtTokenService.CreateToken(ApplicationUser user, IList<string> roles). Claims: sub, email, name and role.",
         "In Program.cs: AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...) that validates issuer, audience, lifetime and the signing key. Set RoleClaimType to ClaimTypes.Role. Then AddAuthorization().",
         "Use [Authorize(Roles = \"Admin\")] and [Authorize(Roles = \"Customer\")] on the controllers. Add a small base controller with GetUserId() that reads the user id from the token.",
         "Add the Bearer scheme to the OpenAPI viewer so testers can paste a token.",
     ],
     accept=["No token gives 401. A customer token on an Admin endpoint gives 403. An admin token works. An expired token gives 401."],
     files=["Services/JwtTokenService.cs", "Program.cs", "Controllers/ApiControllerBase.cs"])
task(id="t15", code="F6", pkg="a", title="Login controller, DTO and mapper", size="S", sprint=3, trello=[37, 40], endpoints=["e02"], depends=["t14", "t12"],
     summary="Check the password and return the token.")
task(id="t16", code="F7", pkg="b", title="Register controller, DTO and mapper", size="M", sprint=3, trello=[38, 39], endpoints=["e01"], depends=["t13", "t14", "t10"],
     summary="Create the account, the customer row and save the license photo.")
task(id="t17", code="F8", pkg="b", title="ChangePassword endpoint", size="S", sprint=3, newCard="n6", tier="needed", endpoints=["e03"], depends=["t14"],
     summary="Used by both profile pages.")
task(id="t18", code="F9", pkg="c", title="Branches endpoint", size="S", sprint=3, newCard="n5", tier="needed", endpoints=["e04"], depends=["t11"],
     summary="A tiny read endpoint the pick-up lists need.")

# ---- payments and money ----
task(id="t20", code="M1", pkg="c", title="RentalRules service: price, overlap and refund", size="M", sprint=3, newCard="n14",
     summary="Four endpoints share the same arithmetic. Write it once, test it, and let every controller call it.",
     steps=[
         "Create Services/RentalRules.cs.",
         "CountDays(DateTime start, DateTime end): whole days between them, at least 1.",
         "Total(int days, decimal dailyRate): days x rate, rounded to 2 decimals.",
         "Overlap test: a rental blocks a car when its status is Approved or Active and rental.StartDate < to and from < rental.EndDate. Offer it as an Expression<Func<Rental,bool>> so EF turns it into SQL, and use the same expression in ListCars, RentCar and Approve.",
         "const decimal CancelFee = 0.10m. RefundWhenRefused(decimal paid) = Math.Round(paid * (1 - CancelFee), 2, MidpointRounding.AwayFromZero).",
         "PaymentStatus(decimal paid, decimal refunded): paid when refunded is 0, refunded when refunded >= paid, otherwise partial.",
         "Optional but cheap: an xUnit test for 1 day, 3 days, an overlap where one end date equals the other start date, and a refund of 144.00 giving 129.60.",
     ],
     accept=["Total(3, 38) is 114.00.", "A rental ending on 8 Nov does not block one starting on 8 Nov.", "RefundWhenRefused(144.00) is 129.60 and RefundWhenRefused(567.00) is 510.30."],
     files=["Services/RentalRules.cs", "Tests/RentalRulesTests.cs (optional)"])
task(id="t21", code="M2", pkg="f", title="ListPayments controller, DTO and mapper", size="M", sprint=5, trello=[58, 59], endpoints=["e25"], depends=["t15", "t12", "t20"],
     summary="One row per paid rental. There is no payments table, so this is a query over Rentals.")

# ---- cars ----
task(id="t30", code="C1", pkg="c", title="ListCar controller, DTO and mapper", size="M", sprint=3, trello=[41, 42], endpoints=["e05"], depends=["t12", "t20", "t14"],
     summary="The first customer endpoint. The overlap query is the part to get right.")
task(id="t31", code="C2", pkg="c", title="Car details endpoint", size="S", sprint=4, newCard="n8", tier="needed", endpoints=["e06"], depends=["t30"],
     summary="One car with all photos and booked ranges for the car page.")
task(id="t32", code="C3", pkg="e", title="Staff ListCars controller", size="S", sprint=5, trello=[63], endpoints=["e14"], depends=["t14", "t12"],
     summary="The whole fleet for the staff cars page.")
task(id="t33", code="C4", pkg="e", title="AddCar controller, DTO and mapper", size="L", sprint=6, trello=[51, 52], endpoints=["e15"], depends=["t13", "t14", "t12"],
     summary="Multipart upload with one to eight photos. The biggest staff endpoint.")
task(id="t34", code="C5", pkg="e", title="EditCar controller", size="M", sprint=7, trello=[60], endpoints=["e16"], depends=["t33"],
     summary="Change details and manage photos: keep, remove, add, choose the main one.")
task(id="t35", code="C6", pkg="e", title="DeleteCar controller", size="S", sprint=7, trello=[61], endpoints=["e17"], depends=["t14", "t12"],
     summary="Milestone M3, the last app feature. Delete only a car with no rentals.")

# ---- customer rentals ----
task(id="t40", code="R1", pkg="c", title="RentalRequest controller, DTO and mapper", size="L", sprint=4, trello=[45, 46], endpoints=["e07"], depends=["t20", "t15", "t12"],
     summary="The heart of the system: check the dates, the car and the license, charge the total and save a Pending rental.")
task(id="t41", code="R2", pkg="d", title="ListMyRentals controller, DTO and mapper", size="M", sprint=4, trello=[43, 44], endpoints=["e10"], depends=["t15", "t12"],
     summary="All rentals of the signed-in customer with car, branch and money.")
task(id="t42", code="R3", pkg="d", title="CancelRental controller", size="S", sprint=4, trello=[47], endpoints=["e08"], depends=["t15", "t12", "t20"],
     summary="Cancel a pending request with a full refund.")
task(id="t43", code="R4", pkg="d", title="RefuseRental controller (10% fee)", size="S", sprint=4, newCard="n9", endpoints=["e09"], depends=["t15", "t12", "t20"],
     summary="Cancel an approved booking. 10% is kept and 90% is refunded. It is on the team's endpoint list but not on Trello.")

# ---- staff rentals ----
task(id="t50", code="A1", pkg="d", title="AdminListAllRentals controller and DTO", size="M", sprint=5, trello=[62], endpoints=["e18"], depends=["t15", "t12"],
     summary="Every rental with customer and car. The rentals page, the dashboard and the customer drawer all use it.")
task(id="t51", code="A2", pkg="d", title="ApproveRental controller", size="S", sprint=6, trello=[53], endpoints=["e19"], depends=["t15", "t12", "t20"],
     summary="Approve a pending request after checking for overlaps again.")
task(id="t52", code="A3", pkg="d", title="Rental rejection controller", size="S", sprint=6, trello=[50], endpoints=["e20"], depends=["t15", "t12", "t20"],
     summary="Reject with a reason and refund everything. Trello card 50 mentions a fee: see the Decisions list.")
task(id="t53", code="A4", pkg="d", title="HandOverKeys controller", size="S", sprint=6, trello=[55], endpoints=["e21"], depends=["t15", "t12"],
     summary="Approved becomes Active, and the car becomes Rented.")
task(id="t54", code="A5", pkg="d", title="RecordReturn controller", size="S", sprint=7, newCard="n12", tier="needed", endpoints=["e22"], depends=["t15", "t12", "t10"],
     summary="Active becomes Completed and the car is available again. This is the 'vehicle returns' feature of the brief.")

# ---- people ----
task(id="t60", code="P1", pkg="b", title="GetUserProfile controller and UserProfileDto", size="S", sprint=4, trello=[48, 49], endpoints=["e11"], depends=["t15", "t12"],
     summary="The signed-in customer's profile and license.")
task(id="t61", code="P2", pkg="b", title="UpdateProfile and UpdateLicense endpoints", size="M", sprint=4, newCard="n10", tier="needed", endpoints=["e12", "e13"], depends=["t15", "t13", "t10"],
     summary="The two forms on the customer profile page.")
task(id="t62", code="P3", pkg="f", title="ListCustomers controller and DTO", size="M", sprint=5, trello=[56, 57], endpoints=["e23"], depends=["t15", "t12"],
     summary="The staff customer table with license photo and state.")
task(id="t63", code="P4", pkg="f", title="VerifyLicense endpoint (staff)", size="S", sprint=5, newCard="n11", tier="needed", endpoints=["e24"], depends=["t15", "t12", "t10"],
     summary="The 'I checked this photo' switch.")
task(id="t64", code="P5", pkg="b", title="Admin profile endpoints", size="S", sprint=7, newCard="n13", tier="needed", endpoints=["e26", "e27"], depends=["t15", "t12"],
     summary="GET and PUT for the staff profile page. Reuse the helper from UpdateProfile.")
# ---- quality ----
task(id="t70", code="Q1", pkg="a", title="Create the .http file and the login requests", size="S", sprint=3, depends=["t15"], newCard="n7", tier="needed",
     summary="Replace the weatherforecast sample in wayfare-backend.http with variables and the login requests. Every package then adds the requests of its own endpoints, so the file grows with the API.",
     steps=["Open wayfare-backend/wayfare-backend.http. Delete the weatherforecast sample. Add @host, @adminToken and @customerToken variables at the top.", "Add the login request for the seeded admin and for the demo customer. Paste each returned token into its variable.", "Add ### comments by area, in the same order as the Endpoints tab, so the next person knows where to put theirs.", "Keep real tokens out of git: leave the variables empty in the file and write how to fill them as a comment at the top.", "Tell the group chat. From now on every package adds its own requests (use 'Copy as .http request' on the Endpoints tab). Tick the Trello card when the file covers every endpoint that exists."],
     accept=["The admin and customer login requests return a token.", "The file has a section for every area, ready to fill."], files=["wayfare-backend.http"])
task(id="t71", code="Q2", pkg="a", title="Sprint 3 test with the front end: sign in and cars", size="M", sprint=3, trello=[76, 70],
     summary="Wire the front end to login, register, branches and the car list, then test them together.",
     steps=["Front end: set API_BASE in assets/js/api.js and switch Api.login, Api.register, Api.getLocations and Api.getCars to fetch. Keep the token in localStorage and send it as a Bearer header.", "Register a new customer with a license photo from register.html. The site opens and the token is stored.", "Log out and log in again. Try a wrong password and read the message.", "Cars page: with no dates only available cars show. Pick dates and the list changes. Each filter works.", "Staff login with the seeded admin opens the console. A customer account is refused there.", "Fix what you find on the 'bug fixing and edits' card, test again and tick both cards."],
     accept=["A person can register, log in, and see cars from the real database in the real pages."])
task(id="t72", code="Q3", pkg="c", title="Sprint 4 test with the front end: requests, cancel and profile", size="M", sprint=4, trello=[75, 69],
     summary="Wire the car page, My rentals and the profile page, then test the customer flow.",
     steps=["Front end: switch Api.getCar, Api.createRental, Api.getRentals, Api.cancelRental, the profile calls and Api.changePassword to fetch.", "Open a car, pick dates and send a request. My rentals shows it as Pending with the right total.", "Cancel it: the full amount comes back and the status becomes Cancelled.", "Approve a second request with the .http file, then cancel it from the page. The warning says 10%, and the numbers match the server.", "Profile: save details, replace the license photo (state goes back to pending), change the password and log in with it.", "Fix bugs, test again and tick both cards."],
     accept=["The whole customer flow works against the real API, and the money numbers on the page equal the server's."])
task(id="t73", code="Q4", pkg="f", title="Sprint 5 test with the front end: staff lists", size="M", sprint=5, trello=[74, 68],
     summary="Wire the staff list pages and test them.",
     steps=["Front end: switch Api.getCustomers, Api.getFleet, Api.getRentals (staff) and Api.getPayments to fetch and add the staff token guard.", "Customers: license photos load and states are right.", "Cars: every photo shows.", "Rentals: the four tabs hold the right rentals.", "Payments: each row matches the rental's money.", "Fix bugs, test again and tick both cards."],
     accept=["All four staff lists show real data and survive an empty database."])
task(id="t74", code="Q5", pkg="d", title="Sprint 6 test with the front end: the staff workflow", size="M", sprint=6, trello=[73, 67],
     summary="Test approve, reject, hand over and add car in the console.",
     steps=["Approve a pending request. The customer sees Approved.", "Reject another with a reason. The customer sees the reason and a full refund.", "Hand over keys on an approved rental. The license photo shows in the dialog and the car becomes Rented.", "Try to approve two overlapping requests. The second shows the 409 message.", "Add a car with three photos from the staff page.", "Fix bugs, test again and tick both cards."],
     accept=["The request, approve, hand over path works end to end, and double booking is impossible."])
task(id="t75", code="Q6", pkg="e", title="Sprint 7 test with the front end: edit, delete, return", size="M", sprint=7, trello=[72, 66],
     summary="Test the last staff features.",
     steps=["Edit a car: change a price, reorder photos, remove one, add one.", "Delete a car with no rentals (works) and one with rentals (409 toast).", "Record a return on an active rental. The car shows as available again.", "Staff profile: save details and change the password.", "Fix bugs, test again and tick both cards."],
     accept=["Every endpoint has been used from a real page at least once."])
task(id="t76", code="Q7", pkg="f", title="Final test of the whole system and bug fixing", size="L", sprint=8, trello=[82],
     summary="Sprint 8. Run the full story, check the roles and the error states, and fix the rest.",
     steps=["Full story: register, request, approve, hand over, return. Check the money at each step, including a reject and a cancel after approval.", "Roles: a customer token on every admin endpoint gives 403. A customer cannot read another customer's rental (404).", "Error states on every page: loading, empty, and what happens with the API switched off.", "Clean up: remove console logs and leftover sample code, update the README with setup steps and the endpoint list.", "Write down any known problems."],
     accept=["Nothing in the story needs a workaround.", "The README explains how to run both parts."])

# ---- the sprint test cards wait for the work they test, and the whole team helps ----
_TEST_AFTER = {
    "t71": ["t15", "t16", "t30"],
    "t72": ["t40", "t41", "t42", "t43", "t60", "t61"],
    "t73": ["t62", "t32", "t50", "t21"],
    "t74": ["t51", "t52", "t53", "t33"],
    "t75": ["t34", "t35", "t54", "t64"],
    "t76": ["t71", "t72", "t73", "t74", "t75"],
}
for _t in T:
    if _t["id"] in _TEST_AFTER:
        _t["depends"] = _TEST_AFTER[_t["id"]]
        _t["notes"] = ["The owner of this card leads the test. Everyone who built an endpoint for it helps, and fixes the bugs found in their own endpoint."]

# ---------------------------------------------------------------------------------------------
GLOSSARY = [
    ("Package", "A set of related cards that one member owns. The board starts with six and the team can move cards between them."),
    ("Card", "One piece of work. Most cards match a Trello card. A few are new and say so."),
    ("Controller", "A C# class whose methods answer web requests, such as POST /api/authentication/login."),
    ("DTO", "A small class that is exactly the JSON an endpoint sends or receives. It keeps database fields out of the API."),
    ("Mapper", "Code that copies a database model into a DTO, or a DTO into a model."),
    ("Migration", "A generated script that changes the database to match the models. Run dotnet ef database update to apply it."),
    ("Seed data", "Rows the app inserts when the database is empty, so everybody has an admin, cars and demo rentals to test."),
    ("JWT", "A signed text token. The login endpoint returns one and the front end sends it on every request."),
    ("Overlap", "Two rentals of the same car whose dates cross. The system must never allow it."),
    ("ProblemDetails", "The standard JSON shape of an error: a status, a title and a plain sentence in detail."),
]

DECISIONS = [
    dict(id="d1", title="Does a staff rejection refund everything?", why="Trello card 50 says 'agreed fee/refund calculation'. The review says only a customer cancelling after approval pays 10%.",
         options=[dict(key="a", text="Yes, a rejection refunds everything", rec=True), dict(key="b", text="No, keep a fee on rejection too")]),
    dict(id="d2", title="When does the customer pay?", why="The 10% rule and 'the rest is refunded' only make sense if the money was taken first.",
         options=[dict(key="a", text="The full total when the request is sent (simulated, no card form)", rec=True), dict(key="b", text="Only after staff approve, then the 10% rule applies to the paid amount")]),
    dict(id="d3", title="Do cars belong to the pick-up branch filter?", why="Cars have a BranchId, and the customer also picks a pick-up branch.",
         options=[dict(key="a", text="No. The list ignores branch. The pick-up branch is only saved on the rental.", rec=True), dict(key="b", text="Yes. Only show cars based at the chosen branch.")]),
    dict(id="d4", title="Deleting a car that has rentals", why="Rental.CarId uses Restrict, so the database refuses the delete.",
         options=[dict(key="a", text="Refuse with 409 and tell staff to use Maintenance", rec=True), dict(key="b", text="Add an IsDeleted flag and hide the car (soft delete)")]),
    dict(id="d5", title="Staff adding and editing customers", why="The staff customers page had 'Add customer' and 'Edit details'. The Trello list has neither. Customers are added when they register.",
         options=[dict(key="a", text="Skip. A customer is added when they register. The front end removed both buttons.", rec=True), dict(key="b", text="Keep them. This would need two more endpoints.")]),
    dict(id="d6", title="Spelling of Cancelled", why="The enum says Canceled, the front end says cancelled.",
         options=[dict(key="a", text="Rename the enum member to Cancelled", rec=True), dict(key="b", text="Keep Canceled. The front end maps it.")]),
    dict(id="d7", title="Hand over keys before the start date", why="Blocking it is realistic, but it makes testing slow.",
         options=[dict(key="a", text="Allow it for now. Add the check in the last sprint.", rec=True), dict(key="b", text="Block it from the start")]),
    dict(id="d8", title="Archived Trello cards 79 to 81", why="End-to-end tests, deployment and documentation were archived. The course may still ask for a README, a test report and a demo.",
         options=[dict(key="a", text="Leave them archived. The final test card covers it.", rec=True), dict(key="b", text="Restore them to Sprint 8")]),
]

# ---------------------------------------------------------------------------------------------
# Data model (current repo state) and what changes
# ---------------------------------------------------------------------------------------------
def Fd(name, typ, note="", state="ok"):
    return dict(name=name, type=typ, note=note, state=state)


ENTITIES = [
    dict(name="ApplicationUser", table="AspNetUsers", note="Identity user. Email, password hash and phone come from IdentityUser.", fields=[
        Fd("Id", "string", "PK, from Identity"), Fd("FullName", "string(100)", "Required"), Fd("Email", "string", "Unique. Used as the user name."), Fd("PhoneNumber", "string", "From Identity"), Fd("Customer", "Customer?", "One to one")]),
    dict(name="Customer", table="Customers", note="Profile and license of a user who rents cars.", fields=[
        Fd("Id", "int", "PK"), Fd("UserId", "string", "FK to ApplicationUser, cascade delete"), Fd("LicenseImageUrl", "string(500)", "Required. URL of the uploaded photo."),
        Fd("LicenseExp", "DateTime", "Expiry date on the license"), Fd("JoinedAtDate", "DateTime", "Set to UtcNow when created"), Fd("LicenseState", "UserLicense", "Add Pending (see F1)", "change")]),
    dict(name="Branch", table="Branches", note="Four rows are seeded in BranchConfiguration.", fields=[
        Fd("Id", "int", "PK"), Fd("Name", "BranchName", "Stored as text, unique")]),
    dict(name="Car", table="Cars", note="A rentable vehicle. Delete restricted when a rental points to it.", fields=[
        Fd("Id", "int", "PK"), Fd("BranchId", "int", "FK to Branch"), Fd("Brand", "string(50)"), Fd("Model", "string(50)"), Fd("Year", "short"), Fd("Color", "string(30)"),
        Fd("Luggage", "short", "The front end calls it bags"), Fd("Seat", "short", "The front end calls it seats"), Fd("DailyRate", "decimal(10,2)"), Fd("PlateNumber", "string(20)", "Unique index. Store in upper case."),
        Fd("Description", "string(1000)"), Fd("IncludedFeature", "string(500)", "Comma separated list"), Fd("Status", "Status", "available, rented, maintenance"), Fd("Fuel", "Fuel", "Disel must become Diesel", "change"),
        Fd("Transmission", "Transmission"), Fd("CarType", "CarType", "Economy, Suv, Luxury, Van")]),
    dict(name="CarImage", table="CarImages", note="Photos of a car. Deleted with the car.", fields=[
        Fd("Id", "int", "PK"), Fd("CarId", "int", "FK to Car, cascade"), Fd("ImageUrl", "string(500)"), Fd("IsMainImage", "bool", "True for the first photo"), Fd("DisplayOrder", "int", "0, 1, 2 ...")]),
    dict(name="Rental", table="Rentals", note="One booking. The money lives here, there is no payments table.", fields=[
        Fd("Id", "int", "PK"), Fd("CustomerId", "int", "FK, restrict"), Fd("CarId", "int", "FK, restrict"), Fd("BranchId", "int", "FK, restrict. The pick-up branch."),
        Fd("CreatedAtDate", "DateTime", "UtcNow when created. Also the day it was paid."), Fd("StartDate", "DateTime", "Pick-up day, 00:00 UTC"), Fd("EndDate", "DateTime", "Return day, exclusive"),
        Fd("TotalAmount", "decimal(10,2)", "days x DailyRate"), Fd("PaidAmount", "decimal(10,2)", "Equals TotalAmount at request time"), Fd("RefundedAmount", "decimal(10,2)", "Set on reject, cancel and refuse"),
        Fd("RejectionReason", "string(500)?", "Set when staff reject"), Fd("RentalStatus", "RentalStatus", "Acitve must become Active, Canceled becomes Cancelled", "change"),
        Fd("PickedUpAt", "DateTime?", "New. Set at hand over.", "new"), Fd("ReturnedAt", "DateTime?", "New. Set at return.", "new"), Fd("ReturnNotes", "string(500)?", "New. Notes from the return.", "new")]),
]

ENUMS = [
    dict(name="Status (Car)", values=["Available", "Rented", "Maintenance"], note="JSON: available, rented, maintenance"),
    dict(name="Fuel", values=["Petrol", "Electric", "Hybrid", "Disel -> Diesel"], note="JSON: petrol, electric, hybrid, diesel", fix=True),
    dict(name="Transmission", values=["Automatic", "Manual"], note="JSON: automatic, manual"),
    dict(name="CarType", values=["Economy", "Suv", "Luxury", "Van"], note="JSON: economy, suv, luxury, van. There is no Electric type: electric is a fuel."),
    dict(name="RentalStatus", values=["Pending", "Approved", "Acitve -> Active", "Completed", "Canceled -> Cancelled", "Rejected", "Refused"], note="JSON: pending, approved, active, completed, cancelled, rejected, refused. Refused means the customer cancelled after approval.", fix=True),
    dict(name="UserLicense", values=["Verified", "Expired", "+ Pending"], note="JSON: pending, verified, expired. Expired is also worked out from LicenseExp.", fix=True),
    dict(name="BranchName", values=["AirportBranch", "DownTownBranch", "CentralStationBranch", "HarborBranch"], note="Shown to people as readable names (see BranchDto)."),
]

CHANGES = [
    dict(id="c1", kind="Fix", text="Fuel.Disel becomes Diesel.", why="Typo. The ERD document and the front end both say Diesel.", task="t10"),
    dict(id="c2", kind="Fix", text="RentalStatus.Acitve becomes Active.", why="Typo.", task="t10"),
    dict(id="c3", kind="Fix", text="RentalStatus.Canceled becomes Cancelled.", why="Matches the front end and the JSON value cancelled. See decision 6.", task="t10"),
    dict(id="c4", kind="Add", text="UserLicense gets a Pending value.", why="A new or changed license has not been checked yet. The enum only has Verified and Expired.", task="t10"),
    dict(id="c5", kind="Add", text="Rental.PickedUpAt (DateTime?).", why="Set at hand over. The progress stepper shows the date.", task="t10"),
    dict(id="c6", kind="Add", text="Rental.ReturnedAt (DateTime?) and Rental.ReturnNotes (string?, 500).", why="Record return saves them.", task="t10"),
    dict(id="c7", kind="Info", text="Car has no Doors and no Mileage.", why="The front end dropped both fields to match the model. Nothing to build.", task=None),
    dict(id="c8", kind="Info", text="CarType has no Electric.", why="Electric is a fuel. The front end removed the Electric type and the Tesla is now Luxury.", task=None),
    dict(id="c9", kind="Info", text="Money is on the Rental. There is no Payment table.", why="Matches the review: payments are worked out by the system. The payments page is read only.", task=None),
    dict(id="c10", kind="Info", text="Customer has no license number.", why="The review replaced the number with a photo.", task=None),
    dict(id="c11", kind="Info", text="Dates are dates.", why="StartDate and EndDate are DateTime. Save them at 00:00 UTC and compare .Date, so a booking never depends on the time of day.", task=None),
]

FIELD_MAP = [
    ("customer.name", "fullName"), ("customer.joined", "joinedAt"), ("customer.licensePhoto", "licenseImageUrl"), ("customer.licenseExpiry", "licenseExp"),
    ("customer.licenseVerified", 'licenseState == "verified"'),
    ("car.category", "carType (economy, suv, luxury, van shown as Economy, SUV, Luxury, Van)"), ("car.plate", "plateNumber"), ("car.bags", "luggage"), ("car.images[]", "images (URLs) or mainImageUrl"),
    ("rental.pickupDate", "startDate"), ("rental.returnDate", "endDate"), ("rental.total", "totalAmount"), ("rental.pickupLocation", "branch.id"), ("rental.notes", "returnNotes"),
    ("rental.reason", "rejectionReason"), ("rental.paidAt", "createdAt"), ("rental.status", "status (cancelled after decision 6)"),
    ("staff.name", "fullName"),
]

CONVENTIONS = [
    ("Base address", "http://localhost:5290 (launchSettings). Every route starts with /api."),
    ("Format", "JSON in and out, camelCase names. Uploads use multipart/form-data."),
    ("Enums", "camelCase strings: 'suv', 'automatic', 'pending'. Set once with JsonStringEnumConverter."),
    ("Dates", "Rental dates are yyyy-MM-dd strings. Timestamps are UTC, ISO 8601."),
    ("Money", "decimal in USD with two decimals. Round with Math.Round(x, 2, MidpointRounding.AwayFromZero)."),
    ("Sign in", "Authorization: Bearer <token>. Roles are Customer and Admin."),
    ("Who is calling", "Take the user id from the token. Never read a customer id or user id from the body or the address."),
    ("Status codes", "200 OK, 201 Created, 204 No Content, 400 validation, 401 not signed in, 403 wrong role, 404 not found or not yours, 409 the state does not allow it."),
    ("Errors", "ProblemDetails with a plain sentence in detail. For 400, errors maps each field name to its messages."),
    ("Names", "Controllers/<Area>Controller.cs, DTOs/<Area>/<Name>Dto.cs, Mappers/<Area>Mapper.cs (static ToDto extension methods), Services/ for the few shared rules. No repositories: use AppDbContext directly."),
    ("Lists", "Return arrays, never null. Sort newest first unless the spec says otherwise."),
]

SETUP = [
    ("Install", "The .NET 10 SDK, SQL Server LocalDB (comes with Visual Studio) or SQL Server Express, and the EF tool: dotnet tool install --global dotnet-ef"),
    ("Clone", "git clone https://github.com/KerollosRomany/Car-Rental-Management-System.git, then create a branch per task: git checkout -b feature/<task-code>-<short-name>"),
    ("Connection string", 'cd wayfare-backend, then: dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=(localdb)\\MSSQLLocalDB;Database=WayfareDb;Trusted_Connection=True;TrustServerCertificate=True". The code reads this key and appsettings.json does not have it. appsettings.Development.json is in .gitignore.'),
    ("Secrets", 'dotnet user-secrets set "Jwt:Key" "<at least 32 random characters>" and dotnet user-secrets set "Seed:AdminPassword" "<a password for the admin and the demo customer>". Never commit either.'),
    ("Database", "dotnet ef database update creates the tables and seeds the four branches. Run it again after every pull that adds a migration."),
    ("Run", "dotnet run opens http://localhost:5290. The OpenAPI document is at /openapi/v1.json once Program.cs is set up (task F2)."),
    ("Front end", "Open index.html in the project's front end folder, or run npx serve . there. After wiring, API_BASE in assets/js/api.js points to http://localhost:5290/api."),
    ("Pull request", "Open a pull request to main. A second member reviews it before it is merged. Then tick the Trello card."),
]

DONE_DEF = [
    "A second member reviewed the code and it is merged to main.",
    "Every test case in the endpoint spec passes against the seeded database.",
    "Wrong input gives 400, the wrong role gives 403, a missing item gives 404, and a rule that blocks gives 409, each with ProblemDetails.",
    "The request is in wayfare-backend.http.",
    "The Trello card has its due date ticked, and this board shows Done.",
]
