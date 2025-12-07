# What is Scotty? - Complete Guide

## 🎯 What This App Does

**Scotty is a Product Changelog/Updates Widget System** - Think of it like Intercom's product updates, Canny's changelog, or Productboard's announcements.

### The Core Concept

1. **You (Admin) create posts** in the admin panel about:
   - New features you've released
   - Bug fixes
   - Product improvements
   - Announcements

2. **You embed a widget** on your website using a JavaScript snippet

3. **Your website visitors see the widget** - a floating button that shows:
   - How many new updates are available
   - A popup widget with all your product updates
   - Ability to read, search, and interact with updates

## 🔄 How It Works

### Step 1: Create a Post (Admin Panel)
- Go to Admin Dashboard
- Click "Create New Update"
- Write your update (title, content, images, videos)
- Publish it

### Step 2: Get the Embed Code
- In Admin Dashboard, click "Widget Code"
- Copy the JavaScript snippet
- This code loads the widget on your website

### Step 3: Embed on Your Website
- Paste the code into your website's HTML (before `</body>`)
- Or add it to Google Tag Manager
- The widget automatically appears on your site

### Step 4: Users See Your Updates
- A floating button appears (usually bottom-right)
- Shows a badge with number of new updates
- Users click it to see all your product updates
- They can read, search, and interact with updates

## 📍 Where Do People See Your Posts?

**On YOUR website** - wherever you embed the widget code.

The widget appears as:
- A floating button (usually bottom-right corner)
- A notification badge (if you use notification widget)
- A full widget popup when clicked

**Example:**
- You create a post: "New Feature: Dark Mode Released!"
- You embed the widget on `yourwebsite.com`
- Visitors to `yourwebsite.com` see a "What's New" button
- They click it and see your "Dark Mode Released!" post

## 🎯 Why Would You Post Updates?

### For Product Teams:
- **Announce new features** - Let users know what's new
- **Share improvements** - Show you're actively improving
- **Build trust** - Transparency about your product roadmap
- **Reduce support tickets** - Users see what changed
- **Engage users** - Keep them informed and excited

### Real-World Examples:
- **SaaS Products**: "We've added SSO authentication"
- **Mobile Apps**: "New: Dark mode is here!"
- **Websites**: "We've improved our search algorithm"
- **APIs**: "New endpoint: /v2/users available"

## 🏗️ Architecture

### Admin Side (What You See)
- **Admin Dashboard**: Create, edit, delete posts
- **Analytics**: See how many people viewed your posts
- **Settings**: Configure widget appearance, AI assistant, languages
- **Team Management**: Add team members, manage permissions

### User Side (What Visitors See)
- **Widget Button**: Floating button on your website
- **Widget Popup**: Full-screen or sidebar widget with all updates
- **Search**: Users can search through your updates
- **AI Assistant**: Users can ask questions about your product

## 🔑 Key Features

1. **Multi-tenant**: Each team has their own posts and settings
2. **Embeddable Widget**: One line of code to embed anywhere
3. **Analytics**: Track views, engagement, user behavior
4. **Multi-language**: Support multiple languages
5. **Segments**: Show different updates to different user groups
6. **AI Assistant**: Users can chat with AI about your product
7. **Rich Content**: Support for images, videos, markdown

## 📊 The Flow

```
Admin Creates Post → Post Saved to Firebase → Widget Code Loads Posts → 
Users See Widget on Website → Users Click Widget → Users Read Posts → 
Analytics Tracked → Admin Sees Analytics
```

## 🎨 Widget Types

1. **Full Widget**: Complete changelog with all features
2. **Notification Widget**: Just a badge showing update count
3. **GTM Widget**: Google Tag Manager compatible

## 💡 Use Cases

- **SaaS Products**: Announce new features to users
- **Mobile Apps**: Share app updates
- **Websites**: Show what's new on your site
- **APIs**: Document API changes
- **Internal Tools**: Keep team informed of changes

---

**In Summary**: You create product updates in the admin panel, embed a widget on your website, and your visitors see those updates through the widget. It's a way to communicate product changes directly to your users.

