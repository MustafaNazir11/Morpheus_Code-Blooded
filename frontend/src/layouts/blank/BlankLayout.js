import { Outlet, useLocation } from "react-router-dom";

const BlankLayout = () => {
  const location = useLocation();
  return (
    <>
      <Outlet key={location.pathname} />
    </>
  );
};

export default BlankLayout;
