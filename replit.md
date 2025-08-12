# AttendanceTracker Pro

## Overview

AttendanceTracker Pro is a modern web application for employee attendance management with geolocation verification and selfie authentication. The system provides secure check-in/check-out functionality with real-time location tracking and photo verification to ensure attendance accuracy. It features separate dashboards for employees and administrators, built with a full-stack architecture using React, Express, and PostgreSQL.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Complete Firebase Migration (August 12, 2025) - ✅ COMPLETED
- **FULLY MIGRATED TO FIREBASE**: Complete migration from PostgreSQL to Firebase Firestore
- ✅ Firebase Admin SDK configured for GeoSnapAttend project
- ✅ All collections created and initialized: users, attendanceRecords, workLocations, employeeInvitations, passwordResetTokens, sessions
- ✅ Firebase-based storage layer with comprehensive CRUD operations
- ✅ Firebase session store implemented with serialization fixes
- ✅ Custom email/password authentication with scrypt password hashing
- ✅ Google OAuth integration for streamlined employee access
- ✅ Default admin user created (parahul270@gmail.com)
- ✅ Default work locations established for geofencing
- ✅ All backend routes migrated to Firebase storage interface
- ✅ Session management fully operational with Firebase backend
- ✅ Application running successfully on port 5000 with all endpoints functional
- ✅ Role-based access control maintained (admin/employee roles)
- ✅ Password reset system functional
- ✅ Employee invitation workflow operational

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
- **Database**: Firebase Firestore with Firebase Admin SDK for server-side operations
- **Authentication**: Custom authentication system with Passport.js strategies
- **Session Management**: Firebase-based session store for persistent login state
- **Email Service**: SendGrid integration for password reset and notifications

### Database Design
- **Primary Database**: Firebase Firestore (NoSQL document database)
- **Schema Management**: Firebase collections with TypeScript type definitions and Zod validation
- **Key Collections**:
  - Users collection with role-based access (employee/admin) and profile management
  - Attendance records with check-in/out timestamps, geolocation data, and photo verification
  - Sessions collection for authentication state persistence (Firebase-based session store)
  - Work locations for office/site management with geofencing capabilities
  - Employee invitations for secure pre-registration workflow
  - Password reset tokens for secure password recovery process

### Authentication & Authorization
- **Strategy**: Custom email/password authentication with Firebase Firestore backend
- **OAuth Integration**: Google OAuth for streamlined employee login
- **Role System**: Employee and admin roles with different dashboard access and permissions
- **Session Security**: Firebase-backed sessions with HTTP-only cookies and configurable expiration
- **Password Security**: Scrypt-based password hashing for enhanced security
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
- **Firebase Firestore**: NoSQL document database with real-time capabilities
- **Firebase Admin SDK**: Server-side Firebase operations and authentication
- **Firebase Authentication**: Integrated user management and OAuth

### Authentication Services
- **Passport.js**: Authentication middleware with local and Google OAuth strategies
- **Session Storage**: Firebase Firestore-backed session management
- **SendGrid**: Email service for password reset notifications (optional)

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