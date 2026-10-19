# PersonalHub - Modern Personal Dashboard

> A production-ready, customizable dashboard built with Next.js 15, TypeScript, and Supabase.

![PersonalHub Dashboard](./screenshots/hero-dashboard.png)

## 🌟 Features

### 📊 Widget System

- **Drag & Drop**: Rearrange widgets with intuitive drag-and-drop
- **Persistent Layout**: Your layout saves automatically
- **Easy to Extend**: Add custom widgets with simple API
- **Responsive Grid**: Adapts beautifully to all screen sizes

### 🎯 Built-in Widgets

#### 1. Todo List Widget

- ✅ Create, edit, delete tasks
- 🎨 Color-coded type badges (work, personal, urgent, etc.)
- 📱 Drag & drop reordering
- 💾 Persistent storage with Supabase
- 📊 Progress tracking
- ⏰ Due date support

#### 2. Weather Widget

- 🌤️ Real-time weather data
- 📍 Location-based forecasts
- 🎬 Animated weather backgrounds (GIFs)
- 📅 Hourly and daily forecasts
- 🖼️ Beautiful weather icons
- 🔄 Auto-refresh

#### 3. Pomodoro Timer

- ⏱️ Customizable work/break intervals
- 🔔 Browser notifications
- 📊 Session tracking
- ⏸️ Pause/resume functionality
- 🎯 Focus mode

#### 4. Sticky Notes

- 📝 Rich text editing
- 🎨 Color customization
- 📌 Pin important notes
- 💾 Auto-save
- 🗑️ Easy deletion

#### 5. Analog Clock

- ⏰ Real-time clock display
- 🎨 Elegant design
- 🌓 Dark/light mode support
- 📱 Responsive sizing

#### 6. Custom Widget System

- 🔧 Easy to create new widgets
- 📦 Component-based architecture
- 🎯 Standardized widget API
- 🔄 Hot reloading during development

### 🔐 Authentication System

- 📧 Email/password authentication
- 🔒 Secure session management
- 🛡️ Protected routes with middleware
- 👤 User profile management
- 🔑 Password reset functionality
- ✨ Smooth auth flow

### 🎨 Theming & Customization

- 🌈 6 pre-built themes:
  - Purple Rain
  - Ocean Blue
  - Forest Green
  - Sunset Orange
  - Rose Pink
  - Midnight Dark
- 🌓 Light & dark mode
- 🎯 Accent color customization
- 💅 SCSS-based styling
- 🔧 Easy to add custom themes

### ⚙️ Settings Panel

- 👤 Account management
- 🎨 Theme customization
- 🌍 Preferences
- 🔔 Notification settings
- 🗑️ Data management

## 🛠️ Tech Stack

### Core

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5+
- **Styling**: SCSS with CSS Modules
- **UI Framework**: React 19

### Backend & Data

- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes

### State Management

- **Global State**: Zustand
- **Server State**: React Query patterns
- **Form State**: React Hook Form

### UI & Interactions

- **Drag & Drop**: React Grid Layout
- **Icons**: Custom SVG system
- **Animations**: CSS transitions
- **Responsive**: CSS Grid & Flexbox

### Development Tools

- **Type Checking**: TypeScript strict mode
- **Linting**: ESLint
- **Code Formatting**: Prettier (if configured)
- **Version Control**: Git

### External APIs

- **Weather**: WeatherAPI.com
- **Future**: Extensible for more APIs

## 📦 Installation

### Prerequisites

- Node.js 18 or higher
- npm or yarn or pnpm
- Supabase account (free tier works)
- WeatherAPI account (free tier works)

### Step 1: Clone and Install

```bash
# Extract the downloaded files
cd personalhub

# Install dependencies
npm install
```

### Step 2: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your credentials
```

Required environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Weather API
NEXT_PUBLIC_WEATHER_API_KEY=your_weather_api_key
```

### Step 3: Set Up Supabase Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run these commands:

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create widgets table
create table public.widgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  widget_type varchar(50) not null,
  position jsonb not null,
  settings jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create todos table
create table public.todos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  description text,
  completed boolean default false,
  type varchar(50),
  due_date timestamp with time zone,
  order_index integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create user_settings table
create table public.user_settings (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users unique not null,
  theme jsonb,
  preferences jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.widgets enable row level security;
alter table public.todos enable row level security;
alter table public.user_settings enable row level security;

-- Create policies for widgets
create policy "Users can view their own widgets"
  on public.widgets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own widgets"
  on public.widgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own widgets"
  on public.widgets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own widgets"
  on public.widgets for delete
  using (auth.uid() = user_id);

-- Create policies for todos
create policy "Users can view their own todos"
  on public.todos for select
  using (auth.uid() = user_id);

create policy "Users can insert their own todos"
  on public.todos for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own todos"
  on public.todos for update
  using (auth.uid() = user_id);

create policy "Users can delete their own todos"
  on public.todos for delete
  using (auth.uid() = user_id);

-- Create policies for user_settings
create policy "Users can view their own settings"
  on public.user_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert their own settings"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own settings"
  on public.user_settings for update
  using (auth.uid() = user_id);
```

### Step 4: Get Weather API Key

1. Sign up at [weatherapi.com](https://www.weatherapi.com/)
2. Get your free API key
3. Add it to `.env.local`

### Step 5: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables
5. Deploy!

```bash
# Or use Vercel CLI
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
# Build the project
npm run build

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod
```

### Environment Variables for Production

Make sure to add these to your hosting platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_WEATHER_API_KEY`

## 📖 Usage Guide

### Adding a Widget

1. Click the "+" button in the navigation
2. Select widget type from the modal
3. Widget appears on your dashboard
4. Drag to reposition

### Customizing Themes

1. Click Settings icon in navigation
2. Go to "Theme" tab
3. Select a preset theme or customize colors
4. Changes apply instantly

### Managing Todos

1. Click "Add Task" in Todo widget
2. Fill in title, description, type, and due date
3. Drag tasks to reorder
4. Click checkbox to complete
5. Click task to edit

### Using the Pomodoro Timer

1. Set work and break durations
2. Click Start
3. Focus during work sessions
4. Take breaks when prompted
5. Track your productivity

## 🔧 Customization

### Adding a New Widget

1. Create widget component in `src/app/components/widgets/`:

```typescript
// myCustomWidget.tsx
export default function MyCustomWidget() {
  return (
    <div className="widget">
      <h3>My Custom Widget</h3>
      {/* Your widget content */}
    </div>
  );
}
```

2. Add widget type to `src/app/types/widgets.ts`:

```typescript
export type WidgetType =
  | "todo"
  | "weather"
  | "pomodoro"
  | "sticky-notes"
  | "clock"
  | "my-custom-widget"; // Add your type
```

3. Register in widget factory (BaseWidget.tsx or widget registry)

### Adding a New Theme

Edit `src/app/contexts/ThemeRegistry.tsx`:

```typescript
const themes = {
  // ... existing themes
  myTheme: {
    name: "My Theme",
    primary: "#your-color",
    secondary: "#your-color",
    accent: "#your-color",
    background: "#your-color",
    text: "#your-color",
  },
};
```

### Customizing Styles

All styles are in `src/app/styles/`:

- `_globals.scss` - Global styles
- `layouts/` - Layout components
- `widgets/` - Widget-specific styles
- `pages/` - Page-specific styles

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🐛 Troubleshooting

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### Supabase Connection Issues

- Verify URL and key in `.env.local`
- Check Supabase project is active
- Verify Row Level Security policies are created

### Weather API Not Working

- Check API key is valid
- Verify you haven't exceeded free tier limit (1M calls/month)
- Check browser console for errors

### Widgets Not Saving

- Verify Supabase connection
- Check database tables exist
- Verify RLS policies are set correctly

## 📄 License

**Commercial License Included**

✅ Use for unlimited personal projects  
✅ Use for unlimited client projects  
✅ Modify and customize freely  
✅ Use for commercial applications

❌ Cannot resell this template  
❌ Cannot redistribute source code  
❌ Cannot create competing template products

Full license terms in `LICENSE.txt`

## 🤝 Support

Need help? Here's how to get support:

1. **Email**: Reply to your purchase confirmation email
2. **Documentation**: Check `SETUP_GUIDE.md` and `DEPLOYMENT_GUIDE.md`
3. **Common Issues**: See troubleshooting section above

**Response time**: Within 24 hours (usually faster!)

## 🔄 Updates

This template includes **lifetime updates**!

Check your Gumroad library for new versions. Each update includes:

- New features
- Bug fixes
- Performance improvements
- Updated documentation

### Changelog

See `CHANGELOG.md` for version history.

## 🙏 Credits

- Weather data by [WeatherAPI.com](https://weatherapi.com)
- Icons by custom SVG system
- Font: Bold Pixels (included)
- Built with ❤️ using Next.js and Supabase

## 🚀 What's Next?

After setup, consider:

1. **Customize branding** - Add your logo and colors
2. **Add more widgets** - Create widgets for your needs
3. **Integrate APIs** - Connect to your favorite services
4. **Deploy** - Share with the world!
5. **Monetize** - Turn into your own SASS product

## 💡 Need Custom Development?

Want custom features or white-label version? I offer:

- Custom widget development
- Theme customization
- API integrations
- Performance optimization
- Technical consultation

Contact me at [your-email] for a quote!

---

**Happy Building! 🎉**

If you love PersonalHub, please leave a review on Gumroad!
