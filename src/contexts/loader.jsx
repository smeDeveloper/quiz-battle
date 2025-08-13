import { createContext , useContext } from "react";

const LoaderContext = createContext();

const useLoaderContext = () => useContext(LoaderContext);

const LoaderContextProvider = LoaderContext.Provider;

export { LoaderContextProvider , useLoaderContext };