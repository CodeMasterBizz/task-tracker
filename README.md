# Task Tracker

A simple and secure task management application built with HTML, JavaScript, and Supabase.

## Features

- User authentication (signup/login)
- Create, read, update, and delete tasks
- Mark tasks as complete/incomplete
- Real-time updates
- Secure data access with Row Level Security
- Toast notifications for actions
- Task counter

## Technologies Used

- HTML5
- Tailwind CSS
- JavaScript
- Supabase (Backend and Authentication)

## Setup

1. Clone this repository
2. Set up a Supabase project at [https://supabase.com](https://supabase.com)
3. Create a `tasks` table in Supabase with the following columns:
   - id (uuid, primary key)
   - created_at (timestamp with timezone)
   - title (text)
   - completed (boolean)
   - user_id (uuid, references auth.users)
4. Update `supabase.js` with your Supabase project URL and anon key
5. Run the SQL commands from `setup_rls.sql` in your Supabase SQL editor
6. Serve the application using a local development server

## Security

- Row Level Security (RLS) policies ensure users can only access their own tasks
- Email authentication with automatic confirmation
- Secure password handling through Supabase Auth

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

MIT License