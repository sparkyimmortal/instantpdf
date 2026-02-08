import { useState, useCallback, useEffect } from "react";

const FAVORITES_KEY = "instantpdf_favorites";

export function useFavoriteTools() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(FAVORITES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = useCallback((toolHref: string) => {
    setFavorites((prev) =>
      prev.includes(toolHref)
        ? prev.filter((h) => h !== toolHref)
        : [...prev, toolHref]
    );
  }, []);

  const isFavorite = useCallback(
    (toolHref: string) => favorites.includes(toolHref),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
