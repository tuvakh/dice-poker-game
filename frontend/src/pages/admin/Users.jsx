import { useState } from "react";
import { getUsers, banUser, unbanUser, changeRole } from "../../api/adminUsers.js";
import { useFetch } from "../../hooks/useFetch.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import Spinner from "../../components/Spinner.jsx";
import ConfirmDialog from "../../components/ConfirmDialog.jsx";

export default function AdminUsers(){
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm }
    const limit = 10;
    const debouncedSearch = useDebouncedValue(search, 250);

    const { data, loading, error } = useFetch((signal) => getUsers({ page, limit, search: debouncedSearch }, signal), [page, debouncedSearch]);

    if (error) return <p className="status status--error">{error}</p>;

    return (
        <div>
            <header>
                <h1>User Administration</h1>
                <div style={{ marginTop: 8 }}>
                    <input aria-label="Search username" placeholder="Search username" value={search} onChange={event => { setSearch(event.target.value); setPage(1); }} />
                </div>
            </header>

            {loading && !data && <Spinner />}

            <section style={{ marginTop: 16 }}>
                <table className="admin__users">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Banned</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data?.userList || []).map(userItem => (
                            <tr key={userItem.userId}>
                                <td>{userItem.username}</td>
                                <td>{userItem.email}</td>
                                <td>
                                    <select defaultValue={userItem.role} onChange={async (event) => {
                                        await changeRole(userItem.userId, event.target.value);
                                        window.location.reload();
                                    }}>
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td>{userItem.banned ? 'Yes' : 'No'}</td>
                                <td>
                                    {userItem.banned ? (
                                        <button className="btn" onClick={async () => { await unbanUser(userItem.userId); window.location.reload(); }}>Unban</button>
                                    ) : (
                                        <button className="btn btn--danger" onClick={async () => { await banUser(userItem.userId); window.location.reload(); }}>Ban</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination" style={{ marginTop: 12 }}>
                    <button className="btn" disabled={!data || data.page === 1} onClick={() => setPage(prev => Math.max(1, prev - 1))}>Prev</button>
                    <span style={{ margin: '0 8px' }}>Page {data?.page || 1} of {data?.totalPages || 1}</span>
                    <button className="btn" disabled={!data || data.page === data.totalPages} onClick={() => setPage(prev => Math.min(data.totalPages || 1, prev + 1))}>Next</button>
                </div>
            </section>

            {confirmAction && (
                <ConfirmDialog
                    message={confirmAction.message}
                    onConfirm={() => { setConfirmAction(null); confirmAction.onConfirm(); }}
                    onCancel={() => setConfirmAction(null)}
                />
            )}
        </div>
    );
}
