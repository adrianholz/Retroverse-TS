import type { UserAwards, UserSummary } from "@retroachievements/api";
import "./UserAwards.css";
import { BarLoader } from "react-spinners";

const UserAwards = ({
  summary,
  awards,
  loading,
}: {
  summary: UserSummary;
  awards: UserAwards | null;
  loading: boolean;
}) => {
  return (
    <div className="awards">
      {loading ? (
        <BarLoader
          color="#ffffff"
          loading={true}
          aria-label="Loading Spinner"
          data-testid="loader"
        />
      ) : (
        <>
          <div className="awards-section">
            <div className="award">
              <h3>First Joined</h3>
              <span>
                {summary.memberSince
                  .slice(0, 7)
                  .split("-")
                  .reverse()
                  .toString()
                  .replace(",", "/")}
              </span>
            </div>
            <div className="award">
              <h3>Total Points</h3>
              <span>{summary.totalPoints}</span>
            </div>
            <div className="award">
              <h3>Retrorank</h3>
              <span>{summary.rank ? summary.rank : "No rank"}</span>
            </div>
          </div>
          <span></span>
          <div className="awards-section">
            <div className="award">
              <h3>Total Awards</h3>
              <span>{awards ? awards.totalAwardsCount : "0"}</span>
            </div>
            <div className="award">
              <h3>Beaten Games</h3>
              <span>{awards ? awards.beatenHardcoreAwardsCount : "0"}</span>
            </div>
            <div className="award">
              <h3>Mastered Games</h3>
              <span>{awards ? awards.masteryAwardsCount : 0}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserAwards;
