# AttendanceTracker Pro

## Overview

AttendanceTracker Pro is a modern web application for employee attendance management with geolocation verification and selfie authentication. The system provides secure check-in/check-out functionality with real-time location tracking and photo verification to ensure attendance accuracy. It features separate dashboards for employees and administrators, built with a full-stack architecture using React, Express, and PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Migration to Replit Environment (August 12, 2025) - COMPLETED
- Successfully migrated from Replit Agent to native Replit environment
- **MIGRATED TO FIREBASE**: Complete migration from PostgreSQL to Firebase Firestore
- Set up Firebase Admin SDK and client SDK for GeoSnapAttend project
- Created Firebase-based storage layer with all CRUD operations
- Implemented Firebase session store for authentication state management
- **REMOVED** Replit Auth completely and implemented custom email/password authentication
- Migrated all backend routes and storage logic to use Firebase collections
- Implemented first-user-admin system for initial setup
- Employee invitation system operational with proper access control
- Application successfully running on port 5000 with all API endpoints functional
- Proper security measures implemented with role-based access control

### Enhanced Authentication System (August 12, 2025) - COMPLETED
- **Custom Email/Password Authentication**: Replaced Replit Auth with secure email/password system
- **Password Reset Functionality**: Complete forgot password workflow with email notifications
- **Google OAuth Integration**: Social login option for invited employees
- **Secure Password Hashing**: Using scrypt for password security
- **Session Management**: PostgreSQL-backed sessions with secure cookies
- **Role-Based Access Control**: Separate admin and employee authentication flows
- **Email Integration**: SendGrid integration for password reset emails (with development fallback)

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **UI Library**: Shadcn/ui components built on Radix UI primitives for accessible, customizable interface
- **Styling**: Tailwind CSS with custom design system for consistent theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework for RESTful API
- **Language**: TypeScript throughout for consistency and type safety
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth with OpenID Connect for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage for persistent login state

### Database Design
- **Primary Database**: PostgreSQL with connection pooling via Neon serverless
- **Schema Management**: Drizzle migrations for version-controlled database changes
- **Key Tables**:
  - Users table with role-based access (employee/admin)
  - Attendance records with check-in/out timestamps and geolocation data
  - Sessions table for authentication state persistence
  - Work locations for office/site management

### Authentication & Authorization
- **Strategy**: Replit Auth integration with OpenID Connect protocol
- **Role System**: Employee and admin roles with different dashboard access
- **Session Security**: HTTP-only cookies with configurable expiration
- **Route Protection**: Middleware-based authentication checks on sensitive endpoints

### Key Features Architecture
- **Geolocation Verification**: Browser Geolocation API with coordinate storage
- **Photo Authentication**: Camera API integration with base64 image capture
- **Real-time Updates**: React Query for automatic data synchronization
- **Responsive Design**: Mobile-first approach with touch-friendly interfaces
- **Error Handling**: Comprehensive error boundaries and user feedback systems

### API Design
- **Structure**: RESTful endpoints with consistent JSON responses
- **Routes**:
  - `/api/auth/*` - Authentication and user management
  - `/api/attendance/*` - Check-in/out operations and history
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error middleware with proper HTTP status codes

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle Kit**: Database migration management and schema generation

### Authentication Services
- **Replit Auth**: Integrated authentication system with OpenID Connect
- **Session Storage**: PostgreSQL-backed session management via connect-pg-simple

### UI/UX Libraries
- **Radix UI**: Accessible component primitives for complex UI elements
- **Lucide React**: Consistent icon library for interface elements
- **TailwindCSS**: Utility-first CSS framework for rapid styling

### Development Tools
- **TypeScript**: Static typing for enhanced developer experience
- **Vite**: Fast build tool with hot module replacement
- **ESBuild**: Fast JavaScript bundler for production builds

### Browser APIs
- **Geolocation API**: For location verification during attendance
- **Camera API**: For selfie capture and verification
- **Local Storage**: For client-side data persistence