# Scotty

A modern changelog and product update management platform with AI-powered assistance and multi-language support.

## Features

### 📝 Changelog Management
- Create, edit, and publish product updates
- Rich text editor with media support
- Draft, scheduled, and published post states
- Category organization and tagging
- Analytics and engagement tracking

### 🤖 AI Assistant
- Integrated chat agent for user support
- Product help and troubleshooting
- Feature discovery and guidance

### 🌍 Multi-Language Support
- Automatic translation of changelog posts
- Support for multiple translation services (OpenAI, Google, DeepL)
- Customizable language settings

### 👥 User Management
- Firebase authentication
- Role-based access control (admin/user)
- User analytics and engagement tracking

### 📊 Analytics & Insights
- View tracking and user engagement metrics
- Post performance analytics
- User behavior insights

### 🎯 Audience Segmentation
- Domain-based user segmentation
- Targeted content delivery
- Customizable user groups

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Storage
- **Deployment**: Netlify with Edge Functions
- **Rich Text**: Quill.js via React Quill
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Firebase project setup

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scotty
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Update `src/lib/firebase.ts` with your Firebase config
   - Ensure Firestore and Authentication are enabled

4. Start the development server:
```bash
npm run dev
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── AdminDashboard.tsx
│   ├── ChangelogWidget.tsx
│   ├── ChatAgent.tsx
│   └── ...
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   ├── api.ts          # API service layer
│   ├── firebase.ts     # Firebase configuration
│   ├── auth.ts         # Authentication utilities
│   └── ...
├── types/              # TypeScript type definitions
└── App.tsx            # Main application component
```

## Deployment

The application is configured for Netlify deployment with:

- Edge functions for AI proxy and view tracking
- Automatic builds from `npm run build`
- Static file serving from `dist/`

Deploy by connecting your repository to Netlify or using the Netlify CLI.

## Configuration

### Environment Variables

Configure the following in your deployment environment:

- Firebase configuration (already in `firebase.ts`)
- AI service API keys (for translation and chat features)
- Analytics tracking IDs

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication with Email/Password
3. Set up Firestore database
4. Configure storage bucket
5. Update the Firebase config in `src/lib/firebase.ts`

## Usage

### For Administrators

1. Sign in with an admin account
2. Access the Admin Dashboard to:
   - Create and manage changelog posts
   - Configure AI assistant settings
   - Set up multi-language support
   - View analytics and user engagement
   - Manage user segments

### For Users

1. Sign up or sign in to view updates
2. Browse changelog posts and updates
3. Use the AI assistant for help and support
4. Receive notifications for new updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is private and proprietary.