# Education Expo Communications Portal  
*Requirements Document*

---

## 1. Introduction

This document outlines the functional and non-functional requirements for the **Education Expo Communications Portal**. The portal will serve as a central platform to manage contacts and dispatch bulk communications (Email, WhatsApp, SMS) to stakeholders of the Education Expo.

---

## 2. Objectives

- Provide a unified interface for managing stakeholder contacts.
- Support segmented bulk communication via Email, WhatsApp (via MsgClub API), and SMS.
- Ensure data integrity, traceability, and efficiency in outreach efforts.

---

## 3. Scope

### In Scope

- Contact management
- Bulk Email sending
- Bulk WhatsApp via MsgClub API
- Bulk SMS sending
- Delivery status logging and basic reporting

### Out of Scope

- Event registration or ticketing workflows
- Payment processing
- Advanced marketing automation

---

## 4. Actors & Roles

- **Administrator**  
  Full access to manage all data and settings.

- **Communications Officer**  
  Manage contacts and dispatch communications.

- **System**  
  Backend processes and job handling.

---

## 5. Technology Stack

| Layer       | Technology             | Purpose                                  |
|------------|------------------------|------------------------------------------|
| Frontend    | React                  | UI development                           |
| Backend     | Node.js + Express.js   | REST API and business logic              |
| Database    | SQLite                 | Lightweight embedded database            |
| Email       | Nodemailer (SMTP)      | Email dispatch via SMTP server           |
| WhatsApp    | MsgClub API            | Bulk WhatsApp messaging                  |
| SMS         | MsgClub / Twilio       | Bulk SMS messaging                       |
| Scheduling  | node-cron / BullMQ     | Background jobs and retries              |

---
