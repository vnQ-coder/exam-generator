# AI Question Generator

## Overview

This is a full-stack web application that generates educational questions from text content using Google's Gemini AI. The application allows users to input text and automatically generate various types of questions (multiple choice, true/false, short answer, essay) with customizable parameters like difficulty level and question count. Generated questions are stored in a database and can be viewed in a question bank interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built with React and TypeScript using Vite as the build tool. It follows a component-based architecture with:

- **UI Framework**: shadcn/ui components built on Radix UI primitives for consistent, accessible design
- **Styling**: Tailwind CSS with CSS variables for theming and dark mode support
- **State Management**: TanStack React Query for server state management and API caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

The frontend is structured with a sidebar navigation layout containing pages for question generation and question bank viewing. Components are organized following the shadcn/ui pattern with reusable UI components in the `components/ui` directory.

### Backend Architecture
The server uses Express.js with TypeScript in ESM format. Key architectural decisions include:

- **API Structure**: RESTful endpoints under `/api` prefix for clear separation from static assets
- **Request Handling**: Express middleware for JSON parsing, CORS handling, and request logging
- **Error Handling**: Centralized error middleware for consistent error responses
- **Storage Pattern**: Abstract storage interface (`IStorage`) with in-memory implementation, allowing easy swapping for database persistence later

The server implements a clean separation between routes, business logic (services), and data access (storage), making it maintainable and testable.

### Data Storage Solutions
Currently uses an in-memory storage implementation with plans for PostgreSQL integration:

- **Database ORM**: Drizzle ORM configured for PostgreSQL with Neon database support
- **Schema Management**: Centralized schema definitions in `shared/schema.ts` using Drizzle and Zod
- **Migration Strategy**: Drizzle Kit for database migrations stored in `/migrations`
- **Data Models**: Questions and Users tables with proper relationships and constraints

The storage abstraction allows switching from in-memory to PostgreSQL without changing business logic.

### Authentication and Authorization
Basic user management structure is in place with:

- **User Model**: Username/password authentication schema defined
- **Session Management**: Infrastructure for session-based authentication (though not fully implemented)
- **Future Integration**: Ready for session store integration with PostgreSQL

## External Dependencies

### AI Services
- **Google Gemini AI**: Primary AI service for question generation via `@google/genai` package
- **API Integration**: Configured to use `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` environment variables
- **Question Types**: Supports multiple choice, true/false, short answer, and essay questions with confidence scoring

### Database Services
- **Neon Database**: PostgreSQL-compatible serverless database via `@neondatabase/serverless`
- **Connection**: Uses `DATABASE_URL` environment variable for connection string
- **Session Storage**: PostgreSQL session store ready for implementation with `connect-pg-simple`

### Development Tools
- **Replit Integration**: Specialized plugins for Replit development environment including cartographer and dev banner
- **Build Tools**: Vite for frontend bundling, esbuild for server bundling
- **Type Safety**: Full TypeScript support with shared types between client and server

The application is designed for easy deployment on Replit with development-specific tooling that's conditionally loaded based on the environment.