import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Welcome() {
  const { user } = useAuth();
  const firstName = user?.name.split(" ")[0] ?? "there";

  return (
    <main className="welcome">
      <p className="eyebrow">Retain</p>
      <h1>Welcome, {firstName}.</h1>
      <p className="welcome-line">Do you want to keep more this month?</p>
      <section className="welcome-card">
        <p>Your spending, your budget, and what is left all live in one place.</p>
        <div className="welcome-actions">
          <Link className="welcome-go" to="/">Open my dashboard</Link>
          <Link className="welcome-quiet" to="/expenses">Record an expense</Link>
          <Link className="welcome-quiet" to="/budget">Set my budget</Link>
        </div>
      </section>
    </main>
  );
}
