# WorkPulse

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

> AI-powered multi-tenant team management SaaS built with the MERN stack, featuring task tracking, PDF summarization, and Excel data visualization.

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## 🎯 About

**WorkPulse** is an intelligent team management platform designed for modern organizations. It combines traditional project management features with AI-powered capabilities to help teams work smarter. The platform supports multiple organizations (multi-tenant architecture) with complete data isolation, ensuring each company's information remains secure and separate.

## ✨ Features

### Core Features
- 🏢 **Multi-tenant SaaS Architecture** - Multiple companies can use the platform with complete data isolation
- 🔐 **Role-based Authentication** - Admin and Member roles with different permissions
- 👥 **Team Management** - Create and manage teams within your organization
- ✅ **Task Tracking** - Assign, track, and manage tasks across teams
- 📊 **Dashboard** - Comprehensive overview of team performance and tasks

### AI-Powered Features
- 📄 **PDF Summarization** - AI-powered document analysis and summarization
- 📈 **Excel Data Analysis** - Automatic data processing and insights
- 📊 **Chart Generation** - Auto-generate bar charts and pie charts from data
- 🤖 **Productivity Insights** - AI-based recommendations for team improvement

### Security & Access Control
- 🔒 Company-based data isolation
- 🛡️ Protected routes and authentication
- 👤 User profile management
- 🔑 Secure login and registration

## 🛠️ Tech Stack

### Frontend
- **React.js** - UI library
- **Tailwind CSS** - Styling framework
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM

### Additional Tools
- **JWT** - Authentication
- **AI APIs** - Document processing and data analysis

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sampurn17/workPulse.git
   cd workPulse
   ```

2. **Install server dependencies**
   ```bash
   cd workpulse
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Set up environment variables**
   
   Create a `.env` file in the `workpulse` (server) directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   # Add other necessary environment variables
   ```

5. **Run the application**

   In one terminal (server):
   ```bash
   cd workpulse
   npm start
   ```

   In another terminal (client):
   ```bash
   cd client
   npm start
   ```

6. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

## 📁 Project Structure

```
workPulse/
├── client/                 # Frontend React application
│   ├── public/
│   ├── src/
│   │   ├── api/           # API calls
│   │   ├── assets/        # Images, icons
│   │   ├── components/    # Reusable components
│   │   │   └── ui/        # UI components
│   │   ├── pages/         # Page components
│   │   │   ├── AdminRoute.jsx
│   │   │   ├── AuthContext.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Teams.jsx
│   │   │   └── Users.jsx
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   └── tailwind.config.js
│
└── workpulse/             # Backend Node.js application
    ├── models/            # Database models
    ├── routes/            # API routes
    ├── controllers/       # Route controllers
    ├── middleware/        # Custom middleware
    ├── config/            # Configuration files
    ├── server.js          # Entry point
    └── package.json
```

## 💡 Usage

### For Admins
1. **Register your company** - Create an account and set up your organization
2. **Invite team members** - Add users to your workspace
3. **Create teams** - Organize members into teams
4. **Assign tasks** - Delegate work and track progress
5. **Upload documents** - Use AI to summarize PDFs and analyze Excel files
6. **View insights** - Check AI-generated productivity reports

### For Members
1. **Log in** - Access your company workspace
2. **View tasks** - See assigned tasks and deadlines
3. **Update progress** - Mark tasks as complete
4. **Collaborate** - Work with your team members

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Sampurn Samadder**

- GitHub: [@Sampurn17](https://github.com/Sampurn17)
- LinkedIn: [Your LinkedIn Profile](#) <!-- Add your LinkedIn URL -->

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape WorkPulse
- Inspired by modern team management tools
- Built with ❤️ using the MERN stack

---

**Note:** This project is under active development. Features and documentation may change.

For questions or support, please open an issue on GitHub.
