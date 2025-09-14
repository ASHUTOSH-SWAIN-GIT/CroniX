import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();

  const navLinks = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/dashboard/jobs", label: "Jobs" },
    { path: "/dashboard/profile", label: "Profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="bg-black border-b border-neutral-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Cronix Text */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-xl font-bold text-white hover:text-neutral-300 transition-colors duration-200"
            >
              Cronix
            </Link>
          </div>

          {/* Navigation Links - Centered */}
          <nav className="flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(link.path)
                    ? "text-white"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Empty space for balance */}
          <div className="flex-shrink-0 w-16"></div>
        </div>
      </div>
    </header>
  );
};

export default Header;
