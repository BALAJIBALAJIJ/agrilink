# 🌿 AGRILINK — Farmer's Rule

### *Empowering Farmers • Smart Selling • Zero Waste*

**AI-Powered Farm-to-Market Platform**

---

## 📋 Overview

AGRILINK is a full-stack AgriTech platform that eliminates middlemen by connecting farmers directly with buyers through a transparent digital marketplace. The platform includes real-time GPS tracking, payment verification, transporter management, dry-unit processing, biogas conversion, multilingual support (English + Tamil), and admin verification workflows.

## 🏗️ Architecture

```
AGRILINK/
├── backend/                    # Spring Boot 3.2 REST API
│   ├── src/main/java/com/agrilink/
│   │   ├── config/            # Security, WebSocket, CORS, Cloudinary
│   │   ├── controller/        # REST API Endpoints
│   │   ├── dto/               # Request/Response Objects
│   │   ├── exception/         # Global Exception Handling
│   │   ├── model/             # MongoDB Entities + Enums
│   │   ├── repository/        # Spring Data MongoDB Repos
│   │   ├── security/          # JWT Auth Filter + Token Provider
│   │   └── service/           # Business Logic Layer
│   └── src/main/resources/    # application.yml config
│
├── frontend/                   # React 18 + Vite 5 SPA
│   ├── src/
│   │   ├── components/        # Shared UI Components
│   │   ├── context/           # Auth Context Provider
│   │   ├── locales/           # i18n (English + Tamil)
│   │   ├── pages/             # Route Pages (Lazy Loaded)
│   │   │   ├── auth/          # Login, Register, Admin Login
│   │   │   ├── farmer/        # Dashboard, Products, Orders
│   │   │   ├── buyer/         # Dashboard, Orders, Product Detail
│   │   │   ├── transporter/   # Dashboard, Live Tracking
│   │   │   ├── admin/         # Dashboard, User Management
│   │   │   ├── dryunit/       # Dry Unit Dashboard
│   │   │   └── biogas/        # Biogas Dashboard
│   │   └── services/          # API Client, WebSocket
│   └── public/                # Logo, Favicon, Static Assets
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, Framer Motion, React Router 6, i18next, Recharts, react-hot-toast |
| **Backend** | Java 17, Spring Boot 3.2, Spring Security 6, Spring Data MongoDB, Spring WebSocket (STOMP) |
| **Database** | MongoDB 7.x |
| **Auth** | JWT (jjwt 0.12), Google OAuth2, BCrypt |
| **File Storage** | Cloudinary |
| **PDF** | iText 8 |
| **Routing** | OSRM (Open Source Routing Machine) |
| **Real-Time** | WebSocket + STOMP over SockJS |

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| 🧑‍🌾 **Farmer** | List produce, manage inventory, accept/reject orders, send surplus to dry unit/biogas |
| 🛍️ **Buyer** | Browse marketplace, place orders, upload payment proof, track deliveries |
| 🚛 **Transporter** | Toggle duty, accept deliveries, GPS live tracking, status updates |
| 🔐 **Admin** | Verify users, approve/reject payments, manage dry units, view audit logs |

## 🚀 Quick Start

### Prerequisites
- Java 17+
- Node.js 18+
- MongoDB 7.x (running on localhost:27017)
- Cloudinary account

### 1. Backend Setup

```bash
cd backend

# Copy and edit environment config
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, Cloudinary keys, etc.

# Run with Maven Wrapper
.\mvnw.cmd spring-boot:run
# Backend starts at http://localhost:8080
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# Frontend starts at http://localhost:5173
```

### 3. Access the Application

| URL | Description |
|-----|-------------|
| http://localhost:5173 | Main Application |
| http://localhost:5173/auth/login | User Login |
| http://localhost:5173/auth/register | User Registration |
| http://localhost:5173/admin/login | Admin Login |

## 🔑 API Endpoints

### Auth
```
POST /api/auth/register          # Register new user
POST /api/auth/login             # Login with mobile + password
POST /api/auth/admin/login       # Admin login
POST /api/auth/google            # Google OAuth login
POST /api/auth/complete-profile  # Complete user profile
```

### Products
```
GET    /api/products              # Browse marketplace (public)
GET    /api/products/{id}         # Product details (public)
POST   /api/products              # Create listing (Farmer)
PUT    /api/products/{id}         # Update listing (Farmer)
DELETE /api/products/{id}         # Remove listing (Farmer)
PUT    /api/products/{id}/toggle-pause  # Pause/Resume (Farmer)
```

### Orders
```
POST   /api/orders               # Place order (Buyer)
GET    /api/orders/farmer         # Farmer's orders
GET    /api/orders/buyer          # Buyer's orders
PUT    /api/orders/{id}/accept    # Accept order (Farmer)
PUT    /api/orders/{id}/reject    # Reject order (Farmer)
```

### Transport
```
GET    /api/transport/requests/available  # Available deliveries
PUT    /api/transport/requests/{id}/accept  # Accept delivery
PUT    /api/transport/requests/{id}/status  # Update status
POST   /api/transport/location    # Send GPS coordinates
POST   /api/transport/duty/toggle # Toggle on/off duty
```

### Payments
```
POST   /api/payments/{orderId}/upload  # Upload payment proof
PUT    /api/admin/payments/{id}/verify  # Verify payment (Admin)
```

### Admin
```
GET    /api/admin/dashboard       # Dashboard statistics
GET    /api/admin/users           # List users with filters
PUT    /api/admin/users/{id}/approve   # Approve user
PUT    /api/admin/users/{id}/reject    # Reject user
PUT    /api/admin/users/{id}/suspend   # Suspend user
```

## 🌐 Multilingual Support

The platform supports:
- **English** (default)
- **Tamil** (தமிழ்)

Language can be toggled from the navbar. All labels, messages, and status texts are internationalized via i18next.

## 🔒 Security

- **JWT-based** stateless authentication
- **BCrypt** password hashing
- **Role-based access control** enforced at both route and API level
- **CORS** configured for frontend origin
- **File upload validation** (MIME type + size limits via Cloudinary)
- **Payment verification** requires Admin approval (never auto-verified)

## 📱 Real-Time Features

- **GPS Tracking**: Transporters broadcast location via WebSocket → buyers see live updates
- **Notifications**: STOMP-based user-specific notification queue
- **Status Updates**: Order/transport state changes pushed in real-time

## ♻️ Zero Waste Ecosystem

- **Dry Unit**: Unsold vegetables are sent for solar drying → dried products sold
- **Biogas**: Agricultural waste converted to biogas energy + organic fertilizer

---

**Built with ❤️ in Tamil Nadu, India 🇮🇳**
