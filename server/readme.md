# RoadRescue Server

 Backend server for the RoadRescue application. It provides RESTful APIs for managing users, incidents, rescue requests, and other core features.

## Features

- User authentication and authorization (JWT-based)
- Incident reporting and management
- Rescue request handling
- Admin dashboard endpoints
- Integration with external services (e.g., maps, notifications)
- Error handling and validation

## Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB** (Mongoose)
- **JWT** for authentication

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB

### Installation

```bash
git clone https://github.com/Handson-A/roadrescue.git
cd roadrescue/server
npm install
```

### Configuration

Create a `.env` file in the `server` directory:

```env
PORT=5000
MONGO_URI=mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Running the Server

```bash
npm start
```

## API Endpoints

| Method | Endpoint                | Description                  |
|--------|------------------------|------------------------------|
| POST   | /api/auth/register     | Register a new user          |
| POST   | /api/auth/login        | User login                   |
| GET    | /api/incidents         | List all incidents           |
| POST   | /api/incidents         | Report a new incident        |
| GET    | /api/rescues           | List rescue requests         |
| POST   | /api/rescues           | Create a rescue request      |
| GET    | /api/admin/dashboard   | Admin dashboard data(progress)         |

## Folder Structure

server/
├── controllers/
├── models/
├── routes/
├── middleware/
├── utils/
├── index.js
├── readme.md

## Contact

For questions or support, contact [hayelgum@st.ug,edu.gh].
