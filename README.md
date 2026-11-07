# 🚗 Car Rental Management System

A web-based **Car Rental Management System** that streamlines the rental process for both customers and employees.

Customers can browse available vehicles, check availability, make rental reservations, and manage their rental history. Employees can manage vehicles, customers, rentals, payments, and vehicle returns through a centralized system.

---

## 🎯 Project Overview

The **Car Rental Management System** is designed to simplify and organize the complete car rental workflow through a centralized platform.

Instead of relying on manual processes or disconnected records, the system provides an organized solution for managing:

- 🚗 Vehicle availability and information
- 👤 Customer accounts and information
- 📅 Rental reservations
- 💳 Rental payments
- 🔄 Vehicle returns
- 📋 Rental history

The goal is to provide a reliable and user-friendly platform that makes the rental process easier to manage for both customers and employees.

---

## ✨ Main Features

### 👤 Customer

- Create an account and manage their profile
- Browse available vehicles
- Check vehicle availability for selected dates
- Make rental reservations
- View rental history

### 👨‍💼 Employee

- Manage vehicles
- Manage customer records
- Manage rental reservations
- Manage payments
- Process vehicle returns
- View rental history

---

## 🛠️ Development Plan

The project is developed in **8 sprints**, from project setup (Sprint 1, starting September 24, 2026) to final system testing (Sprint 8, due December 25, 2026). Progress is tracked on our Trello board (**WayFare**), and the team holds a **15-minute daily scrum** to review progress on each sprint's tasks.

Each sprint (from Sprint 3 onward) follows the same cycle: build the endpoints, **test them with the frontend**, then spend the last days on **bug fixing and edits** before moving to the next sprint.

### 📅 Timeline

| Sprint | Dates | Focus | Main Tasks |
|---|---|---|---|
| **Sprint 1** | Sep 24 – Oct 3 | Frontend wireframe & project structure | Set up GitHub and add project members, project requirements, choose web stack, determine project structure and folders, frontend wireframe, frontend review and notes |
| **Sprint 2** | Oct 3 – Oct 13 | Backend data & database | Business flow and requirements, entities and attributes, install required NuGet packages, ERD and documentation, backend models and enums, list all API endpoints, DbContext and database configuration, data configurations, bug fixing and edits |
| **Sprint 3** | Oct 15 – Oct 22 | Authentication endpoints + first customer endpoint | Register controller (DTO and mapper), Login controller (DTO and mapper), ListCar controller (DTO and mapper), authentication and authorization using Identity + JWT, testing with frontend, bug fixing and edits |
| **Sprint 4** | Oct 25 – Nov 2 | Customer endpoints | ListMyRentals controller (DTO and mapper), RentalRequest controller (DTO and mapper), CancelRental controller, GetUserProfile controller (UserProfileDto and mapper), testing with frontend, bug fixing and edits |
| **Sprint 5** | Nov 5 – Nov 12 | Admin listing functionalities | ListCustomers controller (DTO and mapper), ListCars controller, AdminListAllRentals controller, ListPayments controller (DTO and mapper), testing with frontend, bug fixing and edits |
| **Sprint 6** | Nov 15 – Nov 22 | Admin core functionalities | ApproveRental controller, HandOverKeys controller, Rental Rejection controller (fee/refund rules, payment status transitions, audit trail), AddCar controller (DTO and mapper), testing with frontend, bug fixing and edits |
| **Sprint 7** | Nov 25 – Dec 2 | Admin endpoints, part 2 | EditCar controller, DeleteCar controller (last app feature), testing with frontend, bug fixing and edits |
| **Sprint 8** | Due Dec 25 | Final testing | Test overall system functionality and fix any remaining bugs |

---
<img width="1919" height="1079" alt="image" src="https://github.com/user-attachments/assets/9cad2621-542f-4445-b203-645862da8330" />


## 🧪 Testing Strategy

Testing runs continuously inside every sprint instead of being postponed until the end. From Sprint 3 onward, each sprint includes a **Testing with Frontend** task (verifying the new endpoints work with the frontend) followed by a **bug fixing and edits** task. Sprint 8 is fully dedicated to final testing of the whole system.

| Sprint | Testing Focus |
|---|---|
| **Sprint 1** | Requirements and wireframe review (frontend reviewing and notes) |
| **Sprint 2** | Database and data layer verification: schema, entities, DbContext configuration, and bug fixing |
| **Sprint 3** | Authentication and authorization (register, login, JWT), car listing, tested with the frontend |
| **Sprint 4** | Customer endpoints: rental requests, cancellation, rental history and profile, with ownership authorization, tested with the frontend |
| **Sprint 5** | Admin listing endpoints for customers, cars, rentals and payments, tested with the frontend |
| **Sprint 6** | Admin rental workflow: approve, reject, hand over keys, and add car, tested with the frontend |
| **Sprint 7** | Edit and delete car, tested with the frontend |
| **Sprint 8** | Overall system testing and final bug fixing |

---

## 🔄 Rental Workflow

The main rental process follows this workflow:

**Browse Vehicles → Check Availability → Make Reservation → Pickup → Payment → Return → Rental History**

---

## 📌 Project Status

🚧 **In Development**

---

## 👥 Team

| Member | Role |
|---|---|
| **Abdelrahman Hany** | Team Leader |
| **Kerollos Romany** | Team Member |
| **Mina Maher** | Team Member |
| **Samuel Mokhles** | Team Member |
| **Mathew Ashraf** | Team Member |
| **Marwan Mohammed** | Team Member |
| **Basem Hany** | Team Member |

---

## 📞 Contact

**Team Leader:** Abdelrahman Hany  
**Phone:** 01102201913
