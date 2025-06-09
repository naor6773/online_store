# Online Store Angular & Express API

This repository contains an Angular front‑end and an Express/Node.js back‑end for an online store application. It uses MongoDB (Atlas or local) to store data, with file uploads handled via GridFS.

## Prerequisites

* **Node.js** v14+ and **npm**
* **Angular CLI** (`npm install -g @angular/cli`)
* A **MongoDB** database (Atlas cluster or local)

## Project Structure

```
/ (root)
├── server.js
└── src/            # Angular application
    ├── app/
    └── …
```

## 1. Configure Environment Variables

1. Copy `server/.env.example` to `server/.env`:

   ```bash
   cp server/.env.example server/.env
   ```
2. Edit `server/.env` and set your MongoDB connection and secrets:

   ```ini
   # MongoDB connection string (Atlas or local)
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/<dbname>?retryWrites=true&w=majority

   # JSON Web Token secret
   JWT_SECRET=your_jwt_secret

   # reCAPTCHA secret key
   RECAPTCHA_SECRET_KEY=your_recaptcha_key
   ```
3. Create `/client/src/environments/environment.ts` (or adjust existing) with your API URL:

   ```ts
   export const environment = {
     production: false,
     apiUrl: 'http://localhost:3000'
   };
   ```

## 2. Setup MongoDB Atlas (Optional)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a new **Free Tier** cluster.
3. Whitelist your IP address under **Network Access**.
4. Create a database user and password under **Database Access**.
5. Copy the provided connection string and paste it into `MONGO_URI`.

## 3. Install Dependencies

```bash
# In the server folder
git clone <repo-url>
cd server
npm install

# In the client folder
cd ../client
npm install
```

## 4. Run Locally

```bash
# Start the API server (port 3000 by default)
cd server
npm start

# Start the Angular app (port 4200 by default)
cd ../client
ng serve
```

Navigate to [http://localhost:4200](http://localhost:4200) in your browser.

## 5. Deploying to Production

* **Server**: build a Docker container or deploy to Heroku, AWS, etc. Ensure environment variables are set.
* **Client**: run `ng build --prod` and serve static files via NGINX or any static host.

## Contributing

1. Fork this repository.
2. Create a feature branch (`git checkout -b feature/xyz`).
3. Commit your changes and push to your fork.
4. Open a Pull Request.

## License

This project is licensed under the MIT License. See `LICENSE` for details.
