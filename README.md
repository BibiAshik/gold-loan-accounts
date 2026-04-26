# Gold Loan Accounts

A Spring Boot CRUD app for managing customer balances and gold-loan transactions.

## What is included

- Customer create, read, update, and delete
- Deposit and loan transaction logging
- Login-protected UI and API
- Local H2 database fallback
- PostgreSQL support for production
- Dockerfile and Render Blueprint deployment

## Local run

This machine needs Maven or Docker to run the app locally.

With Maven installed:

```powershell
mvn spring-boot:run
```

Then open:

```text
http://localhost:8080
```

Default login:

```text
username: admin
password: secret123
```

Set a safer password before sharing the app:

```powershell
$env:APP_PASSWORD="your-password"
mvn spring-boot:run
```

## Render deployment

1. Push this `construction-app` folder to a GitHub repository.
2. In Render, choose **Blueprint** and select the repository.
3. Render will read `render.yaml`, create the web service, and create the PostgreSQL database.
4. After the first deploy, open the web service environment page and reveal/copy `APP_PASSWORD` if needed.
5. Log in with `APP_USERNAME` and `APP_PASSWORD`.

The app accepts Render's `DATABASE_URL` value directly. It converts the `postgresql://...` URL into Spring Boot's JDBC datasource settings at startup.

## Useful environment variables

```text
APP_USERNAME=admin
APP_PASSWORD=change-this-password
DATABASE_URL=postgresql://user:password@host:5432/database
PORT=8080
```
