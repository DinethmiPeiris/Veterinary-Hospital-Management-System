# Veterinary Hospital Management System (VHMS)

Sri Jayawardanapura Animal Hospital — A full-stack veterinary hospital management system.

## Tech Stack

- **Backend**: Spring Boot 4.1 + MongoDB Atlas + Spring Security
- **Frontend**: React 19 + Vite 6 + React Router 7
- **Database**: MongoDB Atlas

## Project Structure

```
├── backend/          # Spring Boot REST API
│   ├── src/main/java/com/vhms/vhms/
│   │   ├── VhmsApplication.java
│   │   ├── config/        # Security, CORS configuration
│   │   ├── model/         # MongoDB document models
│   │   ├── repository/    # MongoDB repositories
│   │   ├── service/       # Business logic services
│   │   ├── controller/    # REST API controllers
│   │   ├── dto/           # Data Transfer Objects
│   │   ├── exception/     # Exception handlers
│   │   └── security/      # JWT / Auth filters
│   └── src/main/resources/
│       └── application.properties
│
├── frontend/         # React SPA
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components (Landing, Login)
│   │   ├── App.jsx        # Router setup
│   │   └── main.jsx       # Entry point
│   └── public/            # Static assets
```

## Getting Started

### Prerequisites

- Java 21+
- Node.js 18+
- MongoDB Atlas account

### Backend

```bash
cd backend
# Update application.properties with your MongoDB Atlas URI
./mvnw spring-boot:run
```

The backend runs on `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`

## Configuration

Update `backend/src/main/resources/application.properties` with your MongoDB Atlas connection string:

```properties
spring.data.mongodb.uri=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/vhms_db
```