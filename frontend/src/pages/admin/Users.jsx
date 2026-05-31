import { useState } from "react";
import { getUsers, banUser, unbanUser, changeRole } from "../../api/adminUsers.js";
import { useFetch } from "../../hooks/useFetch.js";
import { useDebouncedValue } from "../../hooks/useDebouncedValue.js";
import Spinner from "../../components/Spinner.jsx";

export default function AdminUsers(){
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const limit = 10;
    const debouncedSearch = useDebouncedValue(search, 250);

    const { data, loading, error } = useFetch((signal) => getUsers({ page, limit, search: debouncedSearch }, signal), [page, debouncedSearch]);

    if (error) return <p className="status status--error">{error}</p>;

    return (
        <div>
            <header>
                <h1>User Administration</h1>
                <div style={{ marginTop: 8 }}>
                    <input aria-label="Search username" placeholder="Search username" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
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
                        {(data?.userList || []).map(u => (
                            <tr key={u.userId}>
                                <td>{u.username}</td>
                                <td>{u.email}</td>
                                <td>
                                    <select defaultValue={u.role} onChange={async (e) => {
                                        await changeRole(u.userId, e.target.value);
                                        window.location.reload();
                                    }}>
                                        <option value="user">user</option>
                                        <option value="admin">admin</option>
                                    </select>
                                </td>
                                <td>{u.banned ? 'Yes' : 'No'}</td>
                                <td>
                                    {u.banned ? (
                                        <button className="btn" onClick={async () => { await unbanUser(u.userId); window.location.reload(); }}>Unban</button>
                                    ) : (
                                        <button className="btn btn--danger" onClick={async () => { await banUser(u.userId); window.location.reload(); }}>Ban</button>
                                    )}
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
