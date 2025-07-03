# D365 Test Automation Platform

## Overview

The D365 Test Automation Platform is a comprehensive web-based solution for creating, managing, and executing automated test cases for Microsoft Dynamics 365 model-driven applications. The platform provides a user-friendly interface for building test scenarios using drag-and-drop functionality and executes them using Playwright automation framework.

## System Architecture

### Backend Architecture
- **Framework**: FastAPI (Python) - chosen for its modern async capabilities, automatic API documentation, and strong typing support
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Database**: SQL Server with SQLAlchemy ORM, fallback to SQLite for development
- **Test Execution**: Playwright automation engine with JavaScript/TypeScript test generation
- **API Design**: RESTful API with modular router structure

### Frontend Architecture
- **Technology**: Vanilla JavaScript with component-based architecture
- **Styling**: Tailwind CSS for responsive design
- **State Management**: Class-based components with centralized app controller
- **UI Pattern**: Single Page Application (SPA) with dynamic view switching

### Database Schema
- **Users**: Authentication and user management
- **TestCases**: Test definitions with JSON-based step storage
- **TestRuns**: Execution history and results tracking
- **Relationships**: Foreign key relationships linking users to their test cases and runs

## Key Components

### Authentication System
- **Problem**: Secure user access and session management
- **Solution**: JWT tokens with Bearer authentication scheme
- **Features**: User registration, login, password hashing, token validation
- **Security**: HTTPBearer security scheme with configurable token expiration

### Test Case Builder
- **Problem**: User-friendly test creation without coding knowledge
- **Solution**: Drag-and-drop interface with predefined step types
- **Step Types**: Navigate, click, fill, verify, wait, conditional logic, break_if, loop_until
- **Conditional Features**: Element existence checks, text validation, visibility checks, break criteria
- **Storage**: JSON format for flexible step definitions with conditional parameters

### Test Execution Engine
- **Problem**: Converting visual test definitions to executable code
- **Solution**: Dynamic Playwright script generation from JSON definitions using D365TestRunner class
- **Features**: Template-based script generation, error handling, result capture, conditional logic
- **Playwright Integration**: Full browser automation with D365-specific selectors and methods
- **Conditional Actions**: break_if (pass/fail), loop_until (retry logic), condition checks
- **Execution**: Subprocess-based Playwright CLI execution with output parsing and trace collection

### Results Management
- **Problem**: Tracking and reporting test execution outcomes
- **Solution**: Comprehensive logging with historical data storage
- **Features**: Status tracking, execution time measurement, detailed result output
- **Reporting**: Filtering, pagination, and trend analysis capabilities

## Data Flow

1. **Test Creation**: User builds test cases through GUI → JSON definition stored in database
2. **Test Execution**: User triggers test run → Backend generates Playwright script → Subprocess execution → Results stored
3. **Result Viewing**: Frontend requests results → Backend queries database → Formatted response returned
4. **Authentication**: Login credentials → JWT token generation → Token validation on protected routes

## External Dependencies

### Python Backend Dependencies
- **FastAPI**: Web framework and API development
- **SQLAlchemy**: Database ORM and connection management
- **Playwright**: Browser automation and test execution
- **Passlib**: Password hashing and verification
- **Jose**: JWT token creation and validation
- **Pydantic**: Data validation and serialization

### Frontend Dependencies
- **Axios**: HTTP client for API communication
- **Tailwind CSS**: Utility-first CSS framework
- **Font Awesome**: Icon library for UI elements

### Database Dependencies
- **SQL Server**: Primary database with ODBC driver
- **SQLite**: Development fallback database

## Deployment Strategy

### Development Environment
- **Database**: SQLite fallback for local development
- **Configuration**: Environment variables for flexible setup
- **Logging**: Detailed logging for debugging and monitoring

### Production Considerations
- **Database**: SQL Server with connection pooling
- **Security**: Configurable CORS settings and secret key management
- **Performance**: Connection recycling and timeout configuration
- **Scalability**: Async architecture supporting concurrent test execution

### Cloud Migration Path
- **Target**: Azure SQL Database
- **Authentication**: Azure AD integration potential
- **Hosting**: Cloud-native deployment with container support

## User Preferences

Preferred communication style: Simple, everyday language.

## Changelog

Changelog:
- July 03, 2025. Initial setup
- July 03, 2025. Added conditional test step support with break_if, loop_until, and condition types
- July 03, 2025. Enhanced Playwright integration with D365TestRunner class supporting conditional logic
- July 03, 2025. Added example test case creation feature demonstrating conditional actions and break criteria