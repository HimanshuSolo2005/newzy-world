# Newzy World 🗞️

![Newzy World Logo](./public/images/newzy-logo.svg)

Newzy World is a modern news aggregation and summarization platform powered by AI. Built with Next.js, TypeScript, and Tailwind CSS, it delivers personalized news summaries, real-time updates, and local information in an elegant, user-friendly interface.

## 🔄 How It Works

### News Aggregation & AI Processing
1. **News Collection**: Fetches latest news from NewsAPI across various categories
2. **AI Summarization**: Uses GROQ AI to generate concise summaries of articles
3. **Content Processing**: Categorizes and tags articles automatically
4. **User Personalization**: Delivers customized content based on user preferences

### User Flow
1. **Authentication**: Users can sign in via Google or GitHub
2. **News Browsing**: Browse categorized news with AI-generated summaries
3. **Bookmarking**: Save interesting articles for later reading
4. **Local Services**: Access weather updates and traffic information
5. **Customization**: Toggle between dark/light themes and customize news preferences

### Technical Architecture
1. **Frontend Layer**: 
   - Next.js 14 App Router for routing and server components
   - React components with TypeScript for type safety
   - Tailwind CSS with Shadcn UI for modern, responsive design
   - Client-side state management for user preferences

2. **Backend Services**:
   - Next.js API routes for serverless functions
   - MongoDB for user data and bookmarks storage
   - NextAuth.js for secure authentication
   - API integrations (NewsAPI, GROQ, Weather, Google Maps)

3. **Data Flow**:
   - Server-side news fetching and caching
   - Real-time weather and traffic updates
   - Secure user data management
   - Optimized content delivery with Next.js

## 💻 Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js with OAuth providers
- **External APIs**: NewsAPI, GROQ AI API for summarization, Weather API, Google Maps API
- **UI Components**: Shadcn UI and React Bits for consistent design

## 🚀 Features

- **AI-Powered News**: Smart summarization and categorization
- **Authentication**: Secure Google and GitHub OAuth integration
- **Personalization**: User-specific bookmarks and preferences
- **Weather & Maps**: Real-time local information
- **Modern UI**: Responsive design with dark/light mode
- **Protected Routes**: Secure access to user-specific features

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Shadcn UI](https://ui.shadcn.com/)
- [MongoDB](https://www.mongodb.com/)
- [NewsAPI](https://newsapi.org/)
- [GROQ AI](https://groq.com/)
