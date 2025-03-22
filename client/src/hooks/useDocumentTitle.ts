import { useEffect } from 'react';

/**
 * A custom hook to update the document title
 * @param title The title to set for the current page
 * @param includeAppName Whether to include the app name in the title (default: true)
 */
const useDocumentTitle = (title: string, includeAppName: boolean = true) => {
  useEffect(() => {
    // Set the document title with or without the app name
    const appName = 'GeoPrep';
    document.title = includeAppName ? `${title} | ${appName}` : title;
    
    // Restore the original title when the component unmounts
    return () => {
      document.title = appName;
    };
  }, [title, includeAppName]);
};

export default useDocumentTitle; 