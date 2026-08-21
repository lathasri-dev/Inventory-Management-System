# Inventory Management System

A full-stack **Inventory Management System** built with the **MERN stack** to help businesses efficiently manage products, categories, suppliers, customers, stock levels, and inventory operations through a centralized web application.

The system provides an admin-focused dashboard with complete CRUD functionality, search, filtering, pagination, stock tracking, and database integration using MongoDB.

## 🚀 Live Demo

**Frontend:**
https://inventory-management-system-theta-mauve.vercel.app/

**GitHub Repository:**
https://github.com/lathasri-dev/Inventory-Management-System

> Backend API is deployed separately using Render and connected to MongoDB Atlas.

---

## 📌 Project Overview

Managing inventory manually can lead to stock inaccuracies, duplicate records, inefficient tracking, and difficulty monitoring product availability.

This project provides a centralized web-based solution for managing inventory data and automating common inventory operations.

The application allows administrators to:

* Manage products
* Manage categories
* Manage suppliers
* Manage customers
* Track stock quantities
* Search and filter records
* Add, edit, view, and delete records
* Monitor inventory information through a dashboard
* Store and retrieve data from MongoDB
* Access the system through a responsive web interface

---

## ✨ Key Features

### 📦 Product Management

* Add new products
* Edit existing products
* View product details
* Delete products
* Search products
* Filter products
* Paginate product records
* Manage SKU and pricing information
* Track stock quantities
* Associate products with categories and suppliers

### 🗂️ Category Management

* Create categories
* Edit categories
* View categories
* Delete categories
* Search and filter categories
* Maintain organized product classification

### 🚚 Supplier Management

* Add suppliers
* Edit supplier information
* View supplier details
* Delete suppliers
* Search and filter suppliers
* Maintain supplier-product relationships

### 👥 Customer Management

* Add customers
* Edit customer information
* View customer details
* Delete customers
* Search customers
* Maintain customer records

### 📊 Dashboard

The admin dashboard provides a centralized overview of inventory information, including:

* Total products
* Categories
* Suppliers
* Customers
* Stock information
* Inventory statistics

### 🔍 Search, Filter & Pagination

The system supports:

* Keyword-based search
* Category filtering
* Supplier filtering
* Stock-related filtering
* Paginated data tables

These features make it easier to manage large inventory datasets efficiently.

---

## 🛠️ Technology Stack

### Frontend

* React.js
* Vite
* JavaScript
* HTML5
* CSS3
* Material UI
* Axios
* React Router

### Backend

* Node.js
* Express.js
* REST APIs
* JavaScript

### Database

* MongoDB
* MongoDB Atlas
* Mongoose

### Development Tools

* Git
* GitHub
* VS Code
* npm
* Postman

### Deployment

* **Vercel** — Frontend
* **Render** — Backend
* **MongoDB Atlas** — Database

---

## 🏗️ System Architecture

```text
                    ┌─────────────────────────┐
                    │        User/Admin       │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │       React + Vite      │
                    │        Frontend         │
                    │        Vercel           │
                    └────────────┬────────────┘
                                 │
                           REST API / HTTP
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    Node.js + Express    │
                    │        Backend          │
                    │         Render          │
                    └────────────┬────────────┘
                                 │
                              Mongoose
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │      MongoDB Atlas      │
                    │        Database         │
                    └─────────────────────────┘
```

---

## 📁 Project Structure

```text
Inventory-Management-System/
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .npmrc
│   ├── package.json
│   └── vite.config.js
│
├── README.md
├── package.json
├── package-lock.json
└── .gitignore
```

---

## 🔄 Application Workflow

```text
Admin Login
     │
     ▼
Dashboard
     │
     ├── Products
     │     ├── Add
     │     ├── View
     │     ├── Edit
     │     ├── Delete
     │     ├── Search
     │     └── Filter
     │
     ├── Categories
     │
     ├── Suppliers
     │
     └── Customers
             │
             ▼
       REST API Requests
             │
             ▼
          MongoDB
```

---

## 🔌 REST API Structure

The backend follows a RESTful API architecture.

### Products

```text
GET     /api/products
GET     /api/products/:id
POST    /api/products
PUT     /api/products/:id
DELETE  /api/products/:id
```

### Categories

```text
GET     /api/categories
GET     /api/categories/:id
POST    /api/categories
PUT     /api/categories/:id
DELETE  /api/categories/:id
```

### Suppliers

```text
GET     /api/suppliers
GET     /api/suppliers/:id
POST    /api/suppliers
PUT     /api/suppliers/:id
DELETE  /api/suppliers/:id
```

### Customers

```text
GET     /api/customers
GET     /api/customers/:id
POST    /api/customers
PUT     /api/customers/:id
DELETE  /api/customers/:id
```

> API endpoint names may vary depending on the final backend implementation.

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/lathasri-dev/Inventory-Management-System.git
```

Navigate into the project:

```bash
cd Inventory-Management-System
```

---

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

---

### 3. Configure Environment Variables

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

> Never commit `.env` files or database credentials to GitHub.

---

### 4. Start the Backend

```bash
npm start
```

The backend will run locally on:

```text
http://localhost:5001
```

---

### 5. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install --legacy-peer-deps
```

---

### 6. Start the Frontend

```bash
npm run dev
```

The frontend will run on a URL similar to:

```text
http://localhost:5173
```

---

## 🌐 Environment Configuration

For production deployment, the frontend should communicate with the deployed backend instead of `localhost`.

Example:

```env
VITE_API_BASE=https://your-backend.onrender.com
```

The production architecture is:

```text
React/Vercel
      ↓
Render API
      ↓
MongoDB Atlas
```

---

## 🗄️ Database Design

The application uses MongoDB with Mongoose models for structured data management.

Main collections include:

```text
Products
Categories
Suppliers
Customers
```

### Product Example

```json
{
  "name": "Wireless Keyboard",
  "sku": "KB-001",
  "category": "Electronics",
  "supplier": "ABC Technologies",
  "purchasePrice": 850,
  "sellingPrice": 1200,
  "quantity": 50
}
```

---

## 🔐 Security Considerations

The application follows basic security practices including:

* Environment variables for sensitive configuration
* Password/credential protection
* Backend validation
* API-level validation
* CORS configuration
* MongoDB authentication
* Separation of frontend and backend services

Sensitive information such as database credentials and API secrets should never be committed to the repository.

---

## 🧪 Testing

The project includes integration testing support for validating communication between the frontend, backend, and database layers.

Backend APIs can also be tested using tools such as:

* Postman
* Thunder Client
* Browser REST clients

---

## 🚀 Deployment

### Frontend

The React frontend is deployed using:

**Vercel**

```text
GitHub → Vercel → React Application
```

### Backend

The Node.js/Express backend is deployed using:

**Render**

```text
GitHub → Render → Express API
```

### Database

The production database is hosted using:

**MongoDB Atlas**

```text
Render Backend → MongoDB Atlas
```

---

## 📈 Future Enhancements

Planned improvements include:

* Role-based access control
* Inventory stock alerts
* Low-stock notifications
* Sales and purchase management
* Inventory transaction history
* Advanced analytics
* Export reports to Excel/PDF
* Barcode and QR-code scanning
* Supplier purchase-order management
* Email notifications
* Audit logs
* Advanced dashboard visualizations
* Cloud-based automated backups

---

## 🎯 Learning Outcomes

This project provided practical experience in:

* Full-stack web development
* MERN stack development
* REST API development
* MongoDB database design
* Mongoose ODM
* CRUD operations
* Authentication and authorization concepts
* API integration
* Frontend state management
* Form validation
* Search and filtering
* Pagination
* Git and GitHub
* Cloud deployment
* Debugging production issues

---

## 👩‍💻 Developer

**Lathasri Kondaveeti**

Computer Science & Engineering Student

GitHub:
https://github.com/lathasri-dev

---
