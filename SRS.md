# Software Requirements Specification (SRS)
## Dropzone Management System

### 1. Introduction

#### 1.1 Purpose
This document specifies the user requirements for a dropzone management system designed to streamline operations at an aeroclub conducting weekly skydiving activities.

#### 1.2 Scope
The system will manage tandem registrations, sportsman manifests, equipment tracking, load management, and reporting for a single dropzone operation running primarily Thursday through Sunday.

### 2. User Requirements

#### 2.1 User Management

**UR-001: User Authentication**
- Users shall be able to log in using Telegram Single Sign-On (SSO)
- Users shall be able to log out of the system
- The system shall maintain secure session tokens for authenticated users
- Session tokens shall follow security best practices

**UR-002: User Registration**
- New users shall be able to register using Telegram SSO
- Users shall be assigned a default status of "Newby" upon registration
- Registration shall capture basic user information linked to Telegram account

**UR-003: User Statuses and Roles**
- The system shall support the following user statuses:
  - Newby (unlicensed, can do tandems or guided jumps)
  - Individual Sportsman (paid) 
  - Sportsman (free/competitive)
  - Instructor
- The system shall support an Administrator role that can be assigned to any user, regardless of their status.
- Users shall be able to request upgrade to Sportsman status
- Users requesting Sportsman status shall be able to submit license documentation
- Administrators shall be able to approve or decline Sportsman status requests

**UR-004: Administrative User Management**
- Administrators shall be able to create, read, update, and delete user accounts
- Administrators shall be able to view and modify user statuses
- Administrators shall be able to list all users in the system

#### 2.2 Tandem Registration Management

**UR-005: Tandem Slot Management**
- Administrators shall be able to set available tandem slots for any given day
- Administrators shall be able to perform bulk updates to slot availability
- The system shall track remaining available slots per day

**UR-006: Tandem Booking**
- Users shall be able to register for tandem jumps through a booking form
- Users shall be able to select jump dates from a calendar showing only days with available slots
- The system shall prevent overbooking by hiding dates with no available slots
- The system shall track the payment status for tandem bookings.
- Users shall receive confirmation of their booking

**UR-007: Tandem Registration Management**
- Administrators shall be able to create, read, update, and delete tandem registrations
- Administrators shall be able to view all tandem registrations
- Administrators shall be able to generate manifests from confirmed tandem registrations

**UR-008: Tandem Booking Modifications**
- Users shall be able to change the date of their tandem booking
- Users shall be able to cancel their tandem booking
- Date changes shall be subject to slot availability on the new date

#### 2.3 Sportsman Management

**UR-009: Digital Logbook**
- Sportsmen and Instructors shall be able to view their complete jump history in the form of a digital logbook.
- The logbook shall include date, jump type, equipment used, and load information for each jump.
- The logbook shall be sortable and filterable by date range and jump type.
- The system shall display summary statistics for each jumper, such as total jump count and breakdown by jump type.

**UR-010: Self-Manifesting**
- Sportsmen and Instructors shall be able to manifest themselves for jumps
- Users shall be able to select equipment for their jump:
  - Main parachute
  - Reserve parachute (when applicable to main type)
  - Safety device
- Users shall be able to specify jump type (Sport, AFF, Other)
- The system shall track payment status for paid jumps (e.g., Individual Sportsman jumps).
- Manifests shall be submitted for administrator approval

#### 2.4 Equipment Management

**UR-011: Equipment Inventory**
- Administrators shall be able to create, read, update, and delete equipment records
- Equipment records shall include type, name, serial number, and status
- The system shall categorize equipment by type (main parachutes, reserve parachutes, safety devices)

**UR-012: Equipment Usage Tracking**
- The system shall track equipment usage in jumps
- Users shall be able to view equipment usage history
- Equipment history shall show dates used, user, and jump details

#### 2.5 Load Management

**UR-013: Manifest Review**
- Administrators shall be able to view pending manifests in chronological order (oldest first)
- Administrators shall be able to approve manifests and convert them to jumps within specific loads
- Administrators shall be able to decline manifests with reason for decline
- Users shall be notified of manifest approval or decline decisions

**UR-014: Manual Manifest Management**
- Administrators shall be able to create, read, update, and delete manifests manually
- Manual manifests shall include user, equipment, jump type, and intended load

**UR-015: Jump Management**
- Administrators shall be able to create, read, update, and delete jumps within loads
- Jump records shall include jumper, equipment used, jump type, and outcome

**UR-016: Load Management**
- Administrators shall be able to create, read, update, and delete loads (flights)
- Loads shall include date, time, aircraft information, and associated jumps
- Load information shall specify maximum capacity

**UR-017: Load Visibility**
- Instructors and Sportsmen shall be able to view scheduled loads
- Users shall be able to view jumps assigned to each load
- Load information shall show remaining capacity

#### 2.6 Reporting

**UR-018: Jump Statistics Report**
- Administrators shall be able to generate reports showing jump quantities and types by user
- Reports shall be filterable by date range
- Reports shall include breakdown by jump type (Tandem, Sport Free, Sport Paid, AFF)
- Reports shall be exportable in standard formats

#### 2.7 System Administration

**UR-019: Dictionary Management**
- Administrators shall be able to manage system value lists including:
  - Jump types
  - Equipment types
  - Equipment names and models
  - Load/flight designations
- Dictionary items shall be creatable, readable, updatable, and deletable
- Changes to dictionaries shall not affect historical data integrity

#### 2.8 Notifications

**UR-20: User Notifications**
- The system shall send notifications to users via the Telegram bot for key events, including:
  - Successful registration
  - Tandem booking confirmation, modification, or cancellation
  - Manifest approval or rejection
  - Reminders for upcoming jumps
  - Confirmation of status change (e.g., promotion to Sportsman)

### 3. User Interface Requirements

**UR-21: Multi-Platform Access**
- The system shall provide a web-based interface accessible via standard browsers
- The system shall provide a Telegram bot interface for authentication and basic operations
- Both interfaces shall provide consistent functionality appropriate to their platform

**UR-22: Responsive Design**
- The web interface shall be responsive and usable on desktop and mobile devices
- Calendar views shall be optimized for both desktop and mobile interaction

### 4. Security Requirements

**UR-23: Access Control**
- The system shall enforce role-based access control based on user status and role.
- Administrative functions shall be restricted to users with the Administrator role.
- Users shall only access data and functions appropriate to their role

**UR-24: Data Privacy**
- User personal information shall be protected and only accessible to authorized personnel
- The system shall comply with applicable data protection regulations

### 5. Business Rules

**BR-001: Operation Schedule**
- The system shall support operations primarily Thursday through Sunday but allow scheduling on any day

**BR-002: Single Aircraft Operation**
- The system shall be designed for single aircraft, single airfield operations

**BR-003: Jump Type Classifications**
- The system shall enforce proper classification of jumps as Tandem, Sport (Free), Sport (Paid), or AFF

**BR-004: Equipment Assignment**
- Equipment assignments shall prevent double-booking of equipment for the same time slot

**BR-005: Manifest Approval Workflow**
- All sportsman manifests shall require administrator approval before being added to loads

**BR-006: Payment Handling**
- The system will track the payment status of jumps but will not process payments directly. All payments are handled through an external process.

### 6. Non-Functional Requirements

**NFR-001: System Health**
- The system shall provide an API endpoint for health check monitoring.

**NFR-002: Deployability**
- The system shall be designed to be deployed as a set of containerized services (e.g., using Docker).

**NFR-003: Usability**
- The user interfaces (Web and Telegram) shall be intuitive and require minimal training for users familiar with standard web applications and bots.

**NFR-004: Reliability**
- The system shall aim for high availability during the dropzone's primary operating hours (Thursday-Sunday).