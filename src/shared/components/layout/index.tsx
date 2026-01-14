/**
 * Main Layout Component
 * Provides consistent layout structure with header, footer, and main content area
 */

import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Navigation from "@/components/Navigation";
import { cn } from "@/shared/utils/helpers";
import { ReactNode } from "react";

interface MainLayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  className?: string;
  containerClassName?: string;
}

export function MainLayout({
  children,
  showNavigation = true,
  className,
  containerClassName,
}: MainLayoutProps) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-background", className)}>
      <Header />
      {showNavigation && <Navigation />}

      <main className={cn("flex-1", containerClassName)}>{children}</main>

      <Footer />
    </div>
  );
}

/**
 * Container Component
 * Provides responsive container with max-width
 */

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({
  children,
  className,
  size = "xl",
}: ContainerProps) {
  const sizeClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-7xl",
    xl: "max-w-screen-2xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeClasses[size],
        className
      )}>
      {children}
    </div>
  );
}

/**
 * Section Component
 * Provides consistent section spacing
 */

interface SectionProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Section({ children, className, size = "md" }: SectionProps) {
  const sizeClasses = {
    sm: "py-8",
    md: "py-12",
    lg: "py-16",
  };

  return (
    <section className={cn(sizeClasses[size], className)}>{children}</section>
  );
}

/**
 * Page Header Component
 * Consistent page header with title and actions
 */

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  backButton?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  backButton,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}>
      <Container>
        <div className="flex flex-col gap-4 py-6">
          {backButton && <div>{backButton}</div>}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
              {description && (
                <p className="mt-2 text-muted-foreground">{description}</p>
              )}
            </div>

            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}

/**
 * Two Column Layout
 * For sidebar and main content
 */

interface TwoColumnLayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  sidebarPosition?: "left" | "right";
  sidebarWidth?: "sm" | "md" | "lg";
  className?: string;
}

export function TwoColumnLayout({
  sidebar,
  children,
  sidebarPosition = "left",
  sidebarWidth = "md",
  className,
}: TwoColumnLayoutProps) {
  const widthClasses = {
    sm: "w-64",
    md: "w-80",
    lg: "w-96",
  };

  return (
    <div className={cn("flex flex-col lg:flex-row gap-6", className)}>
      {sidebarPosition === "left" && (
        <aside className={cn("flex-shrink-0", widthClasses[sidebarWidth])}>
          {sidebar}
        </aside>
      )}

      <div className="flex-1 min-w-0">{children}</div>

      {sidebarPosition === "right" && (
        <aside className={cn("flex-shrink-0", widthClasses[sidebarWidth])}>
          {sidebar}
        </aside>
      )}
    </div>
  );
}

/**
 * Card Grid Layout
 * Responsive grid for cards
 */

interface CardGridProps {
  children: ReactNode;
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function CardGrid({
  children,
  columns = 4,
  gap = "md",
  className,
}: CardGridProps) {
  const columnClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
  };

  const gapClasses = {
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
  };

  return (
    <div
      className={cn(
        "grid",
        columnClasses[columns],
        gapClasses[gap],
        className
      )}>
      {children}
    </div>
  );
}

/**
 * Sticky Header Container
 * Makes header sticky on scroll
 */

interface StickyHeaderProps {
  children: ReactNode;
  className?: string;
  offset?: number;
}

export function StickyHeader({
  children,
  className,
  offset = 0,
}: StickyHeaderProps) {
  return (
    <div
      className={cn(
        "sticky bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40",
        className
      )}
      style={{ top: offset }}>
      {children}
    </div>
  );
}

/**
 * Centered Content
 * Centers content vertically and horizontally
 */

interface CenteredContentProps {
  children: ReactNode;
  className?: string;
  minHeight?: "screen" | "half" | "full";
}

export function CenteredContent({
  children,
  className,
  minHeight = "screen",
}: CenteredContentProps) {
  const heightClasses = {
    screen: "min-h-screen",
    half: "min-h-[50vh]",
    full: "h-full",
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        heightClasses[minHeight],
        className
      )}>
      {children}
    </div>
  );
}

/**
 * Auth Layout
 * Special layout for authentication pages
 */

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4 py-12">
      <div className="w-full max-w-md">
        {(title || description) && (
          <div className="text-center mb-8">
            {title && (
              <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            )}
            {description && (
              <p className="mt-2 text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default {
  MainLayout,
  Container,
  Section,
  PageHeader,
  TwoColumnLayout,
  CardGrid,
  StickyHeader,
  CenteredContent,
  AuthLayout,
};
