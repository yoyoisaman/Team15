import { BookmarksProvider } from "./context/BookmarksContext";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import Breadcrumb from "./components/Breadcrumb";
import MainContent from "./components/MainContent";
import "./styles.css";

function Layout({ children }) {
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <Breadcrumb />
        {children}
      </div>
    </div>
  );
}

function App() {
  return (
    <BookmarksProvider>
      <Layout>
        <MainContent />
      </Layout>
    </BookmarksProvider>
  );
}

export default App;
