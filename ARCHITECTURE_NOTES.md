# Coffee Estate App - Corrected Architecture

## Ownership hierarchy

Owner/User -> Estate Group -> Property -> Block -> Plant/Yield/Operations

The app now treats the selected property as the active working context. After login, the top dropdown controls which property all screens operate on.

## Property scoping rules

The backend reads `x-user-id` and `x-property-id` headers from every request. It verifies that the selected property belongs to the logged-in owner before returning or saving data.

Scoped modules:

- Blocks
- Attendance / labor cost
- Rainfall
- Yield rates and yield settlement
- Plant details
- Assets / inventory
- Expenses
- Crop details and income
- Fertilizers
- Reports

Global/reference modules:

- Base units
- Expense types
- Vendors
- Labor master data
- Wage settings

## Dashboard date range rules

The dashboard supports independent date filters for each item:

- Attendance / labor cost
- Rainfall
- Yield
- Expenses
- Income
- Assets
- Profit
- Recent attendance
- Rain by block
- Income / expense table

The backend clamps each requested range to a maximum of one year. If the frontend or user sends a longer range, the API automatically moves the start date forward.

## Local run

```bash
npm run install:all
npm run seed
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:8787

## Demo login

Username: Asnika Sridhar
Password: owner123

## Image locations

Imported app images:

```txt
client/src/assets/estate-images/
```

Direct public images:

```txt
client/public/estate-images/
```
