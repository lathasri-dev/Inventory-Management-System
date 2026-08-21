# Inventory Management System

A full-stack web application for managing product inventory built with React, Node.js, Express, and MongoDB.

## 🏗️ Architecture

- **Frontend**: React 18 + Vite + Material-UI
- **Backend**: Node.js + Express + MongoDB + Mongoose (Port 5001)
- **Database**: MongoDB
- **Styling**: Material-UI (MUI) components

## 📁 Project Structure

```
Project/
├── backend/                 # Node.js/Express backend
│   ├── config/
│   │   └── db.js           # Database configuration
│   ├── controllers/
│   │   └── productController.js  # Product business logic
│   ├── models/
│   │   └── Product.js      # Product data model
│   ├── routes/
│   │   └── products.js     # Product API routes
│   ├── .env               # Backend environment variables
│   ├── package.json       # Backend dependencies
│   └── server.js          # Express server entry point
├── frontend/               # React frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── api.js      # API communication layer
│   │   ├── components/
│   │   │   ├── NavBar.jsx  # Navigation component
│   │   │   └── ProductTable.jsx  # Product table component
│   │   ├── pages/
│   │   │   ├── ProductList.jsx    # Product listing page
│   │   │   ├── ProductForm.jsx    # Add/Edit product form
│   │   │   └── NotFound.jsx       # 404 page
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx        # React entry point
│   │   └── styles.css      # Global styles
│   ├── .env               # Frontend environment variables
│   ├── index.html         # HTML template
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── package.json           # Root package.json with unified scripts
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- MongoDB (running locally or MongoDB Atlas)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd Project
   ```

2. **Install all dependencies:**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables:**
   
   Backend (`.env` in `backend/` folder):
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/inventory_db
   NODE_ENV=development
   ```
   
   Frontend (`.env` in `frontend/` folder):
   ```env
   VITE_API_BASE=http://localhost:5000
   ```

4. **Start MongoDB** (if running locally):
   ```bash
   mongod
   ```

5. **Run the application:**
   ```bash
   npm run dev
   ```

   This will start both backend (port 5000) and frontend (port 5173) concurrently.

### Alternative Commands

- **Backend only:** `npm run server`
- **Frontend only:** `npm run client`
- **Production build:** `npm run build`
- **Production start:** `npm run start:prod`

## 🔧 API Endpoints

### Products API (`/api/products`)

- `GET /` - Get all products
- `GET /:id` - Get product by ID
- `POST /` - Create new product
- `PUT /:id` - Update product
- `DELETE /:id` - Delete product

### Product Schema

```javascript
{
  name: String (required),
  item_number: String (required, unique),
  price: Number (required, min: 0),
  quantity: Number (required, min: 0),
  createdAt: Date (auto-generated)
}
```

## 🎨 Frontend Features

- **Product List**: View all products in a responsive table
- **Add Product**: Create new products with validation
- **Edit Product**: Update existing product information
- **Delete Product**: Remove products with confirmation
- **Navigation**: Clean routing between pages
- **Responsive Design**: Material-UI components for modern UI

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with hot reload
```

### Building for Production
```bash
cd frontend
npm run build  # Creates optimized build in dist/
```

## 📦 Key Dependencies

### Backend
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable loading
- `nodemon` - Development auto-restart

### Frontend
- `react` - UI library
- `react-dom` - React DOM rendering
- `react-router-dom` - Client-side routing
- `@mui/material` - Material-UI components
- `@mui/icons-material` - Material-UI icons
- `axios` - HTTP client
- `vite` - Build tool and dev server

## 🔍 Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check MONGO_URI in backend/.env
   - Verify MongoDB port (default: 27017)

2. **Port Already in Use:**
   - Backend default port: 5000
   - Frontend default port: 5173
   - Change ports in respective .env files if needed

3. **CORS Issues:**
   - Backend has CORS enabled for all origins in development
   - Check VITE_API_BASE in frontend/.env

4. **Build Errors:**
   - Ensure all dependencies are installed: `npm run install-all`
   - Clear node_modules and reinstall if needed

## 📝 Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)

### Frontend (.env)
- `VITE_API_BASE` - Backend API base URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
