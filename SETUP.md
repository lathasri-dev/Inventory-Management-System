# 🚀 Setup Guide - Inventory Management System

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (v8 or higher) - Comes with Node.js
- **MongoDB** - [Download here](https://www.mongodb.com/try/download/community) or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## 📋 Step-by-Step Setup

### 1. Clone and Navigate
```bash
cd Project
```

### 2. Install Dependencies
```bash
npm run install-all
```
This will install dependencies for:
- Root project (concurrently for running both services)
- Backend (Express, Mongoose, etc.)
- Frontend (React, Material-UI, etc.)

### 3. Database Setup

#### Option A: Local MongoDB
1. Start MongoDB service:
   ```bash
   # Windows
   net start MongoDB
   
   # macOS/Linux
   sudo systemctl start mongod
   ```

#### Option B: MongoDB Atlas (Cloud)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `backend/.env` with your Atlas connection string:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/inventory_db
   ```

### 4. Environment Configuration

The following `.env` files should already be created:

**Backend** (`backend/.env`):
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/inventory_db
NODE_ENV=development
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE=http://localhost:5001
```

### 5. Start the Application

#### Quick Start (Both Services)
```bash
npm run dev
```

#### Individual Services
```bash
# Backend only (port 5000)
npm run server

# Frontend only (port 5173)
npm run client
```

#### Using Startup Scripts
- **Windows**: Double-click `start-dev.bat`
- **macOS/Linux**: Run `./start-dev.sh`

### 6. Verify Installation

1. **Backend**: Open [http://localhost:5001](http://localhost:5001)
   - Should show: "Inventory Management API is running"

2. **Frontend**: Open [http://localhost:5173](http://localhost:5173)
   - Should show the inventory management interface

3. **Run Tests**: 
   ```bash
   npm test
   ```

## 🎯 Usage

### Adding Your First Product

1. Open the frontend: [http://localhost:5173](http://localhost:5173)
2. Click "Add Product" button
3. Fill in the form:
   - **Name**: Product name
   - **Item Number**: Unique product identifier
   - **Price**: Product price (numbers only)
   - **Quantity**: Available quantity (numbers only)
4. Click "Create"

### Managing Products

- **View All**: Main page shows all products in a table
- **Edit**: Click the edit icon (pencil) next to any product
- **Delete**: Click the delete icon (trash) next to any product

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Make sure MongoDB is running
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Change the port in `backend/.env`:
```env
PORT=5001
```

#### 3. Frontend Can't Connect to Backend
**Solution**: Check `frontend/.env`:
```env
VITE_API_BASE=http://localhost:5000
```

#### 4. CORS Errors
**Solution**: Backend has CORS enabled, but if issues persist, check the backend is running on the correct port.

#### 5. Build Errors
```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
rm -rf backend/node_modules backend/package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
npm run install-all
```

### Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload during development
2. **API Testing**: Use tools like Postman or curl to test API endpoints directly
3. **Database**: Use MongoDB Compass to view your data visually
4. **Logs**: Check console output for detailed error messages

## 📊 Project Structure Overview

```
Project/
├── backend/          # Node.js/Express API server
├── frontend/         # React application
├── package.json      # Root package with unified scripts
├── README.md         # Detailed documentation
├── SETUP.md          # This setup guide
└── start-dev.bat     # Windows startup script
```

## 🆘 Getting Help

If you encounter issues:

1. Check this setup guide first
2. Review the main README.md
3. Check console logs for specific error messages
4. Ensure all prerequisites are installed
5. Verify environment variables are set correctly

## 🎉 Success!

If everything is working, you should see:
- Backend API responding at http://localhost:5000
- Frontend application running at http://localhost:5173
- Ability to create, read, update, and delete products

Happy coding! 🚀
