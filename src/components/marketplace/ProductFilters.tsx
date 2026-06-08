import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid3X3, List, Search, X } from "lucide-react";

interface ProductFiltersProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedCategory: string;
    setSelectedCategory: (val: string) => void;
    selectedLocation: string;
    setSelectedLocation: (val: string) => void;
    priceRange: { min: string; max: string };
    setPriceRange: (val: any) => void;
    sortBy: string;
    setSortBy: (val: string) => void;
    viewMode: "grid" | "list";
    setViewMode: (val: "grid" | "list") => void;
    onSearch: () => void;
    onClear: () => void;
}

const ProductFilters = ({
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedLocation,
    setSelectedLocation,
    priceRange,
    setPriceRange,
    sortBy,
    setSortBy,
    viewMode,
    setViewMode,
    onSearch,
    onClear,
}: ProductFiltersProps) => {
    const categories = [
        { value: "house", label: "Real Estate" },
        { value: "transport", label: "Transportation" },
        { value: "market", label: "Marketplace" },
        { value: "entertainment", label: "Entertainment" },
    ];

    const locations = ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"];

    return (
        <Card className="border-0 shadow-elegant bg-white dark:bg-slate-950 rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
                    <Search className="h-5 w-5 text-blue-600" />
                    Refine Results
                </CardTitle>
            </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-5 sm:space-y-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                            placeholder="Search by keywords..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && onSearch()}
                            className="h-12 pl-11 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                    <Button onClick={onSearch} className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 dark:shadow-none">
                        Find Matches
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium">
                            <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                    {cat.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                        <SelectTrigger className="h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium">
                            <SelectValue placeholder="All Locations" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="all">All Locations</SelectItem>
                            {locations.map((loc) => (
                                <SelectItem key={loc.toLowerCase()} value={loc.toLowerCase()}>
                                    {loc}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                            placeholder="Min Price"
                            type="number"
                            value={priceRange.min}
                            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                            className="h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                        />
                        <Input
                            placeholder="Max Price"
                            type="number"
                            value={priceRange.max}
                            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                            className="h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-mono"
                        />
                    </div>

                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="h-12 rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 font-medium">
                            <SelectValue placeholder="Sort order" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                            <SelectItem value="newest">Newest Listed</SelectItem>
                            <SelectItem value="oldest">Oldest Listed</SelectItem>
                            <SelectItem value="price_low">Price: Low to High</SelectItem>
                            <SelectItem value="price_high">Price: High to Low</SelectItem>
                            <SelectItem value="popular">Most Relevant</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <Button variant="ghost" onClick={onClear} className="rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 font-semibold text-muted-foreground hover:text-slate-900 w-full sm:w-auto">
                        <X className="h-4 w-4 mr-2" />
                        Reset all filters
                    </Button>

                    <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl w-full sm:w-auto justify-between sm:justify-start">
                        <Button
                            variant={viewMode === "grid" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("grid")}
                            className={`rounded-xl h-9 px-4 ${viewMode === "grid" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-muted-foreground hover:bg-transparent"}`}
                        >
                            <Grid3X3 className="h-4 w-4 mr-2" />
                            Grid
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className={`rounded-xl h-9 px-4 ${viewMode === "list" ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-muted-foreground hover:bg-transparent"}`}
                        >
                            <List className="h-4 w-4 mr-2" />
                            List
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductFilters;
