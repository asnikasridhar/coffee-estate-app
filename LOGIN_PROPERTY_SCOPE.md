# Login + Property Scope Added

This version adds:

1. Owner login page.
2. Top property dropdown after login.
3. Owner can have multiple properties.
4. All property-specific data is loaded against the selected property.
5. Attendance, rainfall, yield, blocks, plants, expenses, income, fertilizers, assets and reports are restricted by selected property.
6. If the owner has no property, the app shows a property registration form first.

## Demo login

For local testing:

- Username: `Asnika Sridhar`
- Password: `owner123`

Hashed legacy users can use `owner123` locally. Plaintext seeded users can use their stored plaintext passwords.

## Important

This local auth is for development testing. Before production, replace demo password handling with real password hashing/JWT sessions or Cloudflare Access.
