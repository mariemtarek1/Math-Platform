import { useContext } from "react";
import { StudentContext } from "./StudentContextValue";

export const useStudent = () => {
  const context = useContext(StudentContext);

  if (!context) {
    throw new Error("useStudent must be used within a StudentProvider");
  }

  return context;
};

export default useStudent;
