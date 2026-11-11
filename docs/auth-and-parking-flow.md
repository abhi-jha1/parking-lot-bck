# Authentication and parking flow

## Account and role setup

There is no public signup endpoint. A trusted operator must create the first
admin account in the database with a bcrypt password hash and `role = 'admin'`.
To promote an existing account, run this directly in MySQL:

```sql
UPDATE users
SET role = 'admin'
WHERE car_number = 'YOUR_ADMIN_CAR_NUMBER';
```

The `users` table must have `password_hash`, `role`, and
`must_change_password` columns. The admin should log in again after a role
change so the new role is included in their JWT.

## Admin check-in

Parking routes require a valid JWT and a changed password. Check-in and
checkout additionally require the JWT role to be `admin`.

When an admin checks in a car:

1. If its account already exists, the existing account is used.
2. Otherwise, an account is created. Its temporary password is the uppercase
   car number; the server stores only a bcrypt hash of that password.
3. `must_change_password` is set to `true` for the new account.
4. A parking session is created for the account.

Because a car number is not a secret, the temporary password is weak. The
owner should change it as soon as possible.

## Login and JWT cookie

Send a login request:

```http
POST /api/auth/login
Content-Type: application/json
```

```json
{
  "car_number": "KA01AA1234",
  "password": "the-account-password"
}
```

For a new account created at check-in, use the car number as the temporary
password. On success, the server sets an HttpOnly cookie named `token`; the
JWT is not returned in the JSON body.

The JWT contains:

- `sub`: user ID
- `role`: `admin` or `customer`
- `must_change_password`: whether the temporary password must be changed
- `iat` and `exp`: issue and expiry times; this token expires after one hour

The cookie is HttpOnly, has a one-hour lifetime, uses `SameSite=Lax`, and is
restricted to HTTPS when `NODE_ENV=production`. The browser sends it with
subsequent requests. Frontends using a different origin must send requests
with credentials enabled, and that origin must be listed in `CLIENT_ORIGINS`.

## Change password

Change a password with the authenticated cookie:

```http
POST /api/auth/change-password
Content-Type: application/json
Cookie: token=<set-by-login>
```

```json
{
  "current_password": "current-password",
  "new_password": "a-new-password-at-least-8-characters"
}
```

Passwords must be at least 8 characters and no more than 72 UTF-8 bytes. The
server verifies the current password, stores a bcrypt hash of the new one,
clears `must_change_password`, and sets a refreshed JWT cookie. For temporary
accounts, the current password is the car number.

## Authorized parking requests

All `/api/parking` endpoints require authentication and a changed password:

- `POST /api/parking/checkin`: admin only; body contains `car_number`.
- `POST /api/parking/checkout`: admin only; body contains `car_number`.
- `GET /api/parking/history/:car_number`: customers can read only their own
  vehicle history; admins can read any vehicle's history.

The server verifies the JWT and reads the user ID from `sub`. Customer history
access is matched to the authenticated account, rather than trusting a
user-supplied ID.

## Logout

Send `POST /api/auth/logout`. The server clears the `token` cookie. The logout
endpoint does not require authentication; it can also clear an expired
cookie.

## Swagger

Open `/api-docs` to explore the API. Authentication endpoints are grouped
under **Authentication**. After logging in, use the browser's cookie for the
protected requests; the token is intentionally not exposed to page JavaScript.
