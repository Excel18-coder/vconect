/**
 * Empty State Components
 * User-friendly empty state designs with clear calls-to-action
 */

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertCircle,
  FileText,
  Filter,
  Heart,
  Inbox,
  MessageCircle,
  Package,
  PlusCircle,
  RefreshCw,
  Search,
  ShoppingCart,
} from "lucide-react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

// Generic Empty State
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center text-center py-12 px-6">
        {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
        <CardTitle className="text-xl mb-2">{title}</CardTitle>
        <CardDescription className="max-w-md mb-6">
          {description}
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.icon}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// No Products Found
export function NoProductsFound({
  onClearFilters,
  onAddProduct,
}: {
  onClearFilters?: () => void;
  onAddProduct?: () => void;
}) {
  return (
    <EmptyState
      icon={<Package className="h-16 w-16" />}
      title="No products found"
      description="We couldn't find any products matching your criteria. Try adjusting your filters or search terms."
      action={
        onClearFilters
          ? {
              label: "Clear Filters",
              onClick: onClearFilters,
              icon: <Filter className="mr-2 h-4 w-4" />,
            }
          : undefined
      }
      secondaryAction={
        onAddProduct
          ? {
              label: "List a Product",
              onClick: onAddProduct,
            }
          : undefined
      }
    />
  );
}

// No Search Results
export function NoSearchResults({
  query,
  onClearSearch,
}: {
  query?: string;
  onClearSearch?: () => void;
}) {
  return (
    <EmptyState
      icon={<Search className="h-16 w-16" />}
      title="No results found"
      description={
        query
          ? `We couldn't find any results for "${query}". Try different keywords or browse our categories.`
          : "Try searching for products, categories, or locations."
      }
      action={
        onClearSearch
          ? {
              label: "Clear Search",
              onClick: onClearSearch,
            }
          : undefined
      }
    />
  );
}

// Empty Cart
export function EmptyCart({
  onStartShopping,
}: {
  onStartShopping?: () => void;
}) {
  return (
    <EmptyState
      icon={<ShoppingCart className="h-16 w-16" />}
      title="Your cart is empty"
      description="Looks like you haven't added any items to your cart yet. Start shopping to fill it up!"
      action={
        onStartShopping
          ? {
              label: "Start Shopping",
              onClick: onStartShopping,
              icon: <Package className="mr-2 h-4 w-4" />,
            }
          : undefined
      }
    />
  );
}

// Empty Wishlist
export function EmptyWishlist({
  onBrowseProducts,
}: {
  onBrowseProducts?: () => void;
}) {
  return (
    <EmptyState
      icon={<Heart className="h-16 w-16" />}
      title="Your wishlist is empty"
      description="Save items you're interested in to your wishlist. They'll be here waiting when you're ready!"
      action={
        onBrowseProducts
          ? {
              label: "Browse Products",
              onClick: onBrowseProducts,
            }
          : undefined
      }
    />
  );
}

// No Messages
export function NoMessages({
  onStartConversation,
}: {
  onStartConversation?: () => void;
}) {
  return (
    <EmptyState
      icon={<MessageCircle className="h-16 w-16" />}
      title="No messages yet"
      description="You don't have any messages. Start a conversation with a seller to get started."
      action={
        onStartConversation
          ? {
              label: "Browse Products",
              onClick: onStartConversation,
            }
          : undefined
      }
    />
  );
}

// No Listings (Seller View)
export function NoListings({
  onCreateListing,
}: {
  onCreateListing?: () => void;
}) {
  return (
    <EmptyState
      icon={<FileText className="h-16 w-16" />}
      title="You haven't listed any products yet"
      description="Create your first listing to start selling on our platform. It only takes a few minutes!"
      action={
        onCreateListing
          ? {
              label: "Create Listing",
              onClick: onCreateListing,
              icon: <PlusCircle className="mr-2 h-4 w-4" />,
            }
          : undefined
      }
    />
  );
}

// Error State
export function ErrorState({
  title = "Something went wrong",
  description = "We encountered an error while loading this content.",
  onRetry,
  onGoBack,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
}) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center text-center py-12 px-6">
        <div className="p-3 rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <CardTitle className="text-xl mb-2">{title}</CardTitle>
        <CardDescription className="max-w-md mb-6">
          {description}
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <Button onClick={onRetry} variant="destructive">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          {onGoBack && (
            <Button onClick={onGoBack} variant="outline">
              Go Back
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Inbox Empty
export function EmptyInbox() {
  return (
    <EmptyState
      icon={<Inbox className="h-16 w-16" />}
      title="All caught up!"
      description="You've read all your messages. Enjoy your day!"
    />
  );
}

// Coming Soon
export function ComingSoon({ feature }: { feature?: string }) {
  return (
    <Card className="border-2 border-dashed">
      <CardContent className="flex flex-col items-center justify-center text-center py-16 px-6">
        <div className="text-6xl mb-4">🚀</div>
        <CardTitle className="text-2xl mb-2">Coming Soon</CardTitle>
        <CardDescription className="max-w-md text-base">
          {feature
            ? `We're working hard to bring you ${feature}. Stay tuned!`
            : "We're working on something exciting. Stay tuned!"}
        </CardDescription>
      </CardContent>
    </Card>
  );
}

// Under Maintenance
export function UnderMaintenance({
  estimatedTime,
}: {
  estimatedTime?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">🔧</div>
          <CardTitle className="text-2xl">Under Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <CardDescription>
            We're currently performing some maintenance. Please check back soon.
            {estimatedTime && (
              <>
                <br />
                <br />
                <strong>Estimated time: {estimatedTime}</strong>
              </>
            )}
          </CardDescription>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={() => window.location.reload()} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// 404 Not Found
export function NotFoundState({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="text-6xl mb-4">404</div>
          <CardTitle className="text-2xl">Page Not Found</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <CardDescription>
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardContent>
        <CardFooter className="justify-center">
          <Button onClick={onGoHome || (() => (window.location.href = "/"))}>
            Go to Homepage
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
