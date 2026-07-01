import { useEffect } from "react";

const usePageTitle = (title) => {
  useEffect(() => {
    if (title) {
      document.title = `${title} | LinkSphereAI`;
    }
  }, [title]);
};

export default usePageTitle;
