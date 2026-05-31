import { useState } from "react";
import { getAllComments, deleteComment } from "../../api/comments.js";
import { useFetch } from "../../hooks/useFetch.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import Spinner from "../../components/Spinner.jsx";

export default function AdminComments(){
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;
    const debouncedSearch = useDebouncedValue(search, 250);

    const { data, loading, error } = useFetch((signal) => getAllComments({ page, limit, search: debouncedSearch }, signal), [page, debouncedSearch]);

    if (error) return <p className="status status--error">{error}</p>;

    return (
        <div>
            <header>
                <h1>Comment Administration</h1>
                <div style={{ marginTop: 8 }}>
                    <input
                        aria-label="Search comments"
                        placeholder="Search comments"
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                    />
                </div>
            </header>

            {loading && !data && <Spinner />}

            <section style={{ marginTop: 16 }}>
                <table className="admin__users">
                    <thead>
                        <tr>
                            <th>Comment</th>
                            <th>Target</th>
                            <th>Author</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data?.commentList || []).map(comment => (
                            <tr key={comment.commentId}>
                                <td>{comment.comment}</td>
                                <td>{comment.targetType}</td>
                                <td>{comment.userId?.username || "Unknown"}</td>
                                <td>
                                    <button className="btn btn--danger" onClick={async () => {
                                        await deleteComment(comment.commentId);
                                        window.location.reload();
                                    }}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination" style={{ marginTop: 12 }}>
                    <button className="btn" disabled={!data || data.page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</button>
                    <span style={{ margin: '0 8px' }}>Page {data?.page || 1} of {data?.totalPages || 1}</span>
                    <button className="btn" disabled={!data || data.page === data.totalPages} onClick={() => setPage(p => Math.min(data.totalPages || 1, p + 1))}>Next</button>
                </div>
            </section>
        </div>
    );
}
