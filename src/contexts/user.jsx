import { createContext , useContext } from "react";

const UserContext = createContext();

const useUserContext = () => useContext(UserContext);

const UserContextProvider = UserContext.Provider;

export {UserContextProvider , useUserContext };