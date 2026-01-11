// Adicione estes novos estados após a linha 71 (após const [resultsPage, setResultsPage] = useState(0);)
const [currentPage, setCurrentPage] = useState(1);
const [hasMoreResults, setHasMoreResults] = useState(true);
const [isLoadingMore, setIsLoadingMore] = useState(false);

// Substitua a função searchMovies (linhas 123-138) por esta versão:
const searchMovies = async (page: number = 1) => {
if (!searchQuery.trim()) return;
setIsLoading(true);
try {
const response = await fetch(
`/api/tmdb/search?query=${encodeURIComponent(searchQuery)}&page=${page}`
);
const data = await response.json();

    if (page === 1) {
      setMovies(data.results || []);
      setCurrentPage(1);
    } else {
      setMovies((prev) => [...prev, ...(data.results || [])]);
    }

    setHasMoreResults(data.page < data.total_pages);
    setResultsPage(0);

} catch (err) {
setError("Failed search");
} finally {
setIsLoading(false);
}
};

// Adicione esta nova função após searchMovies:
const loadMoreMovies = async () => {
if (isLoadingMore || !hasMoreResults) return;

setIsLoadingMore(true);
const nextPage = currentPage + 1;

try {
const response = await fetch(
`/api/tmdb/search?query=${encodeURIComponent(searchQuery)}&page=${nextPage}`
);
const data = await response.json();

    setMovies((prev) => [...prev, ...(data.results || [])]);
    setCurrentPage(nextPage);
    setHasMoreResults(data.page < data.total_pages);

} catch (err) {
console.error("Failed to load more:", err);
} finally {
setIsLoadingMore(false);
}
};
