# Aeon Analytics UI Component Library

A collection of reusable UI components for the Aeon Analytics dashboard. These components are built with React, TypeScript, and Tailwind CSS.

## Available Components

### Button

A versatile button component with various styles and states.

```tsx
import Button from '@/components/ui/Button';

<Button variant="primary" size="md">Click me</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `isLoading`: boolean
- `leftIcon`: ReactNode
- `rightIcon`: ReactNode
- `disabled`: boolean
- All standard button attributes

### Card

A flexible card component for displaying grouped content.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

<Card variant="default" padding="md">
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description text</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    Footer content
  </CardFooter>
</Card>
```

**Props:**
- `variant`: 'default' | 'bordered' | 'glass'
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `bordered`: boolean
- `hoverable`: boolean
- `withShadow`: boolean

### Badge

A small status indicator component.

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="primary" size="md" rounded>New</Badge>
```

**Props:**
- `variant`: 'default' | 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'outline'
- `size`: 'sm' | 'md' | 'lg'
- `rounded`: boolean

### Navbar

A navigation bar component for consistent page headers.

```tsx
import { Navbar } from '@/components/ui/Navbar';

<Navbar 
  items={[
    { href: '/', label: 'Home' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/settings', label: 'Settings' }
  ]} 
/>
```

**Props:**
- `items`: Array of `{ href: string, label: string }`
- `className`: For additional styling

## Utility Functions

### cn

A utility function for conditionally joining classNames.

```tsx
import { cn } from '@/lib/utils';

<div className={cn(
  "base-class",
  isActive && "active-class",
  variant === 'primary' ? 'primary-class' : 'secondary-class'
)}>
  Content
</div>
```

## Demo Page

Visit the UI Components demo page at `/ui-demo` to see all components in action.

## Styling

All components are built with Tailwind CSS and support both light and dark modes. Components use the following color scheme:

- Primary: Blue (#3B82F6)
- Secondary: Purple (#9333EA)
- Success: Green (#10B981)
- Danger: Red (#EF4444)
- Warning: Yellow (#F59E0B)
- Info: Cyan (#06B6D4)
- Gray shades for neutral colors

## Best Practices

1. Use the appropriate component variant for the intended action
2. Maintain consistent spacing with Tailwind's spacing classes
3. Use the Card component to group related content
4. Use Badges sparingly for important status indicators
5. Ensure proper contrast between text and background colors 