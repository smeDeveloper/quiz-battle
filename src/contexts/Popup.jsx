import { createContext , useContext } from "react";

const PopUpContext = createContext();

const usePopUpContext = () => useContext(PopUpContext);

const PopUpContextProvider = PopUpContext.Provider;

export { PopUpContextProvider , usePopUpContext };