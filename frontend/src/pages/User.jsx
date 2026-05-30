import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getUser, updateUser } from "../api/users.js";
import { getAllMatches } from "../api/matches.js";

import { useAuth } from "../contexts/AuthContext.jsx";
import { Link } from "react-router-dom";

import Spinner from "../components/Spinner.jsx";
import FormField from "../components/FormField.jsx";
import Button from "../components/Button.jsx";
import TrophyBadge from "../components/TrophyBadge.jsx";
import ProfileImage from "../components/ProfileImage.jsx";
import GameCard from "../components/GameCard.jsx";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MODULE_CUTOFF = Date.now() - THIRTY_DAYS_MS;

// The user profile page shows a user's avatar, bio, stats, trophies, and recent games
// If you're viewing your own profile, you also get an edit button
export default function User() {
    // id comes from the URL
    const { id } = useParams();
    const [profile, setProfile] = useState(null);

    // Holds the image file the user picks when uploading a new profile photo
    const [profileImageFile, setProfileImageFile] = useState(null);
    const [profileImagePreview, setProfileImagePreview] = useState(null);
    const { user, updateUserData } = useAuth();

    // editData holds what's currently typed in the edit form
    const [editData, setEditData] = useState({ email: "", aboutMe: "", password: "" });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const [error, setError] = useState(null);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const [games, setGames] = useState([]);
    const [gamesPage, setGamesPage] = useState(1);
    const [gamesTotalPages, setGamesTotalPages] = useState(1);

    const recentMonthGames = profile?.recentGames
        ? profile.recentGames.filter(match => match.endedAt && Date.parse(match.endedAt) >= MODULE_CUTOFF)
        : [];

    // Load the profile when the page opens, or if the id in the URL changes
    useEffect(() => {
        getUser(id)
            .then(data => {
                setProfile(data);
                if (user?.userId === data.userId) {
                    updateUserData({
                        coins: data.coins,
                        lastMonthlyCoinGrantAt: data.lastMonthlyCoinGrantAt
                    });
                }
            })
            .catch(() => setError("Failed to load profile. Please try again."))
            .finally(() => setLoading(false));
    }, [id, user?.userId, updateUserData]);

    useEffect(() => {
        getAllMatches({ userId: id, limit: 10, page: gamesPage })
            .then(data => {
                setGames(data.matchList);
                setGamesTotalPages(data.totalPages);
            })
            .catch(() => { });
    }, [id, gamesPage]);

    // recentMonthGames is derived above; no effect needed

    if (loading) return <Spinner />;
    if (error) return <p className="status status--error">{error}</p>;
    if (!profile) return <p className="status status--error">User not found.</p>;

    // Updates one field in the edit form without wiping the others
    function handleChange(field, value) {
        setEditData(prev => ({ ...prev, [field]: value }));
    }

    // When the user clicks "Edit profile", pre-fill the form with their current data
    function openEdit() {
        setEditData({ email: profile.email ?? "", aboutMe: profile.aboutMe ?? "", password: "" });
        setSaveError(null);
        setSaveSuccess(false);
        setFieldErrors({});
        setIsEditing(true);
    }

    // Saves the edited profile when the form is submitted
    async function handleSave(event) {
        event.preventDefault();
        setSaveError(null);
        setSaveSuccess(false);
        setFieldErrors({});

        try {
            // I use FormData instead of a plain object because it can carry both
            // text fields and the image file in the same request
            const formData = new FormData();
            if (editData.email) formData.append("email", editData.email);
            formData.append("aboutMe", editData.aboutMe);
            if (editData.password) formData.append("password", editData.password);
            if (profileImageFile) formData.append("profileImage", profileImageFile);

            await updateUser(id, formData);

            // Re-fetch the profile so the page shows the freshly saved data
            const updated = await getUser(id);
            setProfile(updated);

            // If the user just edited their own profile, also update the header avatar
            // Use in-memory preview for instant feedback, but rely on the server-stored image
            if (user?.userId === profile.userId) {
                updateUserData({ profileImage: profileImagePreview || updated.profileImage, coins: updated.coins });
            }

            setSaveSuccess(true);
            setIsEditing(false);
        } catch (err) {
            if (err.fieldErrors) setFieldErrors(err.fieldErrors);
            else setSaveError(err.message);
        }
    }

    function getPageNumbers(currentPage, totalPages) {
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);
        const pages = Array.from({ length: end - start + 1 }, (unused, i) => start + i);
        if (start > 1) pages.unshift('...');
        if (end < totalPages) pages.push('...');
        return pages;
    }


    // A win is when the winner ID matches this user's ID
    const wins = recentMonthGames.filter(match => match.winner?.toString() === profile._id?.toString()).length;
    const losses = recentMonthGames.length - wins;

    return (
        <>
            <section className="userPage">
                <div className="profile">
                    <div className="profile__edit">
                        <ProfileImage src={profile.profileImage} username={profile.username} size="medium" />
                        {/* Only show the edit button if you're looking at your own profile */}
                        {user?.userId === profile.userId && !isEditing && (
                            <Button className="profile__edit-button" onClick={openEdit}>Edit profile</Button>
                        )}
                    </div>
                    <div className="profile__info">
                        <h1>{profile.username}</h1>
                        {/* Email is private, so it's only shown it to the profile owner */}
                        {user?.userId === profile.userId && (
                            <p className="profile__email">{profile.email}</p>
                        )}
                        {/* If the user hasn't written a bio, show a placeholder */}
                        <p className={`profile__about${!profile.aboutMe ? " profile__about--empty" : ""}`}>
                            {profile.aboutMe || "No description yet."}
                        </p>
                    </div>
                </div>

                {/* Edit form only shows up when the owner clicks "Edit profile" */}
                {user?.userId === profile.userId && isEditing && (
                    <form onSubmit={handleSave} className="form userPage__form">
                        {saveError && <p className="status status--error">{saveError}</p>}
                        {saveSuccess && <p className="status status--success">Profile updated successfully</p>}

                        <FormField label="Email" error={fieldErrors.email}>
                            <input aria-label="Email" value={editData.email} placeholder="Your email" onChange={event => handleChange("email", event.target.value)} type="email" />
                        </FormField>

                        {/* maxLength stops the user from typing more than 160 characters */}
                        <FormField label="About me" error={fieldErrors.aboutMe}>
                            <input aria-label="About me" value={editData.aboutMe} placeholder="Write a description about yourself" maxLength={160} onChange={event => handleChange("aboutMe", event.target.value)} />
                        </FormField>

                        <FormField label="New password" error={fieldErrors.password}>
                            <input aria-label="New password" value={editData.password} placeholder="Want to change your password?" onChange={event => handleChange("password", event.target.value)} type="password" />
                        </FormField>

                        {/* accept="image/*" restricts the file picker to image files only */}
                        <FormField label="Profile image">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={event => {
                                    const file = event.target.files[0];
                                    setProfileImageFile(file);
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        const dataUrl = reader.result;
                                        setProfileImagePreview(dataUrl);
                                        // Do not save images to localStorage or filesystem per user request
                                    };
                                    reader.readAsDataURL(file);
                                }}
                            />
                            {profileImagePreview && <div className="profile__image-preview"><img src={profileImagePreview} alt="Preview" /></div>}
                        </FormField>

                        <div className="userPage__form-buttons">
                            <Button type="submit">Save</Button>
                            <Button type="button" onClick={() => setIsEditing(false)}>Cancel</Button>
                        </div>
                    </form>
                )}

                <div className="container container--stats">
                    <div className="stats">
                        <h2>Your stats</h2>
                        {/* Each time control has its own Elo rating */}
                        <ul className="stats__elo-list">
                            <li>Elo (10s): {profile.eloRating10s} <span className="stats__separator">|</span></li>
                            <li>Elo (30s): {profile.eloRating30s} <span className="stats__separator">|</span></li>
                            <li>Elo (90s): {profile.eloRating90s}</li>
                        </ul>

                        <div className="stats__cards">
                            <div className="stats__cards-item">Coins: <span className="stats__cards-number">{profile.coins ?? 0}</span></div>
                            <div className="stats__cards-item">Total games: <span className="stats__cards-number">{profile.totalGames}</span></div>
                            <div className="stats__cards-item">Wins last 30 days: <span className="stats__cards-number">{wins}</span></div>
                            <div className="stats__cards-item">Losses last 30 days: <span className="stats__cards-number">{losses}</span></div>
                        </div>
                    </div>

                    <div>
                        <h2>Trophies</h2>
                        <div className="trophies">
                            {profile.trophies?.length > 0
                                ? profile.trophies.map(trophy => (
                                    <TrophyBadge key={trophy._id} trophy={trophy} />
                                ))
                                : <p className="profile__about--empty">No trophies yet. Win a tournament to earn one!</p>
                            }
                        </div>
                    </div>
                </div>

                <div>
                    <div>
                        <h2>Recent games</h2>
                        <div className="lastGames">
                            {games.length > 0
                                ? games.map((match, i) => (
                                    <GameCard key={match.matchId} match={match} index={i} variant="recentGames" />
                                ))
                                : <p className="profile__about--empty">No games played yet. Head to the lobby to get started!</p>
                            }
                        </div>
                        {gamesTotalPages > 1 && (
                            <div className="pagination">
                                <Button type="button" onClick={() => setGamesPage(prev => Math.max(1, prev - 1))} disabled={gamesPage === 1}>Prev</Button>
                                {getPageNumbers(gamesPage, gamesTotalPages).map((pageNum, i) =>
                                    pageNum === '...'
                                        ? <span key={`ellipsis-${i}`}>...</span>
                                        : <Button
                                            key={pageNum}
                                            type="button"
                                            className={`btn--chip${gamesPage === pageNum ? " btn--chip--active" : ""}`}
                                            onClick={() => setGamesPage(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                )}
                                <Button type="button" onClick={() => setGamesPage(prev => Math.min(gamesTotalPages, prev + 1))} disabled={gamesPage === gamesTotalPages}>Next</Button>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}