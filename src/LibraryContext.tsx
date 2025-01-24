import { createContext, ReactNode, useState } from "react";

type LibraryContextTypes = {
  carousel: boolean;
  setCarousel: React.Dispatch<React.SetStateAction<boolean>>;
};

export const LibraryContext = createContext<LibraryContextTypes | undefined>(
  undefined
);

export const LibraryContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [carousel, setCarousel] = useState(true);

  return (
    <LibraryContext.Provider value={{ carousel, setCarousel }}>
      {children}
    </LibraryContext.Provider>
  );
};

export default LibraryContext;
