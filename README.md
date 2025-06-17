# RT1M - Road to 1 Million

A full-stack React application for tracking your financial journey to $1,000,000. Built with React, TypeScript, Firebase, and TailwindCSS.

## Project Structure

```
RT1M/
├── client/                  # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── contexts/        # React contexts
│   │   ├── services/        # API and service functions
│   │   ├── utils/           # Utility functions
│   │   ├── config/          # Configuration files
│   │   └── ...
│   ├── package.json
│   └── ...
├── server/                  # Firebase backend
│   └── functions/           # Firebase Cloud Functions
│       ├── src/
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
└── README.md
```

## Features

- 🔐 **Authentication**: Secure login/signup with Firebase Auth
- 📊 **Dashboard**: Track your progress towards $1M goal
- 💰 **Financial Tracking**: Record income and expenses
- 👤 **Profile Management**: Update user information
- 📱 **Responsive Design**: Works on desktop and mobile
- 🔒 **Protected Routes**: Secure pages requiring authentication
- ☁️ **Cloud Backend**: Firebase Firestore for data persistence
- ⚡ **Real-time Updates**: Live data synchronization

## Tech Stack

### Frontend (Client)
- **React 18** with TypeScript
- **Vite** for development and building
- **React Router DOM** for navigation
- **TailwindCSS** for styling
- **React Hook Form** for form handling
- **React Hot Toast** for notifications

### Backend (Server)
- **Firebase Authentication** for user management
- **Firestore** for database
- **Firebase Functions** for serverless backend logic

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd RT1M
```

### 2. Install dependencies

#### Frontend (Client)
```bash
cd client
npm install
```

#### Backend (Server) - Optional
```bash
cd server/functions
npm install
```

### 3. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)

2. Enable Authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password authentication

3. Create Firestore Database:
   - Go to Firestore Database
   - Create database in test mode (you can configure security rules later)

4. Get your Firebase configuration:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and click "Web app"
   - Copy the configuration object

### 4. Environment Variables

1. Copy the environment template in the client directory:
```bash
cd client
cp env.example .env.local
```

2. Fill in your Firebase configuration in `client/.env.local`:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Run the application

#### Frontend Development Server
```bash
cd client
npm run dev
```

Visit `http://localhost:5173` to see your application.

#### Firebase Functions (Optional)
```bash
cd server/functions
npm run serve
```

## Available Scripts

### Frontend (Client)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Firebase Functions (Server)
- `npm run serve` - Run functions emulator
- `npm run deploy` - Deploy functions to Firebase
- `npm run logs` - View function logs

## Firebase Security Rules

Add these Firestore security rules in the Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /userProgress/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /transactions/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Deployment

### Frontend (Client)
Deploy the client to any static hosting service:

**Netlify/Vercel:**
1. Build the project: `cd client && npm run build`
2. Deploy the `client/dist` folder
3. Set environment variables in your hosting platform

**Firebase Hosting:**
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Initialize: `firebase init hosting`
3. Set public directory to `client/dist`
4. Deploy: `firebase deploy --only hosting`

### Firebase Functions (Server)
```bash
cd server/functions
firebase login
firebase init functions
firebase deploy --only functions
```

## Development Workflow

1. **Frontend Development**: Work in the `client/` directory
   ```bash
   cd client
   npm run dev
   ```

2. **Backend Development**: Work in the `server/functions/` directory
   ```bash
   cd server/functions
   npm run serve
   ```

3. **Full Stack Testing**: Run both frontend and backend simultaneously

## Pages and Routes

- `/` - Landing page
- `/login` - User login
- `/signup` - User registration  
- `/dashboard` - Main dashboard (protected)
- `/profile` - User profile management (protected)

## Features to Implement

- [ ] Goal setting and tracking
- [ ] Expense categories
- [ ] Data visualization charts
- [ ] Monthly/yearly reports
- [ ] Export data functionality
- [ ] Dark mode
- [ ] Email notifications
- [ ] Social sharing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Work in the appropriate directory (`client/` or `server/`)
4. Commit your changes
5. Push to the branch
6. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub. 