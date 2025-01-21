import "./UserTitle.css";
import { UserSummary } from "@retroachievements/api";

const UserTitle = ({ summary }: { summary: UserSummary }) => {
  const d = new Date();

  return (
    <div className="user-title">
      <img
        src={`https://retroachievements.org/${summary.userPic}`}
        alt={summary.user}
      />
      <div>
        <span>
          {d.getHours() >= 6 && d.getHours() < 12
            ? "Good morning,"
            : d.getHours() >= 12 && d.getHours() < 18
            ? "Good afternoon,"
            : "Good evening,"}
        </span>
        <h1>{summary.user}</h1>
        <p>{summary.motto}</p>
      </div>
    </div>
  );
};

export default UserTitle;
