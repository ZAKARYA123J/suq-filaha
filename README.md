# 🌾 Sūq l-Filāḥa (سوق الفلاحة)

> **A B2B Wholesale Marketplace connecting Farmers (Fellāḥ) and Buyers (Shārī).**

[![Node.js](https://img.shields.io/badge/Backend-Node.js-green)](https://nodejs.org/)
[![Elixir](https://img.shields.io/badge/RealTime-Elixir%20Phoenix-purple)](https://elixir-lang.org/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue)](https://www.postgresql.org/)
[![Status](https://img.shields.io/badge/Status-Development-orange)]()

---

## 📖 Project Overview

**Sūq l-Filāḥa** is a mobile-first platform designed to optimize the agricultural supply chain in Morocco. It allows farmers to list bulk produce and connects them directly with wholesale buyers (restaurants, hotels, markets), bypassing traditional intermediaries.

### Core Objectives
* **Transparency:** Clear wholesale pricing tiers.
* **Efficiency:** Real-time inventory and order management.
* **Speed:** Instant communication between parties.

---

## 🏗️ Technical Architecture (Polyglot)

This project utilizes a **Microservices Architecture** to leverage the strengths of Node.js for logic and Elixir for concurrency.

| Service | Technology | Responsibility |
| :--- | :--- | :--- |
| **Core API** | **Node.js / Express** | REST API, Authentication (OTP), Listing CRUD, Order Processing, Payment Logic. |
| **Real-Time Engine** | **Elixir / Phoenix** | High-concurrency service for **Chat**, **Push Notifications**, and **Live Order Status**. |
| **Database** | **PostgreSQL** | Primary relational data store (Accessed by both services). |
| **Mobile App** | **React Native / Native** | Consumes Node REST API for data & Phoenix Channels for events. |

### Integration Logic
1.  **Event Trigger:** `Node.js` processes a `POST /orders`.
2.  **Message Queue:** `Node.js` publishes an event (via Redis/HTTP) to the `Elixir` service.
3.  **Broadcast:** `Elixir` broadcasts the event via **Phoenix Channels** to the specific Farmer's device.

---

## 🚀 Functional Specifications

### 👨‍🌾 For the Fellāḥ (Farmer)
* **Dashboard:** Real-time view of Sales, New Orders, and Low Stock alerts.
* **Listing Management:** Create bulk listings with **Minimum Order Quantity (MOQ)** and **Unit of Sale** (e.g., Crate, Ton).
* **Order Workflow:** Pipeline view (New -> Confirmed -> Ready -> Completed).
* **Payouts:** Track earnings and request withdrawals.

### 🛒 For the Shārī (Buyer)
* **Marketplace:** Filter by Location, Crop Type, and Harvest Date.
* **Bulk Purchasing:** View **Tiered Pricing Tables** (e.g., -10% for >100kg).
* **Logistics:** "My Truck" (Cart) calculates weight totals and delivery estimates.
* **Payment:** Support for Wholesale Invoicing and Credit Terms.

---

## 📂 Project Structure

```bash
suq-l-filaha/
├── backend-core/        # Node.js (Express) Application
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   └── routes/
│   └── package.json
│
├── backend-realtime/    # Elixir (Phoenix) Application
│   ├── lib/
│   │   ├── suq_web/
│   │   └── suq/
│   └── mix.exs
│
├── mobile-app/          # React Native
│   ├── src/
│   └── assets/
│
└── docker-compose.yml   # Orchestration for Dev Environment