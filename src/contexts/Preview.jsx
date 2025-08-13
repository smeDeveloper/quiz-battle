import { createContext , useContext } from "react";

const PreviewContext = createContext();

const usePreviewContext = () => useContext(PreviewContext);

const PreviewQuestionsProvider = PreviewContext.Provider;

export { usePreviewContext , PreviewQuestionsProvider };