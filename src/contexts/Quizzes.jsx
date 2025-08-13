import { createContext , useContext } from "react";

const QuizzesContext = createContext();

const useQuizzesContext = () => useContext(QuizzesContext);

const QuizzesContextProvider = QuizzesContext.Provider;

export { QuizzesContextProvider , useQuizzesContext };