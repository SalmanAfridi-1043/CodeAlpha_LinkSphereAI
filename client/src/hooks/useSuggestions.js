import { useState, useEffect, useRef } from "react";
import api from "../api/axios";

let globalSuggestions = [];
let globalLoading = true;
const globalListeners = new Set();
let fetchPromise = null;

const notifyListeners = () => {
  globalListeners.forEach((listener) =>
    listener({
      suggestions: [...globalSuggestions],
      loading: globalLoading,
    })
  );
};

export const useSuggestions = () => {
  const [state, setState] = useState({
    suggestions: globalSuggestions,
    loading: globalLoading,
  });

  const seedRef = useRef(1);

  useEffect(() => {
    const listener = (newState) => {
      setState(newState);
    };
    globalListeners.add(listener);

    // Initial load if not already started
    if (!fetchPromise) {
      globalLoading = true;
      fetchPromise = api
        .get("/users/suggestions")
        .then(({ data }) => {
          if (data.success) {
            globalSuggestions = data.users;
          }
          globalLoading = false;
          notifyListeners();
        })
        .catch((err) => {
          console.error("Failed to load suggested users:", err);
          globalLoading = false;
          notifyListeners();
        });
    }

    // Set initial state matching current global values
    setState({ suggestions: [...globalSuggestions], loading: globalLoading });

    return () => {
      globalListeners.delete(listener);
    };
  }, []);

  const refresh = async () => {
    try {
      const currentSeed = seedRef.current;
      seedRef.current = currentSeed + 1;
      const { data } = await api.get(`/users/suggestions/refresh?seed=${currentSeed}`);
      if (data.success) {
        const existingIds = new Set(globalSuggestions.map((u) => u._id));
        const newUsers = data.users.filter((u) => !existingIds.has(u._id));
        globalSuggestions = [...globalSuggestions, ...newUsers];
        notifyListeners();
      }
    } catch (err) {
      console.error("Failed to load more suggested users:", err);
    }
  };

  const setSuggestions = (newSuggestions) => {
    if (typeof newSuggestions === "function") {
      globalSuggestions = newSuggestions(globalSuggestions);
    } else {
      globalSuggestions = newSuggestions;
    }
    notifyListeners();
  };

  return {
    suggestions: state.suggestions,
    loading: state.loading,
    setSuggestions,
    refresh,
  };
};

export default useSuggestions;
