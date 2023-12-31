import { useEffect, useRef, useState, useMemo } from "react";
import dayjs from "dayjs";
import spotifyClient from "./spotifyClient";
import TrackList from "./TrackList";
import { track } from "./types";
import { useTransition, animated, useSpring } from "@react-spring/web";
import "./LikedTracks.css";
import Spinner from "./Spinner";

export default function LikedTracks() {
  const [likedTracksByYear, setLikedTracksByYear] = useState<
    Record<string, track[]>
  >({});

  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [finishedLoading, setFinishedLoading] = useState(false);
  const savedTracks = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const fetchLikedSongs = async (page: number = 1) => {
      try {
        const { data } = await spotifyClient.getLikedTracks(page);

        let incomingTracks: Record<string, track[]> = {};

        // group tracks by year
        data.items.forEach((item: any) => {
          const track = item.track;
          if (savedTracks.current[track.id] !== true) {
            let yearAdded = dayjs(item.added_at).format("YYYY");
            if (yearAdded in incomingTracks) {
              incomingTracks[yearAdded].push(track);
            } else {
              incomingTracks[yearAdded] = [track];
            }
            savedTracks.current[track.id] = true;
          }
        });

        // merge new tracks  with the current ones
        setLikedTracksByYear((oldLikedTracks) => {
          let newObject = { ...oldLikedTracks };
          for (let year in incomingTracks) {
            if (year in newObject) {
              newObject[year] = [...newObject[year], ...incomingTracks[year]];
            } else {
              newObject[year] = incomingTracks[year];
            }
          }
          return newObject;
        });

        if (data.next) {
          await fetchLikedSongs(++page);
        } else {
          setFinishedLoading(true);
        }
      } catch (err) {
        console.log("error fetching..");
      }
    };

    fetchLikedSongs();

    return () => {};
  }, []);

  const years = useMemo(
    () => Object.keys(likedTracksByYear).sort((a, b) => (a > b ? -1 : 1)),
    [likedTracksByYear]
  );

  const bodyTransitions = useTransition(selectedYear, {
    from: { x: -50, opacity: 0 },
    enter: { x: 0, opacity: 1, left: 0 },
    leave: { x: -50, opacity: 0 },
    exitBeforeEnter: true,
  });

  const headingTransitions = useTransition(selectedYear, {
    from: {
      y: "-100%",
    },
    enter: {
      y: "0",
    },
    leave: {
      y: "-100%",
    },
    exitBeforeEnter: true,
  });

  const getLikedTracksInYear = (year: string | number) => {
    return year in likedTracksByYear ? likedTracksByYear[year] : [];
  };

  return (
    <div className="liked-tracks-container">
      <header className="liked-tracks-header">
        {headingTransitions((styles, selectedYear) => {
          return (
            <h2 className="page-heading title">
              {!selectedYear ? (
                <div>
                  <div className="line">
                    <animated.div style={styles}>Select a year</animated.div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="line">
                    <animated.div
                      style={{
                        ...styles,
                        opacity: 0.68,
                      }}
                    >
                      Liked songs in
                    </animated.div>
                  </div>
                  <div className="line">
                    <animated.div style={styles}>{selectedYear}</animated.div>
                  </div>
                </div>
              )}
            </h2>
          );
        })}
      </header>
      <div className="liked-tracks-body">
        {bodyTransitions((style, selectedYear) => {
          return selectedYear ? (
            <animated.div style={style}>
              <div className="back-btn-wrapper">
                <AnimatedBackButton onClick={() => setSelectedYear(null)} />
              </div>
              <div style={{ maxWidth: "30rem" }}>
                <TrackList list={getLikedTracksInYear(selectedYear)} />
              </div>
            </animated.div>
          ) : (
            <div style={{ display: "flex", gap: 20 }}>
              <animated.div style={style}>
                <div className="year-list">
                  {years.map((year) => {
                    return (
                      <AnimatedYearCard
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        year={year}
                      />
                    );
                  })}
                </div>
              </animated.div>
              {!finishedLoading ? (
                <div style={{ alignSelf: "center" }}>
                  <Spinner />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const AnimatedYearCard = ({
  year,
  onClick,
}: {
  year: number | string;
  onClick: () => void;
}) => {
  const styles = useSpring({
    from: { x: 20, opacity: 0 },
    to: {
      x: 0,
      opacity: 1,
    },
  });

  return (
    <animated.div
      style={styles}
      className={["year-card"].join(" ")}
      key={year}
      onClick={onClick}
    >
      <div>{year}</div>
    </animated.div>
  );
};

const AnimatedBackButton = ({ onClick }: { onClick: () => void }) => {
  const styles = useSpring({
    from: {
      x: -4,
    },
    to: {
      x: 2,
    },
    loop: true,
  });
  return (
    <button className="back-btn" onClick={onClick}>
      <animated.div style={styles}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
      </animated.div>
      back
    </button>
  );
};
