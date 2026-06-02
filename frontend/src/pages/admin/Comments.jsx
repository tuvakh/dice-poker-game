import { useState } from "react";
import { getAllComments, deleteComment } from "../../api/comments.js";
import { useFetch } from "../../hooks/useFetch.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import Spinner from "../../components/Spinner.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";
import Button from "../../components/Button.jsx";

// Admin page for reviewing and deleting user comments across all matches and tournaments
export default function AdminComments() {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    // Stores the commentId awaiting deletion; keeps the dialog open without losing the target while async work runs
    const [confirmDelete, setConfirmDelete] = useState(null);
    const limit = 10;
    // 250 ms debounce so the API is not called on every keystroke
    const debouncedSearch = useDebouncedValue(search, 250);

    // Abort signal cancels any in-flight request when page or search term changes
    const { data, loading, error } = useFetch((signal) => getAllComments({ page, limit, search: debouncedSearch }, signal), [page, debouncedSearch]);

    if (error) return <p className="status status--error">{error}</p>;

    return (
        <div>
            <header>
                <h1>Comment Administration</h1>
                <input
                    style={{ marginBottom: 20, padding: 5 }}
                    aria-label="Search comments"
                    placeholder="Search comments"
                    value={search}
                    onChange={event => { setSearch(event.target.value); setPage(1); }}
                />
            </header>

            {loading && !data && <Spinner />}

            <table className="admin__users">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Comment</th>
                        <th>Target</th>
                        <th>Author</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Spread into a new array before sorting so the original API response is not mutated */}
                    {[...(data?.commentList || [])]
                        .sort((commentA, commentB) => new Date(commentB.createdAt) - new Date(commentA.createdAt))
                        .map(comment => (
                            <tr key={comment.commentId}>
                                <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                                    {comment.createdAt
                                        ? new Date(comment.createdAt).toLocaleString("en-GB", {
                                            day: "2-digit", month: "short", year: "numeric",
                                            hour: "2-digit", minute: "2-digit", second: "2-digit"
                                        })
                                        : "—"}
                                </td>
                                <td>{comment.comment}</td>
                                <td>{comment.targetType}</td>
                                <td>{comment.userId?.username || "Unknown"}</td>
                                <td>
                                    <Button onClick={() => setConfirmDelete(comment.commentId)} variant="danger">Delete</Button>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>

            <div className="pagination" style={{ marginTop: 12 }}>
                <Button disabled={!data || data.page === 1} onClick={() => setPage(prev => Math.max(1, prev - 1))}>Prev</Button>
                <span style={{ margin: '0 8px' }}>Page {data?.page || 1} of {data?.totalPages || 1}</span>
                <Button disabled={!data || data.page === data.totalPages} onClick={() => setPage(prev => Math.min(data.totalPages || 1, prev + 1))}>Next</Button>
            </div>

            {confirmDelete && (
                <ConfirmDialog
                    message="Delete this comment? This cannot be undone."
                    confirmLabel="Yes, delete"
                    onConfirm={async () => {
                        setConfirmDelete(null);
                        await deleteComment(confirmDelete);
                        // Full reload so the table re-fetches without needing to thread the deletion through local state
                        window.location.reload();
                    }}
                    onCancel={() => setConfirmDelete(null)}
                />
            )}
        </div>
    );
}
