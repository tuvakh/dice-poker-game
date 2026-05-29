import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";

import { getMatch, joinMatch } from "../api/matches.js";
import { getAllComments } from "../api/comments.js";
import { usePolling } from "../hooks/usePolling.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { useAppearance } from "../contexts/AppearanceContext.jsx";
import Spinner from "../components/Spinner.jsx";

import CommentList from "../components/CommentList";
import CommentForm from "../components/CommentForm";
import PlayerInfo from "../components/PlayerInfo";

// The individual game page shows players, game board, and comments sidebar
export default function Game (){
    const { id } = useParams();
    const { user } = useAuth();
    const { preferences } = useAppearance();
    const [match, setMatch] = useState(null);
    const [comments, setComments] = useState([]);
    const [error, setError] = useState(null);
    const hasJoined = useRef(false);

    // Fetches the latest match data from the backend
    async function fetchMatch() {
        try {
            const data = await getMatch(id);
            setMatch(data);
        } catch {
            setError("Failed to load game. Please try again.");
        }
    }

    // Fetches all comments for this match
    async function fetchComments() {
        if (!match?._id) return;
        try {
            const data = await getAllComments({ targetId: match._id, targetType: "match" });
            setComments(data.commentList);
        } catch {
            // keep existing comments on failed fetch
        }
    }

    // Poll the match every 15 seconds to check if someone joined
    usePolling(fetchMatch, 15000);

    // Refetch comments whenever the match updates
    useEffect(() => {
        fetchComments();
    }, [match]);

    // Auto-join the match once if the logged-in user isn't already a player
    // Anonymous users are spectators only — they never join as players
    useEffect(() => {
        if (!match || hasJoined.current || !user) return;

        const isPlayer = match.players.some(player => player._id === user._id);

        if (!isPlayer && match.status === "waiting") {
            hasJoined.current = true;
            joinMatch(match.matchId, user._id).then(fetchMatch);
        }
    }, [match]);

    if (error) return <p className="status status--error">{error}</p>;
    if (!match) return <Spinner />;

    return (
        <>
        {!user && (
            <div className="spectator-banner">
                <p>You&apos;re spectating. <Link to="/login">Log in</Link> or <Link to="/register">register</Link> to play.</p>
            </div>
        )}
        <div className="game">
        <div className="game__main">
            <div className="game__players">
                {match.players.map(player => (
                    <PlayerInfo key={player._id} user={player} showImage />
                ))}
                
                {Array.from({ length: match.anonymousCount ?? 0 }).map((_, i) => (
                    <PlayerInfo key={`anon-${i}`} user={{ username: "Anonymous" }} showImage />
                ))}
            </div>
            <div className="game__game-board" style={{ backgroundColor: preferences.boardColor }}>
                {/* Show overlay if not enough players have joined yet */}
                {match.status === "waiting" && (
                    <div className="game__waiting-overlay">
                        <p>Waiting for other players to join...</p>
                    </div>
                )}
            </div>
            {match.gameCategory && (
                <p className="game__variant">
                    Best of {match.gameCategory.numberOfRounds} · {match.gameCategory.gameRules} · {match.gameCategory.timeController}s per round
                </p>
            )}
        </div>
        <aside className="game__comments">
            <CommentList comments={comments} />
            {user
                ? <CommentForm targetId={match._id} targetType="match" onCommentAdded={fetchComments} />
                : <>
                    <p className="greeting--game">You need to log in to leave a comment</p>
                    <div className="greeting greeting--game">
                        <Link className="greeting__button" to="/login">Login</Link>
                        <Link className="greeting__button" to="/register">Register</Link>
                    </div>
                  </>
            }
        </aside>
        </div>
        </>
    );
}