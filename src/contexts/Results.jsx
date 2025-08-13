import { createContext , useContext } from "react";

const ResultContext = createContext();

const useResultContext = () => useContext(ResultContext);

const ResultContextProvider = ResultContext.Provider;

export { ResultContextProvider , useResultContext };