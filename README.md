Tips ledger Service
  How to Run the Project
- Ensure Node.js is Installed
- Install the latest LTS version of Node.js.
- This also installs npm (Node Package Manager).
- Verify installation:
node -v
npm -v
- Navigate to Your Project Folder
- Install Dependencies
npm install
- Verify Installation
npm list --depth=0
- Handle Missing or Outdated Dependencies
npm update
- Global Tools setup
npm install -g @nestjs/cli
- TypeORM CLI
npm install -g typeorm
- React Scripts
npm install -g create-react-app
- Start the database
Ensure you have a running PostgreSQL instance. Update your .env file with the correct connection string.
- Run migrations if you are migrating(No manadatory for local as I did)
npm run typeorm migration:run
- Start the application (backend) 
npm run start
- Start the application (frontend) 
npm run start
- RabbitMQ setup
Make sure RabbitMQ is running locally:
  To check dashboard 
  http://localhost:15672/#/ (By default on local)
  UserName/Password -> guest/guest

- Data Model Overview
Entities and Relationships
1. User
- Fields: id, email, password, name, role (merchant | employee)
- Relations:
- OneToOne → Employee (optional)
- OneToOne → Merchant (optional)
- Purpose: Represents system users with authentication credentials and role assignment.

2. Merchant
- Fields: id, name
- Relations:
- OneToMany → Employees (cascade delete)
- OneToMany → Tables (QR tables for tips)
- OneToOne → User (merchant account)
- Purpose: Represents a business entity that owns employees and tables.

3. Employee
- Fields: id, name
- Relations:
- ManyToOne → Merchant (cascade delete)
- OneToMany → TipIntents
- OneToOne → User (employee account, cascade create)
- Purpose: Represents staff members who can receive tips.

4. TableQR
- Fields: id, code
- Relations:
- ManyToOne → Merchant
- OneToMany → TipIntents
- Purpose: Represents a QR code table identifier for tip transactions.

5. TipIntent
- Fields: id, merchantId, amountFils, idempotencyKey, status (PENDING | CONFIRMED | REVERSED),    
  createdAt, employeeHint
- Relations:
- ManyToOne → Employee (optional)
- ManyToOne → TableQR
- OneToMany → LedgerEntries
- Purpose: Represents a tip transaction intent, with idempotency for safety and a status lifecycle.

6. LedgerEntry
- Fields: id, type (INTENT | CONFIRM | REVERSAL), amountFils, createdAt
- Relations:
- ManyToOne → TipIntent
- Constraints:
- Unique on (tipIntent, type) → ensures no duplicate ledger entries of the same type for a given  
  intent.
- Purpose: Represents immutable financial records tied to a tip intent.

- Idempotency Approach
- Tip creation: Uses idempotencyKey to ensure repeated requests don’t create duplicate intents.
- Confirmation/Reversal: Before creating a ledger entry, the service checks if one already exists  
  for the same tipIntentId and LedgerType.
- Consumer safety: Each event handler queries for existing ledger entries before applying side  
  effects. Database constraints (unique index on (tipIntentId, type)) enforce idempotency at the persistence layer.

- Concurrency Handling
Transactions: All state changes (create, confirm, reverse) run inside database transactions.
- Locks: pessimistic_write locks are used when confirming or reversing intents to prevent race conditions.
- At-least-once delivery: Consumers are designed to handle duplicate events safely by checking for  
existing side effects.

- Swagger url to see all end point
http://localhost:3000/api-docs


- System intraction step
1. First signup as merchant
2. Create table
3. Create Employee
4. Create intent and then process all flow like confirm and reversal
5. Login as Merchant and see Dashboard
6. Login as Employee and see Dashboard
