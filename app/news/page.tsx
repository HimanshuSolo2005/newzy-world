"use client";

import { ProtectedComponent } from "./protected-component";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { 
  BookmarkIcon, 
  ClockIcon, 
  ChevronRightIcon, 
  TagIcon, 
  EyeIcon, 
  AlertCircleIcon, 
  SearchIcon, 
  NewspaperIcon, 
  SparklesIcon, 
  ScanSearchIcon, 
  Sparkles, 
  Share2Icon,
  CopyIcon,
  CheckIcon,
  LinkIcon,
  DownloadIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

// New interface for summary state
interface SummaryState {
  articleIndex: number | null;
  loading: boolean;
  content: string | null;
  error: string | null;
}

const categories = [
  "general",
  "business",
  "technology",
  "entertainment",
  "sports",
  "science",
  "health",
];

// Badge color mapping
const categoryColors: Record<string, { bg: string, text: string, darkBg: string, darkText: string }> = {
  general: { bg: "bg-gray-200", text: "text-gray-800", darkBg: "dark:bg-gray-800", darkText: "dark:text-gray-200" },
  business: { bg: "bg-blue-100", text: "text-blue-800", darkBg: "dark:bg-blue-900", darkText: "dark:text-blue-300" },
  technology: { bg: "bg-purple-100", text: "text-purple-800", darkBg: "dark:bg-purple-900", darkText: "dark:text-purple-300" },
  entertainment: { bg: "bg-pink-100", text: "text-pink-800", darkBg: "dark:bg-pink-900", darkText: "dark:text-pink-300" },
  sports: { bg: "bg-green-100", text: "text-green-800", darkBg: "dark:bg-green-900", darkText: "dark:text-green-300" },
  science: { bg: "bg-indigo-100", text: "text-indigo-800", darkBg: "dark:bg-indigo-900", darkText: "dark:text-indigo-300" },
  health: { bg: "bg-red-100", text: "text-red-800", darkBg: "dark:bg-red-900", darkText: "dark:text-red-300" },
};

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [activeCategory, setActiveCategory] = useState("general");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();
  
  // Summary state
  const [summaryState, setSummaryState] = useState<SummaryState>({
    articleIndex: null,
    loading: false,
    content: null,
    error: null
  });
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  // New state for clipboard actions
  const [copied, setCopied] = useState(false);
  const summaryRef = useRef<HTMLDivElement>(null);

  // New state for bookmarked articles 
  const [bookmarkedArticles, setBookmarkedArticles] = useState<string[]>([]);
  // New state for bookmark loading
  const [bookmarkLoading, setBookmarkLoading] = useState<number | null>(null);

  // Cache storage for news articles
  const newsCache = useRef<{
    [key: string]: {
      data: any[];
      timestamp: number;
    };
  }>({});
  
  // Cache duration in milliseconds (5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    const fetchNews = async () => {
      try {
        // Check cache first
        const cacheKey = activeCategory.toLowerCase();
        const cachedData = newsCache.current[cacheKey];
        
        if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
          setArticles(cachedData.data);
          setFilteredArticles(cachedData.data);
          setIsLoading(false);
          return;
        }

        if (!process.env.NEXT_PUBLIC_NEWS_API_KEY) {
          throw new Error('News API key is not configured');
        }
        
        const response = await fetch(
          `https://gnews.io/api/v4/top-headlines?category=${activeCategory.toLowerCase()}&lang=en&country=us&apikey=${process.env.NEXT_PUBLIC_NEWS_API_KEY}`
        );

        if (!response.ok) {
          const errorMessage = response.status === 429 
            ? 'Daily API request limit reached. Please try again tomorrow.' 
            : `Failed to fetch news: ${response.status}`;
          throw new Error(errorMessage);
        }

        const data = await response.json();
        
        if (!data.articles) {
          throw new Error('No articles found in the response');
        }
        
        const formattedArticles = data.articles.map((article: any) => ({
          ...article,
          urlToImage: article.image,
          publishedAt: article.publishedAt,
          source: { name: article.source.name }
        }));

        // Update cache
        newsCache.current[cacheKey] = {
          data: formattedArticles,
          timestamp: Date.now()
        };
        
        setArticles(formattedArticles);
        setFilteredArticles(formattedArticles);
      } catch (error) {
        console.error("Error fetching news:", error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [activeCategory]);

  // Filter articles when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredArticles(articles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = articles.filter(article => 
        article.title.toLowerCase().includes(query) || 
        (article.description && article.description.toLowerCase().includes(query))
      );
      setFilteredArticles(filtered);
    }
  }, [searchQuery, articles]);

  // Add this after other useEffect hooks
  useEffect(() => {
    // Only fetch bookmarks if user is logged in
    if (session?.user) {
      const fetchBookmarks = async () => {
        try {
          const response = await fetch('/api/bookmarks');
          if (!response.ok) {
            throw new Error('Failed to fetch bookmarks');
          }
          
          const bookmarks = await response.json();
          // Store the article IDs of bookmarked articles
          setBookmarkedArticles(bookmarks.map((bookmark: any) => bookmark.articleId));
        } catch (error) {
          console.error('Error fetching bookmarks:', error);
        }
      };
      
      fetchBookmarks();
    }
  }, [session]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };
  
  // Function to generate AI summary
  const generateSummary = async (article: NewsArticle, index: number) => {
    setSummaryState({
      articleIndex: index,
      loading: true,
      content: null,
      error: null
    });
    
    setDialogOpen(true);
    
    try {
      const prompt = `
        Generate a concise and informative summary of this news article.
        Title: ${article.title}
        Content: ${article.description || "No description available"}
        Source: ${article.source.name}
        
        Format the summary with these sections:
        1. Key Points (3-4 bullet points)
        2. Background Context
        3. Why It Matters
        
        Keep it objective, factual, and around 250 words total.
      `;
      
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt,
          articleIndex: index
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }
      
      const data = await response.json();
      
      setSummaryState({
        articleIndex: index,
        loading: false,
        content: data.summary,
        error: null
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryState({
        articleIndex: index,
        loading: false,
        content: null,
        error: 'Failed to generate summary. Please try again.'
      });
    }
  };

  // Loading skeletons for articles
  const ArticleSkeleton = () => (
    <Card className="border border-border overflow-hidden transition-all">
      <div className="h-48 bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-6 w-full mb-1" />
        <Skeleton className="h-6 w-4/5" />
      </CardHeader>
      <CardContent className="pt-2">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex justify-between">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
  
  // Loading skeleton for summary
  const SummarySkeleton = () => (
    <div className="space-y-4 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      <div className="space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  // Format the summary content with enhanced Markdown styling
  const formatSummaryContent = (content: string) => {
    if (!content) return null;
    
    // Replace Markdown headers and elements with styled components
    const formattedContent = content
      .split('\n')
      .map((line, i) => {
        // Main title
        if (line.startsWith('# ')) {
          return (
            <h2 key={i} className="text-2xl font-bold mt-4 mb-4 text-primary">
              {line.substring(2)}
            </h2>
          );
        } 
        // Section titles
        else if (line.startsWith('## ')) {
          return (
            <div key={i} className="flex items-center mt-6 mb-3">
              <div className="w-1.5 h-6 bg-primary rounded-full mr-2"></div>
              <h3 className="text-xl font-semibold text-foreground">
                {line.substring(3)}
              </h3>
            </div>
          );
        } 
        // Subheadings
        else if (line.startsWith('### ')) {
          return (
            <h4 key={i} className="text-lg font-medium mt-3 mb-2 text-foreground/90">
              {line.substring(4)}
            </h4>
          );
        } 
        // Bullet points
        else if (line.startsWith('- ')) {
          return (
            <div key={i} className="flex items-start my-1">
              <div className="w-2 h-2 rounded-full bg-primary mt-1.5 mr-2 flex-shrink-0"></div>
              <p>{line.substring(2)}</p>
            </div>
          );
        } else if (line.trim() === '') {
          return <div key={i} className="h-2"></div>;
        } else {
          return <p key={i} className="my-2">{line}</p>;
        }
      });
      
    return <div className="space-y-1">{formattedContent}</div>;
  };

  // Update the toggleBookmark function to remove debug console logs
  const toggleBookmark = async (article: NewsArticle, index: number) => {
    if (!session?.user) {
      toast.error('Please sign in to bookmark articles');
      return;
    }
    
    setBookmarkLoading(index);
    
    // Create a unique article ID
    const articleId = Buffer.from(article.url).toString('base64');
    
    try {
      // Handle different ways the ID might be stored in the session
      const userId = session.user.id || 
                    (session.user as any)._id || 
                    (session.user as any).sub ||
                    session.user.email; // Fallback to using email as ID if no ID is found
      
      if (!userId) {
        throw new Error('User ID not found in session');
      }
      
      if (bookmarkedArticles.includes(articleId)) {
        // Remove bookmark
        const response = await fetch(`/api/bookmarks?articleId=${articleId}`, {
          method: 'DELETE',
          headers: {
            'X-User-ID': userId // Add user ID as a header as a backup
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to remove bookmark');
        }
        
        setBookmarkedArticles(prev => prev.filter(id => id !== articleId));
        toast.success('Article removed from bookmarks');
      } else {
        // Add bookmark
        const response = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-ID': userId // Add user ID as a header as a backup
          },
          body: JSON.stringify({
            article,
            category: activeCategory,
            userId: userId // Explicitly include userId in the request body
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to bookmark article');
        }
        
        setBookmarkedArticles(prev => [...prev, articleId]);
        toast.success('Article bookmarked successfully');
      }
    } catch (error) {
      toast.error('Failed to update bookmark: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setBookmarkLoading(null);
    }
  };

  return (
    <ProtectedComponent>
      <motion.div 
        className="container mx-auto py-8 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={fadeIn}
      >
        <div className="mb-12 text-center">
          <motion.h1 
            className="text-4xl font-semibold mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Latest News and Insights
          </motion.h1>
          <div className="flex flex-wrap justify-center mb-4 space-x-2">
            {!isLoading && !error && (
              <>
                <Badge className="bg-primary text-white text-sm px-3 py-1 mb-2 pointer-events-none">
                  <EyeIcon className="w-4 h-4 mr-1" />
                  {filteredArticles.length} Articles
                </Badge>
                <Badge className={`${categoryColors[activeCategory].bg} ${categoryColors[activeCategory].text} ${categoryColors[activeCategory].darkBg} ${categoryColors[activeCategory].darkText} text-sm px-3 py-1 mb-2 pointer-events-none`}>
                  <TagIcon className="w-4 h-4 mr-1" />
                  {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}
                </Badge>
              </>
            )}
          </div>
          <p className="text-muted-foreground max-w-3xl mx-auto mb-8">
            Stay updated with the latest stories and developments across various industries and topics.
          </p>

          <motion.div 
            className="max-w-md mx-auto mb-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full rounded-full border-primary/20 focus:border-primary"
              />
            </div>
          </motion.div>
        </div>

        {/* Modern categories section */}
        <motion.div 
          className="mb-10 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 shadow-sm max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-lg font-medium mb-4 text-center cursor-default underline">Browse Categories</h2>
          <div className="flex justify-center overflow-x-auto py-2 hide-scrollbar">
            <div className="flex space-x-2 pb-2">
          {categories.map((category) => (
                <motion.button
              key={category}
              onClick={() => setActiveCategory(category)}
                  className={`
                    px-5 py-2.5 rounded-full text-sm font-medium transition-all
                    ${activeCategory === category 
                      ? `${categoryColors[category].bg} ${categoryColors[category].text} ${categoryColors[category].darkBg} ${categoryColors[category].darkText} shadow-sm transform scale-120`
                      : 'bg-white dark:bg-gray-800 hover:bg-gray-70 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700'
                    }
                  `}
                  disabled={isLoading}
                  whileHover={{ scale: 1.12 }}
                  whileTap={{ scale: 0.5 }}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div 
            className="text-center p-8 mb-8 bg-red-50 dark:bg-red-900/20 rounded-lg max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <AlertCircleIcon className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-red-800 dark:text-red-300 mb-2">Unable to load news</h3>
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <Button 
              onClick={() => {
                setIsLoading(true);
                setError(null);
                // Retry fetching by resetting the active category
                setActiveCategory(activeCategory);
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Try Again
            </Button>
          </motion.div>
        )}

        {/* AI Summary Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <SparklesIcon className="h-5 w-5 text-primary mr-2" />
                AI-Generated Summary
              </DialogTitle>
              <DialogDescription>
                A concise summary of the article generated by GROQ AI.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {summaryState.loading && <SummarySkeleton />}
              
              {summaryState.error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md text-center">
                  <AlertCircleIcon className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 dark:text-red-400">{summaryState.error}</p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Retry generating summary
                      if (summaryState.articleIndex !== null) {
                        generateSummary(filteredArticles[summaryState.articleIndex], summaryState.articleIndex);
                      }
                    }}
                    className="mt-3"
                  >
                    Try Again
                  </Button>
                </div>
              )}
              
              {summaryState.content && !summaryState.loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="prose dark:prose-invert max-w-none"
                >
                  {formatSummaryContent(summaryState.content)}
                </motion.div>
              )}
            </div>
            
            <DialogFooter className="flex items-center justify-between">
              {/* <p className="text-xs text-muted-foreground italic">
                AI summaries may not be 100% accurate. Verify information from the original source.
              </p> */}
              <DialogClose asChild>
                <Button variant="outline">Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {!error && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {isLoading ? (
              // Show skeletons while loading
              Array.from({ length: 6 }).map((_, index) => (
                <motion.div key={index} variants={fadeIn}>
                  <ArticleSkeleton />
                </motion.div>
              ))
            ) : filteredArticles.length === 0 ? (
              // Show empty state when no articles match search
              <motion.div 
                className="col-span-full text-center p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <SearchIcon className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">No articles found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Try adjusting your search or select a different category
                </p>
                {searchQuery && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchQuery("")}
                  >
                    Clear Search
                  </Button>
                )}
              </motion.div>
            ) : (
              // Show articles
              filteredArticles.map((article, index) => (
                <motion.div 
                  key={index}
                  variants={fadeIn}
                >
                  <Card className="border border-border overflow-hidden transition-all hover:shadow-md group">
                    {article.urlToImage ? (
                      <div className="h-48 overflow-hidden relative">
                <img
                  src={article.urlToImage}
                  alt={article.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className={`${categoryColors[activeCategory].bg} ${categoryColors[activeCategory].text} ${categoryColors[activeCategory].darkBg} ${categoryColors[activeCategory].darkText} pointer-events-none`}>
                            {activeCategory}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-gray-100 dark:bg-gray-800 relative">
                        <NewspaperIcon className="h-12 w-12 text-gray-400" />
                        <div className="absolute top-2 right-2">
                          <Badge className={`${categoryColors[activeCategory].bg} ${categoryColors[activeCategory].text} ${categoryColors[activeCategory].darkBg} ${categoryColors[activeCategory].darkText} pointer-events-none`}>
                            {activeCategory}
                          </Badge>
                        </div>
                      </div>
                    )}
                    <CardHeader className="pb-2">
                      <div className="flex items-center text-sm text-muted-foreground mb-2 flex-wrap gap-2">
                        <Badge variant="outline" className="flex items-center bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 pointer-events-none">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {formatDate(article.publishedAt)}
                        </Badge>
                        {article.source.name && (
                          <Badge className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300 pointer-events-none">
                            {article.source.name}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl leading-tight font-semibold line-clamp-2">{article.title}</CardTitle>
            </CardHeader>
                    <CardContent className="pt-2">
                      <p className="text-muted-foreground mb-4 line-clamp-3">{article.description || "No description available"}</p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex space-x-2">
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                            className="inline-flex items-center text-primary font-medium hover:underline group"
                >
                  Read more
                            <ChevronRightIcon className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </a>
                        </div>
                        <div className="flex space-x-2">
                          {/* AI Summary Button */}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => generateSummary(article, index)}
                            disabled={summaryState.loading && summaryState.articleIndex === index}
                            className="text-indigo-600 hover:text-indigo-700 border-indigo-200 hover:border-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300"
                          >
                            {summaryState.loading && summaryState.articleIndex === index ? (
                              <>
                                <span className="animate-pulse">Summarizing...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-1" />
                                <span>AI Summary</span>
                              </>
                            )}
                          </Button>
                          
                {session && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={`transition-colors ${
                                bookmarkedArticles.includes(Buffer.from(article.url).toString('base64'))
                                  ? 'text-primary bg-primary/10 hover:bg-primary hover:text-white'
                                  : 'text-muted-foreground hover:text-white hover:bg-primary'
                              }`}
                              onClick={() => toggleBookmark(article, index)}
                              disabled={bookmarkLoading === index}
                            >
                              {bookmarkLoading === index ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                              ) : (
                    <BookmarkIcon className="h-4 w-4" />
                              )}
                  </Button>
                )}
                        </div>
              </div>
            </CardContent>
          </Card>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </motion.div>
    </ProtectedComponent>
  );
}