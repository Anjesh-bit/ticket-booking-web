import { AppRouter } from "./router";
import styles from "./App.module.css";

const App = () => (
  <div className={styles.app}>
    <header className={styles.header}>
      <span className={styles.logo}>🎵 TicketBooking</span>
    </header>
    <main className={styles.main}>
      <AppRouter />
    </main>
  </div>
);

export default App;
